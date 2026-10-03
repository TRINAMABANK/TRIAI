import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';
import LicenseEngine from './licenseEngine.js';
import { resolveOrderProduct } from '../config/pricing.js';
import EmailService from './emailService.js';
import defaultBankProvider from './bankPaymentProvider.js';

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

    // Reuse existing pending order if created within the last 60 minutes for the same skill
    const targetSkillId = resolvedItems[0]?.skillId;
    const existingPending = await db.get(
      `SELECT o.* FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = ? AND o.status = 'pending' AND oi.skill_id = ? 
       AND datetime(o.created_at) > datetime('now', '-60 minutes')
       ORDER BY o.created_at DESC LIMIT 1`,
      [userId, targetSkillId]
    );

    if (existingPending) {
      const qrUrl = this.generateVietQRUrl({
        amount: existingPending.total_amount,
        orderCode: existingPending.order_code
      });
      return {
        orderId: existingPending.id,
        orderCode: existingPending.order_code,
        totalAmount: existingPending.total_amount,
        formattedAmount: existingPending.total_amount.toLocaleString('vi-VN') + ' đ',
        status: 'pending',
        bankInfo: {
          bankName: env.BANK_NAME || 'OCB',
          bankFullName: 'Ngân hàng TMCP Phương Đông (OCB)',
          accountNumber: env.BANK_ACCOUNT_NUMBER || '0982441446',
          accountHolder: env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ'
        },
        transferContent: existingPending.order_code,
        qrUrl,
        items: resolvedItems,
        createdAt: existingPending.created_at,
        isReused: true
      };
    }

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
   * Admin verifies actual bank transaction, performs strict reconciliation, and activates licenses
   */
  static async adminVerifyPayment({
    orderId,
    adminUserId,
    adminEmail,
    actualAmount,
    bankTransactionRef = '',
    transactionTime = '',
    notes = ''
  }) {
    const order = await db.get('SELECT * FROM orders WHERE id = ? OR order_code = ?', [orderId, orderId]);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng cần phê duyệt.');
    }

    if (order.status === 'completed' || order.status === 'paid') {
      return {
        success: true,
        message: 'Đơn hàng đã được đối soát và kích hoạt trước đó.',
        orderId: order.id,
        orderCode: order.order_code,
        status: 'completed'
      };
    }

    const verifiedAmt = typeof actualAmount === 'number' ? actualAmount : parseInt(actualAmount || order.total_amount, 10);

    // Strict validation: Amount must match exactly
    if (verifiedAmt !== order.total_amount) {
      throw new Error(`Số tiền thực nhận (${verifiedAmt.toLocaleString('vi-VN')} đ) không khớp với tổng tiền đơn hàng (${order.total_amount.toLocaleString('vi-VN')} đ).`);
    }

    // Strict validation: Bank transaction reference must be unique if provided
    const cleanBankRef = bankTransactionRef ? bankTransactionRef.trim() : `FT_${Date.now()}`;
    if (bankTransactionRef && bankTransactionRef.trim()) {
      const duplicateRef = await db.get(
        `SELECT p.id, o.order_code FROM payments p 
         JOIN orders o ON p.order_id = o.id 
         WHERE p.bank_transaction_ref = ? AND p.status = 'verified' AND p.order_id != ?`,
        [cleanBankRef, order.id]
      );
      if (duplicateRef) {
        throw new Error(`Mã giao dịch ngân hàng '${cleanBankRef}' đã được đối soát cho đơn hàng ${duplicateRef.order_code}. Vui lòng kiểm tra lại.`);
      }
    }

    const now = new Date().toISOString();
    const verifiedTimestamp = transactionTime || now;
    const verifier = adminEmail || env.ADMIN_EMAIL;

    // Fetch customer details for notification and email
    const customer = await db.get('SELECT id, email, full_name FROM users WHERE id = ?', [order.user_id]);
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const productNames = items.map(i => i.skill_name || i.skill_id).join(', ');

    let calculatedExpiresAt = null;

    await db.transaction(async () => {
      // 1. Update order status to 'paid' (or completed)
      await db.run(
        `UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?`,
        [now, order.id]
      );

      // 2. Update or insert payment record as 'verified'
      const existingPayment = await db.get('SELECT * FROM payments WHERE order_id = ?', [order.id]);
      if (existingPayment) {
        await db.run(
          `UPDATE payments 
           SET status = 'verified', 
               bank_transaction_ref = ?, 
               verified_amount = ?, 
               reconciliation_type = 'manual',
               verification_notes = ?,
               verified_at = ?, 
               verified_by = ?, 
               raw_response_json = ?, 
               updated_at = ? 
           WHERE id = ?`,
          [
            cleanBankRef,
            verifiedAmt,
            notes,
            verifiedTimestamp,
            verifier,
            JSON.stringify({ verifiedBy: verifier, bankRef: cleanBankRef, at: now, notes }),
            now,
            existingPayment.id
          ]
        );
      } else {
        const paymentId = `pay_${uuidv4().substring(0, 8)}`;
        await db.run(
          `INSERT INTO payments (id, order_id, user_id, transaction_ref, bank_transaction_ref, amount, verified_amount, currency, payment_gateway, bank_name, account_number, account_name, status, reconciliation_type, verification_notes, verified_at, verified_by, raw_response_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'VND', 'vietqr', ?, ?, ?, 'verified', 'manual', ?, ?, ?, ?, ?, ?)`,
          [
            paymentId,
            order.id,
            order.user_id,
            `REF_${order.order_code}`,
            cleanBankRef,
            order.total_amount,
            verifiedAmt,
            env.BANK_NAME || 'OCB',
            env.BANK_ACCOUNT_NUMBER || '0982441446',
            env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ',
            notes,
            verifiedTimestamp,
            verifier,
            JSON.stringify({ verifiedBy: verifier, bankRef: cleanBankRef, at: now, notes }),
            now,
            now
          ]
        );
      }

      // 3. Activate licenses for all items in order
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
          const lic = await LicenseEngine.grantLicense({
            userId: order.user_id,
            skillId: skId,
            licenseType: item.plan_duration === 'yearly' ? 'yearly' : 'monthly',
            durationDays,
            grantedBy: verifier
          });
          if (lic && lic.expiresAt) {
            calculatedExpiresAt = lic.expiresAt;
          }
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
            amount: verifiedAmt,
            bankTransactionRef: cleanBankRef,
            verifiedBy: verifier,
            timestamp: now
          }),
          now
        ]
      );

      // 5. Mark admin notifications for this order as read
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
          `Đơn hàng ${order.order_code} của bạn đã được Admin xác nhận thanh toán (${verifiedAmt.toLocaleString('vi-VN')} đ). Bản quyền Skill đã được kích hoạt thành công!`,
          order.id,
          now
        ]
      );

      // 7. Auto-cancel duplicate pending orders for this user
      await db.run(
        `UPDATE orders SET status = 'cancelled', updated_at = ? WHERE user_id = ? AND id != ? AND status = 'pending'`,
        [now, order.user_id, order.id]
      );
    });

    console.log(`✅ [ADMIN] Order ${order.order_code} verified by ${verifier}. License ACTIVATED for user ${order.user_id}.`);

    // 8. Send Confirmation Email (Asynchronous, post-commit)
    if (customer?.email) {
      EmailService.sendPaymentVerifiedEmail({
        userId: customer.id,
        userEmail: customer.email,
        userName: customer.full_name,
        orderCode: order.order_code,
        orderId: order.id,
        productName: productNames,
        amount: verifiedAmt,
        expiresAt: calculatedExpiresAt
      }).catch(e => console.error('[EMAIL DISPATCH ERROR]', e.message));
    }

    return {
      success: true,
      message: `Đã đối soát thành công đơn hàng ${order.order_code} và kích hoạt bản quyền Skill!`,
      orderId: order.id,
      orderCode: order.order_code,
      status: 'paid',
      bankTransactionRef: cleanBankRef,
      verifiedAmount: verifiedAmt
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
    const customer = await db.get('SELECT id, email, full_name FROM users WHERE id = ?', [order.user_id]);

    await db.transaction(async () => {
      // 1. Update order status to 'cancelled'
      await db.run(
        `UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?`,
        [now, order.id]
      );

      // 2. Update payment status to 'rejected'
      await db.run(
        `UPDATE payments SET status = 'rejected', raw_response_json = ?, updated_at = ? WHERE order_id = ?`,
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

      // 5. Create Notification for Customer
      const custNotifId = `notif_${uuidv4().substring(0, 8)}`;
      await db.run(
        `INSERT INTO notifications (id, user_id, type, title, message, resource_type, resource_id, is_read, created_at)
         VALUES (?, ?, 'payment_rejected', 'Thanh toán chưa được xác nhận', ?, 'order', ?, 0, ?)`,
        [
          custNotifId,
          order.user_id,
          `Yêu cầu thanh toán đơn hàng ${order.order_code} chưa thể đối soát. Lý do: ${reason}. Vui lòng liên hệ Admin để được hỗ trợ.`,
          order.id,
          now
        ]
      );
    });

    // 6. Send Rejection Email (Post-commit)
    if (customer?.email) {
      EmailService.sendPaymentRejectedEmail({
        userId: customer.id,
        userEmail: customer.email,
        userName: customer.full_name,
        orderCode: order.order_code,
        orderId: order.id,
        amount: order.total_amount,
        reason
      }).catch(e => console.error('[EMAIL DISPATCH ERROR]', e.message));
    }

    return {
      success: true,
      message: `Đã từ chối đơn hàng ${order.order_code}.`,
      orderId: order.id,
      orderCode: order.order_code,
      status: 'cancelled'
    };
  }

  /**
   * Get payments & revenue reconciliation data for Admin Center
   */
  static async getPaymentsForAdmin({ status, dateFrom, dateTo, customer, email, orderCode } = {}) {
    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (orderCode) {
      whereClause += ' AND (o.order_code LIKE ? OR p.transaction_ref LIKE ? OR p.bank_transaction_ref LIKE ?)';
      params.push(`%${orderCode}%`, `%${orderCode}%`, `%${orderCode}%`);
    }

    if (email) {
      whereClause += ' AND u.email LIKE ?';
      params.push(`%${email}%`);
    }

    if (customer) {
      whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${customer}%`, `%${customer}%`);
    }

    if (dateFrom) {
      whereClause += ' AND date(p.created_at) >= date(?)';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND date(p.created_at) <= date(?)';
      params.push(dateTo);
    }

    const payments = await db.all(
      `SELECT 
        p.id,
        p.order_id,
        p.user_id,
        p.transaction_ref,
        p.bank_transaction_ref,
        p.amount,
        p.verified_amount,
        p.status as payment_status,
        p.reconciliation_type,
        p.verification_notes,
        p.bank_name,
        p.account_number,
        p.account_name,
        p.verified_at,
        p.verified_by,
        p.created_at,
        p.updated_at,
        o.order_code,
        o.total_amount as order_amount,
        o.status as order_status,
        u.email as customer_email,
        u.full_name as customer_name
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    );

    // Fetch order items for each payment
    for (const payment of payments) {
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [payment.order_id]);
      payment.items = items;
      payment.productSummary = items.map(i => `${i.skill_name || i.skill_id} (${i.plan_duration})`).join(', ');
    }

    // Calculate Strict Verified Revenue KPIs
    const todayRevenueRow = await db.get(
      `SELECT COALESCE(SUM(verified_amount), 0) as total 
       FROM payments 
       WHERE status = 'verified' AND date(verified_at) = date('now')`
    );

    const monthRevenueRow = await db.get(
      `SELECT COALESCE(SUM(verified_amount), 0) as total 
       FROM payments 
       WHERE status = 'verified' AND strftime('%Y-%m', verified_at) = strftime('%Y-%m', 'now')`
    );

    const yearRevenueRow = await db.get(
      `SELECT COALESCE(SUM(verified_amount), 0) as total 
       FROM payments 
       WHERE status = 'verified' AND strftime('%Y', verified_at) = strftime('%Y', 'now')`
    );

    const totalRevenueRow = await db.get(
      `SELECT COALESCE(SUM(verified_amount), 0) as total 
       FROM payments 
       WHERE status = 'verified'`
    );

    const countPending = await db.get(`SELECT COUNT(*) as count FROM payments WHERE status = 'pending'`);
    const countVerified = await db.get(`SELECT COUNT(*) as count FROM payments WHERE status = 'verified'`);
    const countRejected = await db.get(`SELECT COUNT(*) as count FROM payments WHERE status = 'rejected'`);
    const countTotal = await db.get(`SELECT COUNT(*) as count FROM payments`);

    return {
      providerInfo: defaultBankProvider.getProviderInfo(),
      kpis: {
        todayRevenue: todayRevenueRow?.total || 0,
        thisMonthRevenue: monthRevenueRow?.total || 0,
        thisYearRevenue: yearRevenueRow?.total || 0,
        totalRevenue: totalRevenueRow?.total || 0,
        pendingCount: countPending?.count || 0,
        verifiedCount: countVerified?.count || 0,
        rejectedCount: countRejected?.count || 0,
        totalCount: countTotal?.count || 0
      },
      payments
    };
  }

  /**
   * Get orders for a specific customer
   */
  static async getCustomerOrders(userId) {
    if (!userId) return [];

    const orders = await db.all(
      `SELECT o.*, p.status as payment_status, p.bank_transaction_ref, p.verified_at
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    for (const order of orders) {
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
      order.productName = items.map(i => i.skill_name || i.skill_id).join(', ');

      // Check licenses granted for this order items
      const licenses = await db.all(
        `SELECT l.* FROM licenses l 
         WHERE l.user_id = ? AND l.skill_id IN (${items.map(() => '?').join(',') || "''"})`,
        [userId, ...items.map(i => i.skill_id)]
      );
      order.licenses = licenses;
      order.licenseStatus = licenses.some(l => l.status === 'active') ? 'active' : (order.status === 'paid' ? 'active' : 'inactive');
    }

    return orders;
  }

  /**
   * Helper: Generate VietQR quick link
   */
  static generateVietQRUrl({ amount, orderCode }) {
    const bankCode = encodeURIComponent(env.BANK_NAME || 'OCB');
    const accountNo = encodeURIComponent(env.BANK_ACCOUNT_NUMBER || '0982441446');
    const accountName = encodeURIComponent(env.BANK_ACCOUNT_HOLDER || 'QUANG NHUT TRI');
    const memo = encodeURIComponent(orderCode);
    return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${accountName}`;
  }
}

export default PaymentService;
