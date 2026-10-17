import express from 'express';
import db from '../db/index.js';
import PaymentService from '../services/paymentService.js';
import defaultBankProvider from '../services/bankPaymentProvider.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/payments/confirm
 * STRICT ADMIN-ONLY: Customers are strictly forbidden from confirming payments.
 * Requires valid actualAmount and actual bank transaction ref.
 */
router.post('/confirm', requireAdmin, async (req, res, next) => {
  try {
    const { orderId, orderCode, transactionRef, bankTransactionRef, actualAmount, notes, transactionTime } = req.body;
    const targetId = orderId || orderCode;
    const targetRef = (bankTransactionRef || transactionRef || '').trim();

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Thiếu mã đơn hàng cần xác nhận.' });
    }
    if (!targetRef) {
      return res.status(400).json({ success: false, error: 'Mã giao dịch ngân hàng thực tế là bắt buộc.' });
    }
    if (actualAmount === undefined || actualAmount === null || actualAmount === '') {
      return res.status(400).json({ success: false, error: 'Số tiền thực nhận từ ngân hàng là bắt buộc.' });
    }

    const result = await PaymentService.adminVerifyPayment({
      orderId: targetId,
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      actualAmount,
      bankTransactionRef: targetRef,
      transactionTime,
      notes
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/submit-proof
 * Customer notifies that they have transferred money (STATUS = PENDING, NO LICENSE ACTIVATED)
 */
router.post('/submit-proof', requireAuth, async (req, res, next) => {
  try {
    const { orderId, orderCode, transactionRef, note } = req.body;
    const targetId = orderId || orderCode;

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Thiếu mã đơn hàng.' });
    }

    const result = await PaymentService.submitPaymentProof({
      orderId: targetId,
      orderCode,
      transactionRef,
      note,
      userId: req.user.id
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/payments/provider-status
 * Query bank payment provider configuration status & required environment variables
 */
router.get('/provider-status', (req, res) => {
  const providerInfo = defaultBankProvider.getProviderInfo();
  res.json({
    success: true,
    data: providerInfo
  });
});

/**
 * POST /api/payments/webhook
 * Automated webhook listener with cryptographic signature verification,
 * replay attack prevention, amount check, and atomic license activation.
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const verification = defaultBankProvider.verifyWebhook(req);

    if (!verification.valid) {
      return res.status(verification.statusCode || 400).json({
        success: false,
        error: verification.reason,
        mode: defaultBankProvider.providerName,
        requiredCredentials: defaultBankProvider.getRequiredCredentials()
      });
    }

    const { transactions } = verification;
    if (!transactions || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Webhook không chứa dữ liệu giao dịch hợp lệ.'
      });
    }

    const results = [];

    for (const t of transactions) {
      // 1. Anti-replay protection: check if bankTransactionRef already verified
      const existingPayment = await db.get(
        `SELECT id, order_id FROM payments WHERE bank_transaction_ref = ? AND status = 'verified'`,
        [t.bankTransactionRef]
      );
      if (existingPayment) {
        return res.status(409).json({
          success: false,
          error: `Mã giao dịch ngân hàng '${t.bankTransactionRef}' đã được đối soát trước đó (Chống phát lại / Anti-replay).`,
          bankTransactionRef: t.bankTransactionRef
        });
      }

      // 2. Validate order code
      if (!t.orderCode) {
        return res.status(400).json({
          success: false,
          error: `Không tìm thấy mã đơn hàng TRÍ AI (TRIAI-xxxx) trong nội dung chuyển khoản: '${t.content || ''}'.`
        });
      }

      // 3. Find order in database
      const order = await db.get(
        `SELECT * FROM orders WHERE order_code = ?`,
        [t.orderCode]
      );
      if (!order) {
        return res.status(404).json({
          success: false,
          error: `Không tìm thấy đơn hàng ${t.orderCode} trong hệ thống.`
        });
      }

      // 4. If already paid, return idempotent response
      if (order.status === 'completed' || order.status === 'paid') {
        results.push({
          orderCode: order.order_code,
          status: 'already_paid',
          message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.'
        });
        continue;
      }

      // 5. Amount mismatch validation
      if (order.total_amount !== t.amount) {
        return res.status(400).json({
          success: false,
          error: `Số tiền chuyển (${t.amount.toLocaleString('vi-VN')} đ) không khớp với số tiền đơn hàng (${order.total_amount.toLocaleString('vi-VN')} đ).`
        });
      }

      // 6. Execute atomic verification and license activation
      const verified = await PaymentService.adminVerifyPayment({
        orderId: order.id,
        actualAmount: t.amount,
        bankTransactionRef: t.bankTransactionRef,
        transactionTime: t.transactionTime,
        verifier: `webhook_${defaultBankProvider.providerName}`,
        notes: `Tự động đối soát từ Webhook ${defaultBankProvider.providerName.toUpperCase()}`
      });

      results.push(verified);
    }

    res.json({
      success: true,
      message: 'Đã xác thực và đối soát đơn hàng thành công từ Webhook ngân hàng.',
      results
    });
  } catch (err) {
    next(err);
  }
});

export default router;
