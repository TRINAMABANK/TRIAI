import express from 'express';
import LicenseEngine from '../services/licenseEngine.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/licenses/check/:skillId
 */
router.get('/check/:skillId', requireAuth, async (req, res, next) => {
  try {
    const result = await LicenseEngine.checkAccess(req.user.id, req.params.skillId);
    res.json({ success: true, access: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/licenses/trial/:skillId
 * Start 15-minute trial
 */
router.post('/trial/:skillId', requireAuth, async (req, res, next) => {
  try {
    const result = await LicenseEngine.startTrial(req.user.id, req.params.skillId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/licenses/my
 */
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const map = await LicenseEngine.getUserAccessMap(req.user.id);
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/licenses/grant (Admin only)
 */
router.post('/grant', requireAdmin, async (req, res, next) => {
  try {
    const { userId, skillId, licenseType, durationDays } = req.body;
    if (!userId || !skillId) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin userId hoặc skillId.' });
    }

    const license = await LicenseEngine.grantLicense({
      userId,
      skillId,
      licenseType: licenseType || 'monthly',
      durationDays: durationDays || 30,
      grantedBy: `admin:${req.user.email}`
    });

    res.json({ success: true, data: license, message: 'Đã cấp bản quyền thành công.' });
  } catch (err) {
    next(err);
  }
});

export default router;
