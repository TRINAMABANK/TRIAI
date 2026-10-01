import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

/**
 * GET /api/notifications
 */
router.get('/', async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'owner' || req.user.role === 'admin';
    let notifs = [];

    if (isAdmin) {
      notifs = await db.all(
        `SELECT * FROM notifications 
         WHERE user_id = ? OR user_id = 'usr_master_admin' OR user_id = 'all'
         ORDER BY created_at DESC LIMIT 50`,
        [req.user.id]
      );
    } else {
      notifs = await db.all(
        `SELECT * FROM notifications 
         WHERE user_id = ? OR user_id = 'all'
         ORDER BY created_at DESC LIMIT 30`,
        [req.user.id]
      );
    }

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
 * POST /api/notifications/:id/read or PUT /api/notifications/:id/read
 */
const markReadHandler = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    await db.run(
      `UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?`,
      [now, req.params.id]
    );
    res.json({ success: true, message: 'Đã đánh dấu đã đọc.' });
  } catch (err) {
    next(err);
  }
};

router.post('/:id/read', markReadHandler);
router.put('/:id/read', markReadHandler);

export default router;
