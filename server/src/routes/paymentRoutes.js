import express from 'express';
import PaymentService from '../services/paymentService.js';
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
 * POST /api/payments/webhook
 * Automated webhook listener (DISABLED FOR DIRECT LICENSE ACTIVATION)
 * Real bank settlements must be verified by Admin or secured webhook with HMAC signature.
 */
router.post('/webhook', (req, res) => {
  console.log('⚠️ [WEBHOOK] Received payment notification webhook. Auto-activation is DISABLED by security policy.');
  res.status(200).json({
    success: true,
    webhookReceived: true,
    autoGrant: false,
    message: 'Hệ thống đang hoạt động ở chế độ Quản trị viên đối soát trực tiếp. Đơn hàng sẽ được kích hoạt sau khi Admin xác nhận.'
  });
});

export default router;
