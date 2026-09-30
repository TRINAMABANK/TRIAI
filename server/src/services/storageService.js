import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';

export class StorageService {
  static async saveFileRecord({ userId, originalName, mimeType, sizeBytes, filename, conversationId = null, purpose = 'attachment' }) {
    const fileId = `fil_${uuidv4()}`;
    const storagePath = path.join(env.UPLOAD_DIR, filename);
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO files (id, user_id, conversation_id, original_name, storage_path, mime_type, size_bytes, purpose, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileId, userId, conversationId, originalName, storagePath, mimeType, sizeBytes, purpose, now]
    );

    return {
      id: fileId,
      originalName,
      mimeType,
      sizeBytes,
      url: `/uploads/${filename}`,
      filename,
      purpose,
      createdAt: now
    };
  }

  static async getFileById(fileId) {
    return await db.get('SELECT * FROM files WHERE id = ?', [fileId]);
  }

  static async deleteFile(fileId, userId) {
    const file = await db.get('SELECT * FROM files WHERE id = ?', [fileId]);
    if (!file) return false;

    // Check ownership if not admin
    if (userId && file.user_id !== userId) {
      const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
      if (user?.role !== 'owner' && user?.role !== 'admin') {
        throw new Error('Bạn không có quyền xóa tệp tin này.');
      }
    }

    const fullPath = path.resolve(process.cwd(), file.storage_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('File unlink error:', err);
      }
    }

    await db.run('DELETE FROM files WHERE id = ?', [fileId]);
    return true;
  }
}

export default StorageService;
