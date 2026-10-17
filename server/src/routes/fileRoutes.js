import express from 'express';
import path from 'path';
import fs from 'fs';
import { upload, verifyFileMagicBytes } from '../middleware/upload.js';
import StorageService from '../services/storageService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/files/upload
 * Authenticated file upload with strict magic bytes verification and safe UUID filenames
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy tệp tin được tải lên.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    
    // Deep content inspection: verify file header / magic bytes
    const magicCheck = verifyFileMagicBytes(req.file.path, ext);
    if (!magicCheck.valid) {
      // Clean up unsafe file immediately
      if (fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        error: magicCheck.error || 'Nội dung tệp tin không khớp với định dạng khai báo (Magic bytes verification failed).'
      });
    }

    const userId = req.user.id;
    const conversationId = req.body.conversationId || null;
    const purpose = req.body.purpose || 'attachment';
    const isPublic = req.body.isPublic === 'true' || req.body.isPublic === '1';

    const saved = await StorageService.saveFileRecord({
      userId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      filename: req.file.filename,
      conversationId,
      purpose,
      isPublic
    });

    res.json({
      success: true,
      file: saved
    });
  } catch (err) {
    // If multer or upload failed, clean up any partial file on disk
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(err);
  }
});

/**
 * GET /api/files/:id
 * Retrieve file metadata with Anti-IDOR authorization check
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const file = await StorageService.getFileById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tệp tin.' });
    }

    const hasAccess = await StorageService.canAccessFile(file, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập tệp tin này (Forbidden).' });
    }

    res.json({
      success: true,
      file: {
        id: file.id,
        originalName: file.original_name,
        mimeType: file.mime_type,
        sizeBytes: file.size_bytes,
        purpose: file.purpose,
        isPublic: Boolean(file.is_public),
        createdAt: file.created_at
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/files/:id/download
 * Secure file download with Anti-IDOR ownership validation
 */
router.get('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const file = await StorageService.getFileById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tệp tin.' });
    }

    const hasAccess = await StorageService.canAccessFile(file, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền tải xuống tệp tin này.' });
    }

    const fullPath = path.resolve(process.cwd(), file.storage_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'Tệp tin vật lý không tồn tại trên máy chủ.' });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(fullPath, file.original_name);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/files/:id
 * Delete file with Anti-IDOR check
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const success = await StorageService.deleteFile(req.params.id, req.user.id, req.user.role);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tệp tin cần xóa.' });
    }
    res.json({ success: true, message: 'Đã xóa tệp tin thành công.' });
  } catch (err) {
    next(err);
  }
});

export default router;
