import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

export class QuotaService {
  /**
   * Get current period string (YYYY-MM)
   */
  static getCurrentPeriod() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  }

  /**
   * Determine quota limits based on user active licenses and role
   */
  static async getUserPlanLimits(userId) {
    if (!userId) {
      return {
        planName: 'Khách vãng lai',
        maxAiRequests: 10,
        maxImages: 1,
        maxFiles: 5,
        maxStorageBytes: 25 * 1024 * 1024 // 25 MB
      };
    }

    const user = await db.get('SELECT id, role, email, plan FROM users WHERE id = ?', [userId]);
    if (!user) {
      return {
        planName: 'Chưa đăng ký',
        maxAiRequests: 0,
        maxImages: 0,
        maxFiles: 0,
        maxStorageBytes: 0
      };
    }

    // Owner / Admin = Unlimited
    if (user.role === 'owner' || user.role === 'admin' || user.email === 'triqnnamabank@gmail.com') {
      return {
        planName: 'Quản trị viên (Không giới hạn)',
        maxAiRequests: 1000000,
        maxImages: 100000,
        maxFiles: 100000,
        maxStorageBytes: 100 * 1024 * 1024 * 1024 // 100 GB
      };
    }

    // Check active licenses
    const now = new Date().toISOString();
    const activeLicenses = await db.all(
      `SELECT * FROM licenses WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?)`,
      [userId, now]
    );

    const licenseCount = activeLicenses.length;

    if (licenseCount >= 33) {
      return {
        planName: 'Gói Master 33 Trợ Lý Toàn Năng',
        maxAiRequests: 10000,
        maxImages: 1000,
        maxFiles: 1000,
        maxStorageBytes: 20 * 1024 * 1024 * 1024 // 20 GB
      };
    }

    if (licenseCount >= 5) {
      return {
        planName: 'Gói Combo 5 Trợ Lý Chuyên Sâu',
        maxAiRequests: 3000,
        maxImages: 300,
        maxFiles: 200,
        maxStorageBytes: 5 * 1024 * 1024 * 1024 // 5 GB
      };
    }

    if (licenseCount >= 1) {
      return {
        planName: 'Gói Chuyên Gia Đơn Lẻ',
        maxAiRequests: 1000,
        maxImages: 100,
        maxFiles: 50,
        maxStorageBytes: 1 * 1024 * 1024 * 1024 // 1 GB
      };
    }

    // Check active trial
    const activeTrial = await db.get(
      `SELECT * FROM trials WHERE user_id = ? AND status = 'active' AND expires_at > ?`,
      [userId, now]
    );

    if (activeTrial) {
      return {
        planName: 'Gói Dùng Thử Trải Nghiệm',
        maxAiRequests: 30,
        maxImages: 3,
        maxFiles: 10,
        maxStorageBytes: 50 * 1024 * 1024 // 50 MB
      };
    }

    return {
      planName: 'Tài khoản Miễn phí',
      maxAiRequests: 20,
      maxImages: 2,
      maxFiles: 5,
      maxStorageBytes: 25 * 1024 * 1024 // 25 MB
    };
  }

  /**
   * Get or create usage counter record for user in current month
   */
  static async getUsageRecord(userId) {
    if (!userId) return null;

    const period = this.getCurrentPeriod();
    let record = await db.get(
      'SELECT * FROM usage_counters WHERE user_id = ? AND period_month = ?',
      [userId, period]
    );

    if (!record) {
      const id = `use_${uuidv4().substring(0, 8)}`;
      const now = new Date().toISOString();
      await db.run(
        `INSERT INTO usage_counters (id, user_id, period_month, ai_requests, image_generations, file_count, storage_bytes, created_at, updated_at)
         VALUES (?, ?, ?, 0, 0, 0, 0, ?, ?)`,
        [id, userId, period, now, now]
      );
      record = {
        id,
        user_id: userId,
        period_month: period,
        ai_requests: 0,
        image_generations: 0,
        file_count: 0,
        storage_bytes: 0
      };
    }

    return record;
  }

  /**
   * Check if user can make an AI request
   */
  static async checkAiQuota(userId) {
    if (!userId) {
      return { allowed: true };
    }

    const limits = await this.getUserPlanLimits(userId);
    const usage = await this.getUsageRecord(userId);

    if (usage.ai_requests >= limits.maxAiRequests) {
      return {
        allowed: false,
        reason: `Bạn đã đạt giới hạn sử dụng ${limits.maxAiRequests.toLocaleString('vi-VN')} lượt của ${limits.planName}. Vui lòng nâng cấp gói để tiếp tục sử dụng không giới hạn.`,
        current: usage.ai_requests,
        limit: limits.maxAiRequests
      };
    }

    return {
      allowed: true,
      current: usage.ai_requests,
      limit: limits.maxAiRequests
    };
  }

  /**
   * Increment AI Request Counter
   */
  static async incrementAiRequests(userId, count = 1) {
    if (!userId) return;
    const period = this.getCurrentPeriod();
    const now = new Date().toISOString();
    await this.getUsageRecord(userId); // ensure row exists

    await db.run(
      `UPDATE usage_counters 
       SET ai_requests = ai_requests + ?, updated_at = ? 
       WHERE user_id = ? AND period_month = ?`,
      [count, now, userId, period]
    );
  }

  /**
   * Increment Image Generation Counter
   */
  static async incrementImageCount(userId, count = 1) {
    if (!userId) return;
    const period = this.getCurrentPeriod();
    const now = new Date().toISOString();
    await this.getUsageRecord(userId);

    await db.run(
      `UPDATE usage_counters 
       SET image_generations = image_generations + ?, updated_at = ? 
       WHERE user_id = ? AND period_month = ?`,
      [count, now, userId, period]
    );
  }

  /**
   * Get user quota summary for UI display
   */
  static async getUserQuotaSummary(userId) {
    const limits = await this.getUserPlanLimits(userId);
    const usage = await this.getUsageRecord(userId);

    return {
      planName: limits.planName,
      periodMonth: this.getCurrentPeriod(),
      aiRequests: {
        used: usage?.ai_requests || 0,
        limit: limits.maxAiRequests,
        percentage: Math.min(100, Math.round(((usage?.ai_requests || 0) / limits.maxAiRequests) * 100))
      },
      imageGenerations: {
        used: usage?.image_generations || 0,
        limit: limits.maxImages,
        percentage: Math.min(100, Math.round(((usage?.image_generations || 0) / limits.maxImages) * 100))
      },
      storage: {
        usedBytes: usage?.storage_bytes || 0,
        limitBytes: limits.maxStorageBytes,
        usedFormatted: ((usage?.storage_bytes || 0) / (1024 * 1024)).toFixed(1) + ' MB',
        limitFormatted: (limits.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
        percentage: Math.min(100, Math.round(((usage?.storage_bytes || 0) / limits.maxStorageBytes) * 100))
      }
    };
  }
}

export default QuotaService;
