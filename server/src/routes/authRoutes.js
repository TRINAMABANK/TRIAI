import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { hashPassword, comparePassword, generateToken, sanitizeUser } from '../utils/security.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import LicenseEngine from '../services/licenseEngine.js';
import QuotaService from '../services/quotaService.js';

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

    let isValid = await comparePassword(password, user.password_hash);
    if (!isValid && typeof password === 'string') {
      isValid = await comparePassword(password.trim(), user.password_hash);
    }
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
 * Helper: Xác minh ID Token với máy chủ Google Identity Services OAuth 2.0
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google ID Token không được để trống.');
  }

  const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
  const response = await fetch(verifyUrl);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.error_description) {
    throw new Error(data.error_description || data.error || 'Token Google không hợp lệ hoặc đã hết hạn.');
  }

  // 1. Kiểm tra nhà phát hành (Issuer)
  const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
  if (!validIssuers.includes(data.iss)) {
    throw new Error('Nhà phát hành (Issuer) Google không hợp lệ.');
  }

  // 2. Kiểm tra thời hạn hiệu lực (Expiry)
  const expTime = parseInt(data.exp, 10) * 1000;
  if (isNaN(expTime) || expTime < Date.now()) {
    throw new Error('Google ID Token đã hết hạn. Vui lòng đăng nhập lại.');
  }

  // 3. Kiểm tra Google Client ID (nếu server đã cấu hình GOOGLE_CLIENT_ID)
  if (env.GOOGLE_CLIENT_ID) {
    const isAudienceValid = data.aud === env.GOOGLE_CLIENT_ID || data.azp === env.GOOGLE_CLIENT_ID;
    if (!isAudienceValid) {
      console.warn(`[GOOGLE AUTH WARNING] Token aud (${data.aud}) mismatch with server GOOGLE_CLIENT_ID (${env.GOOGLE_CLIENT_ID})`);
      throw new Error('Google Client ID của Token không khớp với cấu hình hệ thống TRÍ AI.');
    }
  }

  // 4. Kiểm tra email đã được Google xác thực
  if (data.email_verified !== 'true' && data.email_verified !== true) {
    throw new Error('Email tài khoản Google này chưa được xác minh.');
  }

  return {
    googleId: data.sub,
    email: (data.email || '').trim().toLowerCase(),
    fullName: data.name || data.given_name || (data.email || '').split('@')[0],
    avatarUrl: data.picture || '/assets/user_avatar.png'
  };
}

/**
 * POST /api/auth/google
 * Xác thực Google Sign-In chuẩn OAuth 2.0 / Google Identity Services
 */
router.post('/google', async (req, res, next) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    let verifiedProfile;

    if (tokenToVerify) {
      // 1. Xác minh chữ ký số và claims trực tiếp từ Google OAuth2 TokenInfo API
      verifiedProfile = await verifyGoogleIdToken(tokenToVerify);
    } else if (env.IS_DEV && !env.GOOGLE_CLIENT_ID && req.body.email) {
      // Chế độ DEV cục bộ khi chưa gắn biến môi trường
      console.warn('[AUTH DEV NOTICE] Dev fallback mode: No Google Client ID configured, accepting dev payload.');
      verifiedProfile = {
        googleId: `mock_g_${uuidv4().substring(0, 8)}`,
        email: req.body.email.trim().toLowerCase(),
        fullName: req.body.fullName || req.body.email.split('@')[0],
        avatarUrl: req.body.avatarUrl || '/assets/user_avatar.png'
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Thiếu Google credential (ID Token) để xác thực.'
      });
    }

    const { googleId, email: cleanEmail, fullName, avatarUrl } = verifiedProfile;

    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Không lấy được email từ tài khoản Google.' });
    }

    // 2. Tra cứu tài khoản: Khớp theo google_id HOẶC email (Account Linking)
    let user = await db.get(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleId, cleanEmail]
    );

    const now = new Date().toISOString();
    // Quyền Admin/Owner CHỈ do server quyết định dựa trên MASTER_ADMIN_EMAIL trong ENV, tuyệt đối không tin client
    const isMaster = cleanEmail === env.ADMIN_EMAIL.toLowerCase();

    if (!user) {
      // 3. Tạo tài khoản TRÍ AI mới từ profile Google hợp lệ
      const userId = `usr_${uuidv4().substring(0, 8)}`;
      const randomPass = await hashPassword(uuidv4());
      const role = isMaster ? 'owner' : 'customer';

      await db.run(
        `INSERT INTO users (id, google_id, email, password_hash, full_name, avatar_url, role, plan, is_active, last_login_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          userId,
          googleId,
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
      // 4. Liên kết tài khoản an toàn (Account Linking)
      const updates = [];
      const params = [];

      if (!user.google_id || user.google_id !== googleId) {
        updates.push('google_id = ?');
        params.push(googleId);
      }

      if ((!user.avatar_url || user.avatar_url === '/assets/user_avatar.png') && avatarUrl) {
        updates.push('avatar_url = ?');
        params.push(avatarUrl);
      }

      if (isMaster && user.role !== 'owner') {
        updates.push("role = 'owner'");
      }

      updates.push('last_login_at = ?', 'updated_at = ?');
      params.push(now, now, user.id);

      await db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị khóa.' });
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
    console.error('[GOOGLE AUTH ERROR]:', err);
    res.status(401).json({
      success: false,
      error: err.message || 'Xác thực Google thất bại.'
    });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const accessMap = await LicenseEngine.getUserAccessMap(req.user.id);
    const quota = await QuotaService.getUserQuotaSummary(req.user.id);
    res.json({
      success: true,
      user: sanitizeUser(req.user),
      access: accessMap,
      quota
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/quota
 */
router.get('/quota', requireAuth, async (req, res, next) => {
  try {
    const quota = await QuotaService.getUserQuotaSummary(req.user.id);
    res.json({
      success: true,
      quota
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng.' });
    }

    if (oldPassword) {
      const isValid = await comparePassword(oldPassword, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Mật khẩu cũ không chính xác.' });
      }
    }

    const newHash = await hashPassword(newPassword);
    const now = new Date().toISOString();
    await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, user.id]);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
