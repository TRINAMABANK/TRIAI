import express from 'express';
import PaymentService from '../services/paymentService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/payments/confirm
 * Used when user clicks "Tôi đã thanh toán thành công" or admin verifies
 */
router.post('/confirm', optionalAuth, async (req, res, next) => {
  try {
    const { orderId, orderCode, transactionRef } = req.body;
    const targetId = orderId || orderCode;

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Thiếu mã đơn hàng cần xác nhận.' });
    }

    const result = await PaymentService.confirmPayment(targetId, transactionRef || `TXN_${Date.now()}`);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook
 * Mock / standard Webhook for automated bank transfer listeners (e.g., VietQR / Seva / Casso)
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const { orderCode, amount, transactionRef } = req.body;
    if (!orderCode) {
      return res.status(400).json({ success: false, error: 'Thiếu mã đơn hàng.' });
    }

    const result = await PaymentService.confirmPayment(orderCode, transactionRef || `WH_${Date.now()}`);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
