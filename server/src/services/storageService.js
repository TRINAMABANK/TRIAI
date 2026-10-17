import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';

export class StorageService {
  /**
   * Save uploaded file metadata to database
   * Strictly separates original_name from physical disk storage_path
   */
  static async saveFileRecord({
    userId,
    originalName,
    mimeType,
    sizeBytes,
    filename,
    conversationId = null,
    purpose = 'attachment',
    isPublic = 0
  }) {
    const fileId = `fil_${uuidv4()}`;
    const storagePath = path.join(env.UPLOAD_DIR, filename);
    const now = new Date().toISOString();

    // Sanitize originalName for display (strip directory components)
    const cleanOriginalName = path.basename(originalName || 'file').replace(/[\0\r\n]/g, '');

    await db.run(
      `INSERT INTO files (id, user_id, conversation_id, original_name, storage_path, mime_type, size_bytes, purpose, is_public, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileId, userId, conversationId, cleanOriginalName, storagePath, mimeType, sizeBytes, purpose, isPublic ? 1 : 0, now]
    );

    return {
      id: fileId,
      originalName: cleanOriginalName,
      mimeType,
      sizeBytes,
      url: `/uploads/${filename}`,
      filename,
      purpose,
      isPublic: Boolean(isPublic),
      createdAt: now
    };
  }

  /**
   * Get file metadata by file ID
   */
  static async getFileById(fileId) {
    return await db.get('SELECT * FROM files WHERE id = ?', [fileId]);
  }

  /**
   * Check if user has permission to access/view/download this file
   */
  static async canAccessFile(file, userId, userRole = 'customer') {
    if (!file) return false;
    // Public files (avatars, public assets) are accessible to all
    if (file.is_public === 1) return true;
    // File owner has access
    if (userId && file.user_id === userId) return true;
    // Admin & Owner have access
    if (userRole === 'admin' || userRole === 'owner') return true;
    return false;
  }

  /**
   * Delete file from both disk and database
   * Strictly enforces Anti-IDOR: users cannot delete other users' files
   */
  static async deleteFile(fileId, userId, userRole = 'customer') {
    const file = await db.get('SELECT * FROM files WHERE id = ?', [fileId]);
    if (!file) return false;

    // Check ownership if not admin/owner
    if (userId && file.user_id !== userId) {
      if (userRole !== 'owner' && userRole !== 'admin') {
        const err = new Error('Bạn không có quyền xóa tệp tin này.');
        err.status = 403;
        throw err;
      }
    }

    const fullPath = path.resolve(process.cwd(), file.storage_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('[STORAGE WARNING] Failed to unlink physical file:', err.message);
      }
    }

    await db.run('DELETE FROM files WHERE id = ?', [fileId]);
    return true;
  }
}

export default StorageService;
