import express from 'express';
import PaymentService from '../services/paymentService.js';
import { requireAuth } from '../middleware/auth.js';
import db from '../db/index.js';

const router = express.Router();

/**
 * POST /api/orders (Create an order for skills - Server calculates price & generates real VietQR)
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, note } = req.body;
    const order = await PaymentService.createOrder({
      userId: req.user.id,
      items,
      note
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders/:orderId/payment-request
 * Customer notifies that they transferred money (STATUS = PENDING, NO LICENSE ACTIVATED)
 */
router.post('/:orderId/payment-request', requireAuth, async (req, res, next) => {
  try {
    const { transactionRef, note } = req.body;
    const result = await PaymentService.requestPayment({
      orderId: req.params.orderId,
      userId: req.user.id,
      transactionRef,
      note
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders & GET /api/orders/my-orders (Customer order history from database)
 */
router.get(['/', '/my-orders'], requireAuth, async (req, res, next) => {
  try {
    const orders = await PaymentService.getCustomerOrders(req.user.id);
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await db.get(
      `SELECT * FROM orders WHERE (id = ? OR order_code = ?) AND (user_id = ? OR ? = 1)`,
      [req.params.id, req.params.id, req.user.id, req.user.role === 'owner' ? 1 : 0]
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng.' });
    }

    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const qrUrl = PaymentService.generateVietQRUrl({
      amount: order.total_amount,
      orderCode: order.order_code
    });

    res.json({
      success: true,
      order: {
        ...order,
        items,
        qrUrl
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
