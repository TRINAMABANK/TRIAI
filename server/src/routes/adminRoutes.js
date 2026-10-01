import express from 'express';
import db from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import LicenseEngine from '../services/licenseEngine.js';
import PaymentService from '../services/paymentService.js';

const router = express.Router();

// Apply requireAdmin to all admin routes
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const orderCount = await db.get('SELECT COUNT(*) as count FROM orders');
    const revenueSum = await db.get("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'");
    const skillCount = await db.get('SELECT COUNT(*) as count FROM skills');
    const activeLicenses = await db.get("SELECT COUNT(*) as count FROM licenses WHERE status = 'active'");
    const activeTrials = await db.get("SELECT COUNT(*) as count FROM trials WHERE status = 'active'");
    const pendingOrdersCount = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");

    res.json({
      success: true,
      stats: {
        totalUsers: userCount?.count || 0,
        totalOrders: orderCount?.count || 0,
        pendingOrders: pendingOrdersCount?.count || 0,
        totalRevenue: revenueSum?.total || 0,
        totalSkills: skillCount?.count || 0,
        activeLicenses: activeLicenses?.count || 0,
        activeTrials: activeTrials?.count || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users
 */
router.get('/users', async (req, res, next) => {
  try {
    const users = await db.all(
      `SELECT id, email, full_name, avatar_url, role, plan, is_active, last_login_at, created_at 
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/users/:id
 */
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, plan, is_active } = req.body;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE users SET role = COALESCE(?, role), plan = COALESCE(?, plan), is_active = COALESCE(?, is_active), updated_at = ?
       WHERE id = ?`,
      [role, plan, is_active !== undefined ? (is_active ? 1 : 0) : null, now, req.params.id]
    );

    const updated = await db.get('SELECT id, email, full_name, role, plan, is_active FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, user: updated, message: 'Cập nhật tài khoản thành công.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/orders
 */
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await db.all(
      `SELECT o.*, u.email as user_email, u.full_name as user_name,
       (SELECT GROUP_CONCAT(s.name, ', ') FROM order_items oi JOIN skills s ON oi.skill_id = s.id WHERE oi.order_id = o.id) as skill_names,
       (SELECT p.transaction_ref FROM payments p WHERE p.order_id = o.id ORDER BY p.created_at DESC LIMIT 1) as transaction_ref,
       (SELECT p.status FROM payments p WHERE p.order_id = o.id ORDER BY p.created_at DESC LIMIT 1) as payment_status
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/orders/:orderId/verify-payment
 * Admin verifies actual bank transaction and activates license
 */
router.post('/orders/:orderId/verify-payment', async (req, res, next) => {
  try {
    const { transactionRef } = req.body;
    const result = await PaymentService.adminVerifyPayment({
      orderId: req.params.orderId,
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      transactionRef
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/orders/:orderId/reject-payment
 * Admin rejects payment request
 */
router.post('/orders/:orderId/reject-payment', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await PaymentService.adminRejectPayment({
      orderId: req.params.orderId,
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      reason
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/notifications
 * Admin notifications list
 */
router.get('/notifications', async (req, res, next) => {
  try {
    const notifs = await db.all(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`
    );
    const parsed = notifs.map(n => ({
      ...n,
      data: n.data_json ? JSON.parse(n.data_json) : null
    }));
    res.json({ success: true, notifications: parsed });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/notifications/:id/read
 */
router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    await db.run(
      `UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?`,
      [now, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/licenses
 */
router.get('/licenses', async (req, res, next) => {
  try {
    const licenses = await db.all(
      `SELECT l.*, u.email as user_email, u.full_name as user_name, s.name as skill_name
       FROM licenses l
       LEFT JOIN users u ON l.user_id = u.id
       LEFT JOIN skills s ON l.skill_id = s.id
       ORDER BY l.created_at DESC`
    );
    res.json({ success: true, licenses });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/licenses/grant
 */
router.post('/licenses/grant', async (req, res, next) => {
  try {
    const { userId, skillId, licenseType, durationDays } = req.body;
    const result = await LicenseEngine.grantLicense({
      userId,
      skillId,
      licenseType: licenseType || 'monthly',
      durationDays: durationDays || 30,
      grantedBy: `admin:${req.user.email}`
    });
    res.json({ success: true, license: result, message: 'Đã phê duyệt cấp bản quyền thành công.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/licenses/revoke
 */
router.post('/licenses/revoke', async (req, res, next) => {
  try {
    const { licenseId } = req.body;
    const now = new Date().toISOString();
    await db.run("UPDATE licenses SET status = 'revoked', updated_at = ? WHERE id = ?", [now, licenseId]);
    res.json({ success: true, message: 'Đã thu hồi bản quyền thành công.' });
  } catch (err) {
    next(err);
  }
});

export default router;
