import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';
import LicenseEngine from './licenseEngine.js';
import { resolveOrderProduct } from '../config/pricing.js';

export class PaymentService {
  /**
   * Create an order on server-side
   * Backend strictly resolves product prices and calculates totalAmount.
   */
  static async createOrder({ userId, items = [], note = '' }) {
    if (!items || items.length === 0) {
      throw new Error('Đơn hàng cần ít nhất 1 sản phẩm.');
    }

    if (!userId) {
      throw new Error('Vui lòng đăng nhập để tạo đơn hàng.');
    }

    const orderId = `ord_${uuidv4().substring(0, 8)}`;
    const orderCode = `TRIAI-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    let totalAmount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const targetId = item.productId || item.skillId || item.id;
      const period = item.period || item.billingCycle || 'monthly';
      const product = resolveOrderProduct(targetId, period);

      totalAmount += product.price;
      resolvedItems.push({
        id: `odi_${uuidv4().substring(0, 8)}`,
        orderId,
        productId: product.productId,
        skillId: product.productId,
        skillName: product.productName,
        type: product.type,
        period: product.period,
        price: product.price,
        includedSkills: product.includedSkills
      });
    }

    // Lấy thông tin user để lưu snapshot và notification
    const user = await db.get('SELECT id, email, full_name FROM users WHERE id = ?', [userId]);
    const userEmail = user?.email || 'Khách hàng';
    const userName = user?.full_name || 'Khách hàng';

    await db.transaction(async () => {
      // 1. Insert Order (STATUS = PENDING)
      await db.run(
        `INSERT INTO orders (id, user_id, order_code, total_amount, currency, status, payment_method, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'VND', 'pending', 'vietqr', ?, ?, ?)`,
        [orderId, userId, orderCode, totalAmount, note, now, now]
      );

      // 2. Insert Order Items with snapshot price
      for (const item of resolvedItems) {
        await db.run(
          `INSERT INTO order_items (id, order_id, skill_id, skill_name, plan_duration, unit_price, total_price, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, orderId, item.skillId, item.skillName, item.period, item.price, item.price, now]
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
        `INSERT INTO notifications (id, user_id, type, title, message, resource_type, resource_id, data_json, is_read, created_at)
         VALUES (?, 'usr_master_admin', 'payment_pending', ?, ?, 'order', ?, ?, 0, ?)`,
        [
          notifId,
          `🔔 Có đơn hàng mới: ${orderCode} (${totalAmount.toLocaleString('vi-VN')} đ)`,
          `Khách hàng ${userName} (${userEmail}) vừa tạo đơn mua Skill [${skillNames}].`,
          orderId,
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
      formattedAmount: totalAmount.toLocaleString('vi-VN') + ' đ',
      status: 'pending',
      bankInfo: {
        bankName: env.BANK_NAME || 'OCB',
        bankFullName: 'Ngân hàng TMCP Phương Đông (OCB)',
        accountNumber: env.BANK_ACCOUNT_NUMBER || '0982441446',
        accountHolder: env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ'
      },
      transferContent: orderCode,
      qrUrl,
      items: resolvedItems,
      createdAt: now
    };
  }

  /**
   * Customer submits payment request after transferring money (POST /api/orders/:orderId/payment-request)
   * - Must be the owner of the order
   * - Sets payment to pending
   * - Writes audit log
   * - Creates Admin notification
   * - DOES NOT GRANT LICENSE
   */
  static async requestPayment({ orderId, userId, transactionRef = '', note = '' }) {
    if (!orderId) {
      throw new Error('Thiếu mã đơn hàng.');
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [orderId, orderId]);
    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng tương ứng.');
      err.status = 404;
      throw err;
    }

    if (order.user_id !== userId) {
      const err = new Error('Bạn không có quyền gửi yêu cầu thanh toán cho đơn hàng này.');
      err.status = 403;
      throw err;
    }

    if (order.status === 'completed' || order.status === 'paid') {
      return {
        success: true,
        status: 'completed',
        message: 'Đơn hàng này đã được xác nhận thanh toán trước đó.'
      };
    }

    const now = new Date().toISOString();
    const txnRef = transactionRef || `REF_${order.order_code}`;

    await db.transaction(async () => {
      // 1. Update order note
      if (note) {
        await db.run(
          `UPDATE orders SET note = ?, updated_at = ? WHERE id = ?`,
          [order.note ? `${order.note} | ${note}` : note, now, order.id]
        );
      }

      // 2. Insert or update payments table as 'pending'
      const existingPay = await db.get('SELECT * FROM payments WHERE order_id = ?', [order.id]);
      if (existingPay) {
        await db.run(
          `UPDATE payments SET transaction_ref = ?, status = 'pending', raw_response_json = ?, updated_at = ? WHERE id = ?`,
          [txnRef, JSON.stringify({ customerSubmitted: true, at: now, note }), now, existingPay.id]
        );
      } else {
        const paymentId = `pay_${uuidv4().substring(0, 8)}`;
        await db.run(
          `INSERT INTO payments (id, order_id, user_id, transaction_ref, amount, currency, payment_gateway, bank_name, account_number, account_name, status, raw_response_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'VND', 'vietqr', ?, ?, ?, 'pending', ?, ?, ?)`,
          [
            paymentId,
            order.id,
            order.user_id,
            txnRef,
            order.total_amount,
            env.BANK_NAME || 'OCB',
            env.BANK_ACCOUNT_NUMBER || '0982441446',
            env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ',
            JSON.stringify({ customerSubmitted: true, at: now }),
            now,
            now
          ]
        );
      }

      // 3. Insert Audit Log
      const auditId = `aud_${uuidv4().substring(0, 8)}`;
      await db.run(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details_json, created_at)
         VALUES (?, ?, 'payment_request', 'order', ?, ?, ?)`,
        [
          auditId,
          userId,
          order.id,
          JSON.stringify({
            orderCode: order.order_code,
            amount: order.total_amount,
            transactionRef: txnRef,
            note
          }),
          now
        ]
      );

      // 4. Create Notification for Admin
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
        `INSERT INTO notifications (id, user_id, type, title, message, resource_type, resource_id, data_json, is_read, created_at)
         VALUES (?, 'usr_master_admin', 'payment_pending', ?, ?, 'order', ?, ?, 0, ?)`,
        [
          notifId,
          `🔔 Khách hàng vừa gửi yêu cầu thanh toán`,
          `Khách hàng ${user?.email || ''} báo đã chuyển khoản ${order.total_amount.toLocaleString('vi-VN')} đ cho đơn ${order.order_code}. Vui lòng đối soát thực tế.`,
          order.id,
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
      message: 'Đã gửi yêu cầu. Đang chờ Admin đối soát.'
    };
  }

  /**
   * Admin verifies actual bank transaction and activates licenses
   */
  static async adminVerifyPayment({ orderId, adminUserId, adminEmail, transactionRef }) {
    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [orderId, orderId]);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng cần phê duyệt.');
    }

    if (order.status === 'completed' || order.status === 'paid') {
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

      // 2. Update or insert payment record as 'verified'
      const existingPayment = await db.get('SELECT * FROM payments WHERE order_id = ?', [order.id]);
      if (existingPayment) {
        await db.run(
          `UPDATE payments SET status = 'verified', transaction_ref = ?, verified_at = ?, verified_by = ?, raw_response_json = ?, updated_at = ? WHERE id = ?`,
          [finalTxnRef, now, verifier, JSON.stringify({ verifiedBy: verifier, at: now }), now, existingPayment.id]
        );
      } else {
        const paymentId = `pay_${uuidv4().substring(0, 8)}`;
        await db.run(
          `INSERT INTO payments (id, order_id, user_id, transaction_ref, amount, currency, payment_gateway, bank_name, account_number, account_name, status, verified_at, verified_by, raw_response_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'VND', 'vietqr', ?, ?, ?, 'verified', ?, ?, ?, ?, ?)`,
          [
            paymentId,
            order.id,
            order.user_id,
            finalTxnRef,
            order.total_amount,
            env.BANK_NAME || 'OCB',
            env.BANK_ACCOUNT_NUMBER || '0982441446',
            env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ',
            now,
            verifier,
            JSON.stringify({ verifiedBy: verifier, at: now }),
            now,
            now
          ]
        );
      }

      // 3. Activate licenses for all items in order
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      for (const item of items) {
        const durationDays = item.plan_duration === 'yearly' ? 365 : 30;
        const product = resolveOrderProduct(item.skill_id, item.plan_duration);

        let targetSkills = [];
        if (product.includedSkills === 'all_33') {
          const all = await db.all('SELECT id FROM skills');
          targetSkills = all.map(s => s.id);
        } else if (Array.isArray(product.includedSkills)) {
          targetSkills = product.includedSkills;
        } else {
          targetSkills = [item.skill_id];
        }

        for (const skId of targetSkills) {
          await LicenseEngine.grantLicense({
            userId: order.user_id,
            skillId: skId,
            licenseType: item.plan_duration === 'yearly' ? 'yearly' : 'monthly',
            durationDays,
            grantedBy: verifier
          });
        }
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
        `UPDATE notifications SET is_read = 1, read_at = ? WHERE resource_id = ? OR resource_id = ?`,
        [now, order.id, order.order_code]
      );

      // 6. Create Notification for Customer
      const custNotifId = `notif_${uuidv4().substring(0, 8)}`;
      await db.run(
        `INSERT INTO notifications (id, user_id, type, title, message, resource_type, resource_id, is_read, created_at)
         VALUES (?, ?, 'payment_verified', 'Thanh toán đã được xác nhận', ?, 'order', ?, 0, ?)`,
        [
          custNotifId,
          order.user_id,
          `Đơn hàng ${order.order_code} của bạn đã được Admin xác nhận thanh toán. Bản quyền Skill đã được kích hoạt thành công!`,
          order.id,
          now
        ]
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
   */
  static async adminRejectPayment({ orderId, adminUserId, adminEmail, reason = 'Không tìm thấy giao dịch ngân hàng khớp' }) {
    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [orderId, orderId]);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng cần từ chối.');
    }

    const now = new Date().toISOString();
    const rejector = adminEmail || env.ADMIN_EMAIL;

    await db.transaction(async () => {
      // 1. Update order status to 'cancelled'
      await db.run(
        `UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?`,
        [now, order.id]
      );

      // 2. Update payment status to 'failed'
      await db.run(
        `UPDATE payments SET status = 'failed', raw_response_json = ?, updated_at = ? WHERE order_id = ?`,
        [JSON.stringify({ rejectedBy: rejector, reason, at: now }), now, order.id]
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

      // 4. Mark admin notifications as read
      await db.run(
        `UPDATE notifications SET is_read = 1, read_at = ? WHERE resource_id = ? OR resource_id = ?`,
        [now, order.id, order.order_code]
      );

      // 5. Notify customer
      const custNotifId = `notif_${uuidv4().substring(0, 8)}`;
      await db.run(
        `INSERT INTO notifications (id, user_id, type, title, message, resource_type, resource_id, is_read, created_at)
         VALUES (?, ?, 'payment_rejected', 'Yêu cầu thanh toán không được phê duyệt', ?, 'order', ?, 0, ?)`,
        [
          custNotifId,
          order.user_id,
          `Đơn hàng ${order.order_code} của bạn bị từ chối: ${reason}. Vui lòng liên hệ Admin để được hỗ trợ.`,
          order.id,
          now
        ]
      );
    });

    return {
      success: true,
      message: `Đã từ chối đơn hàng ${order.order_code}.`,
      orderId: order.id,
      orderCode: order.order_code,
      status: 'cancelled'
    };
  }

  /**
   * Generate VietQR Quick Link
   */
  static generateVietQRUrl({ amount, orderCode }) {
    const bank = env.BANK_NAME || 'OCB';
    const acc = env.BANK_ACCOUNT_NUMBER || '0982441446';
    const name = encodeURIComponent(env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ');
    const memo = encodeURIComponent(orderCode || 'TRIAI');
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${name}`;
  }
}

export default PaymentService;
