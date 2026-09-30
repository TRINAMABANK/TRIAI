import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';

export class LicenseEngine {
  /**
   * Check if a user has access to a skill (via Admin ownership, License, or 15m Trial)
   */
  static async checkAccess(userId, skillId) {
    if (!userId) {
      return { granted: false, reason: 'unauthenticated', message: 'Vui lòng đăng nhập để sử dụng Skill.' };
    }

    // 1. Check if user is Super Admin / Owner
    const user = await db.get('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    if (!user) {
      return { granted: false, reason: 'user_not_found', message: 'Không tìm thấy người dùng.' };
    }

    if (user.role === 'owner' || user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
      return {
        granted: true,
        reason: 'admin_master',
        type: 'master',
        message: 'Quyền Quản trị viên Tối cao (Vĩnh viễn)'
      };
    }

    const now = new Date();

    // 2. Check Active License
    const license = await db.get(
      `SELECT * FROM licenses 
       WHERE user_id = ? AND skill_id = ? AND status = 'active' 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, skillId]
    );

    if (license) {
      if (!license.expires_at || new Date(license.expires_at) > now) {
        return {
          granted: true,
          reason: 'license',
          type: license.license_type,
          expiresAt: license.expires_at,
          licenseKey: license.license_key,
          message: 'Bản quyền đã kích hoạt'
        };
      }
    }

    // 3. Check 15-Minute Trial
    const trial = await db.get(
      `SELECT * FROM trials 
       WHERE user_id = ? AND skill_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, skillId]
    );

    if (trial) {
      const expiresAt = new Date(trial.expires_at);
      if (expiresAt > now && trial.status === 'active') {
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        return {
          granted: true,
          reason: 'trial',
          type: 'trial',
          expiresAt: trial.expires_at,
          remainingSeconds,
          message: `Đang trong thời gian dùng thử (${Math.ceil(remainingSeconds / 60)} phút còn lại)`
        };
      } else {
        return {
          granted: false,
          reason: 'trial_expired',
          expiredAt: trial.expires_at,
          message: 'Thời gian dùng thử 15 phút của Skill này đã hết. Vui lòng nâng cấp bản quyền.'
        };
      }
    }

    // 4. No trial & No license
    return {
      granted: false,
      reason: 'no_license',
      canTrial: true,
      message: 'Bạn chưa có bản quyền Skill này. Bạn có thể kích hoạt dùng thử 15 phút.'
    };
  }

  /**
   * Start a 15-minute trial for a user on a skill
   */
  static async startTrial(userId, skillId, durationMinutes = env.TRIAL_DURATION_MINUTES || 15) {
    const existingTrial = await db.get(
      'SELECT * FROM trials WHERE user_id = ? AND skill_id = ?',
      [userId, skillId]
    );

    if (existingTrial) {
      const now = new Date();
      const expiresAt = new Date(existingTrial.expires_at);
      if (expiresAt > now && existingTrial.status === 'active') {
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        return {
          success: true,
          isNew: false,
          remainingSeconds,
          expiresAt: existingTrial.expires_at,
          message: `Bạn đang có phiên dùng thử còn ${Math.ceil(remainingSeconds / 60)} phút.`
        };
      } else {
        return {
          success: false,
          error: 'Bạn đã sử dụng hết quyền dùng thử 15 phút cho Skill này.'
        };
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const trialId = `trl_${uuidv4()}`;

    await db.run(
      `INSERT INTO trials (id, user_id, skill_id, started_at, expires_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [trialId, userId, skillId, now.toISOString(), expiresAt.toISOString(), now.toISOString()]
    );

    return {
      success: true,
      isNew: true,
      trialId,
      remainingSeconds: durationMinutes * 60,
      expiresAt: expiresAt.toISOString(),
      message: `Đã kích hoạt dùng thử miễn phí ${durationMinutes} phút.`
    };
  }

  /**
   * Grant license to a user (after payment or admin manual grant)
   */
  static async grantLicense({ userId, skillId, licenseType = 'monthly', durationDays = 30, grantedBy = 'system' }) {
    const now = new Date();
    let expiresAt = null;

    if (licenseType === 'monthly') {
      expiresAt = new Date(now.getTime() + (durationDays || 30) * 24 * 60 * 60 * 1000).toISOString();
    } else if (licenseType === 'yearly') {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } // 'permanent' leaves expiresAt = null

    const licenseKey = `LIC-${licenseType.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const id = `lic_${uuidv4()}`;

    await db.run(
      `INSERT INTO licenses (id, user_id, skill_id, license_key, license_type, status, expires_at, granted_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      [id, userId, skillId, licenseKey, licenseType, expiresAt, grantedBy, now.toISOString(), now.toISOString()]
    );

    return { id, licenseKey, licenseType, expiresAt, status: 'active' };
  }

  /**
   * Get all active licenses and trials for a user
   */
  static async getUserAccessMap(userId) {
    if (!userId) return { licenses: {}, trials: {}, isMaster: false };

    const user = await db.get('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    if (!user) return { licenses: {}, trials: {}, isMaster: false };

    if (user.role === 'owner' || user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()) {
      return { licenses: {}, trials: {}, isMaster: true };
    }

    const now = new Date().toISOString();
    const licenses = await db.all(
      `SELECT skill_id, license_key, license_type, expires_at FROM licenses
       WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?)`,
      [userId, now]
    );

    const trials = await db.all(
      `SELECT skill_id, started_at, expires_at FROM trials
       WHERE user_id = ? AND status = 'active' AND expires_at > ?`,
      [userId, now]
    );

    const licenseMap = {};
    licenses.forEach((lic) => {
      licenseMap[lic.skill_id] = lic;
    });

    const trialMap = {};
    trials.forEach((trl) => {
      trialMap[trl.skill_id] = trl;
    });

    return { licenses: licenseMap, trials: trialMap, isMaster: false };
  }
}

export default LicenseEngine;
