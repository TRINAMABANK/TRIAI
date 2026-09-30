import express from 'express';
import { upload } from '../middleware/upload.js';
import StorageService from '../services/storageService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/files/upload
 */
router.post('/upload', optionalAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy tệp tin được tải lên.' });
    }

    const userId = req.user ? req.user.id : null;
    const conversationId = req.body.conversationId || null;
    const purpose = req.body.purpose || 'attachment';

    const saved = await StorageService.saveFileRecord({
      userId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      filename: req.file.filename,
      conversationId,
      purpose
    });

    res.json({
      success: true,
      file: saved
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/files/:id
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const success = await StorageService.deleteFile(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tệp tin cần xóa.' });
    }
    res.json({ success: true, message: 'Đã xóa tệp tin thành công.' });
  } catch (err) {
    next(err);
  }
});

export default router;
