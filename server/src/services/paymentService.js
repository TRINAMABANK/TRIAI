import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';
import LicenseEngine from './licenseEngine.js';

export class PaymentService {
  /**
   * Create an order for skills or packages (Status = 'pending', NEVER auto-activated)
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

    // Lấy thông tin user để lưu vào notification
    const user = await db.get('SELECT id, email, full_name FROM users WHERE id = ?', [userId]);
    const userEmail = user?.email || 'Khách vãng lai';
    const userName = user?.full_name || 'Khách hàng';

    await db.transaction(async () => {
      // 1. Insert Order (STATUS = PENDING)
      await db.run(
        `INSERT INTO orders (id, user_id, order_code, total_amount, currency, status, payment_method, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'VND', 'pending', 'vietqr', ?, ?, ?)`,
        [orderId, userId, orderCode, totalAmount, note, now, now]
      );

      // 2. Insert Order Items
      for (const item of resolvedItems) {
        await db.run(
          `INSERT INTO order_items (id, order_id, skill_id, plan_duration, unit_price, total_price, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.id, orderId, item.skillId, item.period, item.price, item.price, now]
        );
      }

      // 3. Create Admin Notification
      const notifId = `notif_${uuidv4().substring(0, 8)}`;
      const skillNames = resolvedItems.map(i => i.skillName).join(', ');
      const notifData = JSON.stringify({
        orderId,
        orderCode,
        userId,
        userEmail,
        userName,
        skills: skillNames,
        totalAmount,
        paymentMethod: 'VietQR / OCB'
      });

      await db.run(
        `INSERT INTO notifications (id, user_id, type, order_id, title, message, data_json, is_read, created_at)
         VALUES (?, 'usr_master_admin', 'payment_pending', ?, ?, ?, ?, 0, ?)`,
        [
          notifId,
          orderId,
          `🔔 Có đơn hàng mới: ${orderCode} (${totalAmount.toLocaleString('vi-VN')} đ)`,
          `Khách hàng ${userName} (${userEmail}) yêu cầu mua Skill [${skillNames}]. Đang chờ xác nhận chuyển khoản.`,
          notifData,
          now
        ]
      );
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
        bankName: env.BANK_NAME || 'Ngân hàng TMCP Phương Đông (OCB)',
        accountNumber: env.BANK_ACCOUNT_NUMBER || '0982441446',
        accountHolder: env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ'
      },
      qrUrl,
      items: resolvedItems,
      createdAt: now
    };
  }

  /**
   * Customer submits payment notification / transaction reference
   * Status remains 'pending', DOES NOT ACTIVATE LICENSE.
   */
  static async submitPaymentProof({ orderId, orderCode, transactionRef, note, userId }) {
    const target = orderId || orderCode;
    if (!target) {
      throw new Error('Thiếu mã đơn hàng.');
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [target, target]);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng tương ứng.');
    }

    if (order.status === 'completed') {
      return {
        success: true,
        status: 'completed',
        message: 'Đơn hàng này đã được Admin xác nhận thanh toán trước đó.'
      };
    }

    const now = new Date().toISOString();
    const txnRef = transactionRef || `REF_${Date.now()}`;

    await db.transaction(async () => {
      // 1. Update order note or reference
      await db.run(
        `UPDATE orders SET note = COALESCE(?, note), updated_at = ? WHERE id = ?`,
        [note ? `${order.note ? order.note + ' | ' : ''}${note}` : null, now, order.id]
      );

      // 2. Insert or update pending payment record
      const existingPay = await db.get('SELECT * FROM payments WHERE order_id = ?', [order.id]);
      if (existingPay) {
        await db.run(
          `UPDATE payments SET transaction_ref = ?, status = 'pending', raw_response_json = ? WHERE id = ?`,
          [txnRef, JSON.stringify({ customerSubmitted: true, at: now, note }), existingPay.id]
        );
      } else {
        const paymentId = `pay_${uuidv4().substring(0, 8)}`;
        await db.run(
          `INSERT INTO payments (id, order_id, user_id, transaction_ref, amount, currency, payment_gateway, status, raw_response_json, created_at)
           VALUES (?, ?, ?, ?, ?, 'VND', 'vietqr', 'pending', ?, ?)`,
          [paymentId, order.id, order.user_id, txnRef, order.total_amount, JSON.stringify({ customerSubmitted: true, at: now }), now]
        );
      }

      // 3. Create or update notification for Admin
      const notifId = `notif_${uuidv4().substring(0, 8)}`;
      const user = await db.get('SELECT email, full_name FROM users WHERE id = ?', [order.user_id]);
      const notifData = JSON.stringify({
        orderId: order.id,
        orderCode: order.order_code,
        userId: order.user_id,
        userEmail: user?.email || 'Khách hàng',
        userName: user?.full_name || 'Khách hàng',
        totalAmount: order.total_amount,
        transactionRef: txnRef
      });

      await db.run(
        `INSERT INTO notifications (id, user_id, type, order_id, title, message, data_json, is_read, created_at)
         VALUES (?, 'usr_master_admin', 'payment_pending', ?, ?, ?, ?, 0, ?)`,
        [
          notifId,
          order.id,
          `🔔 Khách đã chuyển tiền: Đơn ${order.order_code}`,
          `Khách hàng ${user?.email || ''} báo đã chuyển khoản ${order.total_amount.toLocaleString('vi-VN')} đ (Ref: ${txnRef}). Vui lòng kiểm tra tài khoản và xác nhận.`,
          notifData,
          now
        ]
      );
    });

    return {
      success: true,
      status: 'pending',
      orderId: order.id,
      orderCode: order.order_code,
      message: 'Thông tin thanh toán đã được gửi. Vui lòng chờ Quản trị viên đối soát thực tế để kích hoạt bản quyền.'
    };
  }

  /**
   * Admin verifies payment and activates license
   * ONLY ADMIN CAN CALL THIS METHOD.
   */
  static async adminVerifyPayment({ orderId, adminUserId, adminEmail, transactionRef }) {
    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [orderId, orderId]);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng cần phê duyệt.');
    }

    if (order.status === 'completed') {
      return {
        success: true,
        message: 'Đơn hàng đã được phê duyệt và kích hoạt trước đó.',
        orderId: order.id,
        orderCode: order.order_code,
        status: 'completed'
      };
    }

    const now = new Date().toISOString();
    const finalTxnRef = transactionRef || `ADMIN_VERIFIED_${Date.now()}`;
    const verifier = adminEmail || env.ADMIN_EMAIL;

    await db.transaction(async () => {
      // 1. Update order status to 'completed'
      await db.run(
        `UPDATE orders SET status = 'completed', updated_at = ? WHERE id = ?`,
        [now, order.id]
      );

      // 2. Update or insert payment record as 'success'
      const existingPayment = await db.get('SELECT * FROM payments WHERE order_id = ?', [order.id]);
      if (existingPayment) {
        await db.run(
          `UPDATE payments SET status = 'success', transaction_ref = ?, raw_response_json = ? WHERE id = ?`,
          [finalTxnRef, JSON.stringify({ verifiedBy: verifier, at: now }), existingPayment.id]
        );
      } else {
        const paymentId = `pay_${uuidv4().substring(0, 8)}`;
        await db.run(
          `INSERT INTO payments (id, order_id, user_id, transaction_ref, amount, currency, payment_gateway, status, raw_response_json, created_at)
           VALUES (?, ?, ?, ?, ?, 'VND', 'vietqr', 'success', ?, ?)`,
          [paymentId, order.id, order.user_id, finalTxnRef, order.total_amount, JSON.stringify({ verifiedBy: verifier, at: now }), now]
        );
      }

      // 3. Activate licenses for all items in order
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      for (const item of items) {
        const durationDays = item.plan_duration === 'yearly' ? 365 : 30;
        await LicenseEngine.grantLicense({
          userId: order.user_id,
          skillId: item.skill_id,
          licenseType: item.plan_duration === 'yearly' ? 'yearly' : 'monthly',
          durationDays,
          grantedBy: `admin:${verifier}`
        });
      }

      // 4. Record Audit Log
      const auditId = `aud_${uuidv4().substring(0, 8)}`;
      await db.run(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details_json, created_at)
         VALUES (?, ?, 'verify_payment', 'order', ?, ?, ?)`,
        [
          auditId,
          adminUserId || 'usr_master_admin',
          order.id,
          JSON.stringify({
            orderCode: order.order_code,
            amount: order.total_amount,
            verifiedBy: verifier,
            timestamp: now
          }),
          now
        ]
      );

      // 5. Mark notifications for this order as read
      await db.run(
        `UPDATE notifications SET is_read = 1, read_at = ? WHERE order_id = ?`,
        [now, order.id]
      );
    });

    console.log(`✅ [ADMIN] Order ${order.order_code} verified by ${verifier}. License ACTIVATED for user ${order.user_id}.`);

    return {
      success: true,
      message: `Đã xác nhận thanh toán cho đơn hàng ${order.order_code} và kích hoạt bản quyền Skill thành công!`,
      orderId: order.id,
      orderCode: order.order_code,
      status: 'completed'
    };
  }

  /**
   * Admin rejects payment request
   * ONLY ADMIN CAN CALL THIS METHOD.
   */
  static async adminRejectPayment({ orderId, adminUserId, adminEmail, reason = 'Chưa nhận được chuyển khoản hoặc thông tin không khớp' }) {
    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [orderId, orderId]);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng cần từ chối.');
    }

    const now = new Date().toISOString();
    const rejector = adminEmail || env.ADMIN_EMAIL;

    await db.transaction(async () => {
      // 1. Update order status to 'rejected'
      await db.run(
        `UPDATE orders SET status = 'rejected', updated_at = ? WHERE id = ?`,
        [now, order.id]
      );

      // 2. Update payment status to 'failed'
      await db.run(
        `UPDATE payments SET status = 'failed', raw_response_json = ? WHERE order_id = ?`,
        [JSON.stringify({ rejectedBy: rejector, reason, at: now }), order.id]
      );

      // 3. Record Audit Log
      const auditId = `aud_${uuidv4().substring(0, 8)}`;
      await db.run(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details_json, created_at)
         VALUES (?, ?, 'reject_payment', 'order', ?, ?, ?)`,
        [
          auditId,
          adminUserId || 'usr_master_admin',
          order.id,
          JSON.stringify({
            orderCode: order.order_code,
            rejectedBy: rejector,
            reason,
            timestamp: now
          }),
          now
        ]
      );

      // 4. Mark notifications as read
      await db.run(
        `UPDATE notifications SET is_read = 1, read_at = ? WHERE order_id = ?`,
        [now, order.id]
      );
    });

    return {
      success: true,
      message: `Đã từ chối đơn hàng ${order.order_code}.`,
      orderId: order.id,
      orderCode: order.order_code,
      status: 'rejected'
    };
  }

  /**
   * Generate VietQR image URL
   */
  static generateVietQRUrl({ amount, orderCode }) {
    const bank = env.BANK_NAME_CODE || 'OCB';
    const acc = env.BANK_ACCOUNT_NUMBER || '0982441446';
    const name = encodeURIComponent(env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ');
    const memo = encodeURIComponent(orderCode || 'TRIAI');
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${name}`;
  }
}

export default PaymentService;
