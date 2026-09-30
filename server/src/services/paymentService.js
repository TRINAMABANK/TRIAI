import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';
import LicenseEngine from './licenseEngine.js';

export class PaymentService {
  /**
   * Create an order for skills or packages
   */
  static async createOrder({ userId, items = [], note = '' }) {
    if (!items || items.length === 0) {
      throw new Error('Đơn hàng cần ít nhất 1 sản phẩm.');
    }

    const orderId = `ord_${uuidv4().substring(0, 8)}`;
    const orderCode = `TRIAI-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    let totalAmount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const skill = await db.get('SELECT * FROM skills WHERE id = ?', [item.skillId]);
      if (!skill) continue;

      let price = 199000;
      if (item.period === 'yearly') {
        price = 1990000;
      } else {
        const cleanedPrice = parseInt(String(skill.price_month || '199000').replace(/\D/g, ''), 10);
        if (!isNaN(cleanedPrice) && cleanedPrice > 0) price = cleanedPrice;
      }

      totalAmount += price;
      resolvedItems.push({
        id: `odi_${uuidv4().substring(0, 8)}`,
        orderId,
        skillId: skill.id,
        skillName: skill.name,
        period: item.period || 'monthly',
        price
      });
    }

    await db.transaction(async () => {
      await db.run(
        `INSERT INTO orders (id, user_id, order_code, total_amount, currency, status, payment_method, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'VND', 'pending', 'vietqr', ?, ?, ?)`,
        [orderId, userId, orderCode, totalAmount, note, now, now]
      );

      for (const item of resolvedItems) {
        await db.run(
          `INSERT INTO order_items (id, order_id, skill_id, plan_duration, unit_price, total_price, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.id, orderId, item.skillId, item.period, item.price, item.price, now]
        );
      }
    });

    const qrUrl = this.generateVietQRUrl({
      amount: totalAmount,
      orderCode
    });

    return {
      orderId,
      orderCode,
      totalAmount,
      status: 'pending',
      bankInfo: {
        bankName: env.BANK_NAME,
        accountNumber: env.BANK_ACCOUNT_NUMBER,
        accountHolder: env.BANK_ACCOUNT_HOLDER
      },
      qrUrl,
      items: resolvedItems,
      createdAt: now
    };
  }

  /**
   * Generate VietQR image URL
   */
  static generateVietQRUrl({ amount, orderCode }) {
    const bank = env.BANK_NAME || 'OCB';
    const acc = env.BANK_ACCOUNT_NUMBER || '0004100030588008';
    const name = encodeURIComponent(env.BANK_ACCOUNT_HOLDER || 'NGUYEN QUANG TRI');
    const memo = encodeURIComponent(orderCode || 'TRIAI');
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${name}`;
  }

  /**
   * Confirm payment and automatically activate licenses
   */
  static async confirmPayment(orderId, transactionRef = `TXN_${Date.now()}`) {
    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [orderId, orderId]);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng cần thanh toán.');
    }

    if (order.status === 'completed') {
      return { success: true, message: 'Đơn hàng đã được thanh toán và kích hoạt trước đó.', order };
    }

    const now = new Date().toISOString();
    const paymentId = `pay_${uuidv4().substring(0, 8)}`;

    await db.transaction(async () => {
      // 1. Update order status
      await db.run(
        `UPDATE orders SET status = 'completed', updated_at = ? WHERE id = ?`,
        [now, order.id]
      );

      // 2. Insert payment record
      await db.run(
        `INSERT INTO payments (id, order_id, user_id, amount, currency, payment_gateway, transaction_ref, status, raw_response_json, created_at)
         VALUES (?, ?, ?, ?, 'VND', 'vietqr', ?, 'success', ?, ?)`,
        [paymentId, order.id, order.user_id, order.total_amount, transactionRef, JSON.stringify({ verified: true, at: now }), now]
      );

      // 3. Auto-grant licenses for all items in order
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      for (const item of items) {
        const durationDays = item.plan_duration === 'yearly' ? 365 : 30;
        await LicenseEngine.grantLicense({
          userId: order.user_id,
          skillId: item.skill_id,
          licenseType: item.plan_duration === 'yearly' ? 'yearly' : 'monthly',
          durationDays,
          grantedBy: 'vietqr_auto_activate'
        });
      }
    });

    console.log(`✅ Order ${order.order_code} paid successfully. Auto-activated licenses for user ${order.user_id}.`);

    return {
      success: true,
      message: 'Thanh toán thành công! Bản quyền Skill đã được tự động kích hoạt.',
      orderId: order.id,
      orderCode: order.order_code,
      status: 'completed'
    };
  }
}

export default PaymentService;
