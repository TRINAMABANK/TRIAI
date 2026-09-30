import express from 'express';
import fs from 'fs';
import SkillEngine from '../services/skillEngine.js';
import { requireAdmin, optionalAuth } from '../middleware/auth.js';
import { uploadZip } from '../middleware/upload.js';

const router = express.Router();

/**
 * GET /api/skills
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const status = req.query.status || 'published';
    const skills = await SkillEngine.getAllSkills(status);
    res.json({ success: true, count: skills.length, data: skills });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/skills/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const skill = await SkillEngine.getSkillById(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy Skill tương ứng.' });
    }
    res.json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/skills (Admin only)
 */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const saved = await SkillEngine.upsertSkill(req.body);
    res.json({ success: true, data: saved, message: 'Đã lưu cấu hình Skill thành công.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/skills/upload-zip (Admin only)
 */
router.post('/upload-zip', requireAdmin, uploadZip.single('skillZip'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn file gói ZIP hợp lệ.' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const result = await SkillEngine.importFromZip(fileBuffer, req.file.originalname);

    // Clean up temporary zip file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: result,
      message: `Đã nạp và giải nén thành công gói Skill: ${result.name} (v${result.version})`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
