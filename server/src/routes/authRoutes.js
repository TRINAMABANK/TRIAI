import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { hashPassword, comparePassword, generateToken, sanitizeUser } from '../utils/security.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import LicenseEngine from '../services/licenseEngine.js';

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email và mật khẩu không được để trống.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);

    if (existing) {
      return res.status(400).json({ success: false, error: 'Email này đã được đăng ký trên hệ thống.' });
    }

    const userId = `usr_${uuidv4().substring(0, 8)}`;
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const isMaster = cleanEmail === env.ADMIN_EMAIL.toLowerCase();
    const role = isMaster ? 'owner' : 'customer';

    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, plan, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        userId,
        cleanEmail,
        passwordHash,
        fullName || cleanEmail.split('@')[0],
        '/assets/user_avatar.png',
        role,
        isMaster ? 'Gói Quản Trị Hệ Thống (Master)' : 'Gói Khách Hàng',
        now,
        now
      ]
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    const accessMap = await LicenseEngine.getUserAccessMap(user.id);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
      access: accessMap
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không chính xác.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị khóa.' });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không chính xác.' });
    }

    // Update last login
    const now = new Date().toISOString();
    await db.run('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', [now, now, user.id]);

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    const accessMap = await LicenseEngine.getUserAccessMap(user.id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      access: accessMap
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/google
 * Local machine verified Google authentication
 */
router.post('/google', async (req, res, next) => {
  try {
    const { email, fullName, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin tài khoản Google.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    const now = new Date().toISOString();
    const isMaster = cleanEmail === env.ADMIN_EMAIL.toLowerCase();

    if (!user) {
      const userId = `usr_${uuidv4().substring(0, 8)}`;
      const randomPass = await hashPassword(uuidv4());
      const role = isMaster ? 'owner' : 'customer';

      await db.run(
        `INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, plan, is_active, last_login_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          userId,
          cleanEmail,
          randomPass,
          fullName || cleanEmail.split('@')[0],
          avatarUrl || '/assets/user_avatar.png',
          role,
          isMaster ? 'Gói Quản Trị Hệ Thống (Master)' : 'Gói Khách Hàng',
          now,
          now,
          now
        ]
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    } else {
      await db.run('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', [now, now, user.id]);
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    const accessMap = await LicenseEngine.getUserAccessMap(user.id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      access: accessMap
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const accessMap = await LicenseEngine.getUserAccessMap(req.user.id);
    res.json({
      success: true,
      user: sanitizeUser(req.user),
      access: accessMap
    });
  } catch (err) {
    next(err);
  }
});

export default router;
