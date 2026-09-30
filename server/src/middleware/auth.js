import { verifyToken } from '../utils/security.js';
import db from '../db/index.js';
import { env } from '../config/env.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.'
      });
    }

    const user = await db.get(
      'SELECT id, email, full_name, avatar_url, role, plan, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản người dùng không tồn tại.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ Admin.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, error: 'Lỗi xác thực người dùng.' });
  }
}

export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    const isMasterEmail = req.user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
    const isOwnerOrAdmin = req.user.role === 'owner' || req.user.role === 'admin';

    if (!isMasterEmail && !isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền truy cập khu vực Quản trị Master Admin.'
      });
    }
    next();
  });
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        const user = await db.get(
          'SELECT id, email, full_name, avatar_url, role, plan, is_active FROM users WHERE id = ?',
          [decoded.userId]
        );
        if (user && user.is_active) {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
}
