import express from 'express';
import db from '../db/index.js';
import AIRuntime from '../services/aiRuntime.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/chat/conversations
 */
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT c.*, a.name as agent_name, s.name as skill_name,
       (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
       (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
       FROM conversations c
       LEFT JOIN agents a ON c.agent_id = a.id
       LEFT JOIN skills s ON c.skill_id = s.id
       WHERE c.user_id = ? AND c.is_archived = 0
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chat/conversations/:id
 */
router.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const conv = await db.get(
      'SELECT * FROM conversations WHERE id = ? AND (user_id = ? OR ? = 1)',
      [req.params.id, req.user.id, req.user.role === 'owner' ? 1 : 0]
    );

    if (!conv) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phiên hội thoại.' });
    }

    const messages = await db.all(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conv.id]
    );

    res.json({
      success: true,
      conversation: conv,
      messages: messages.map((m) => ({
        id: m.id,
        senderType: m.sender_type,
        senderId: m.sender_id,
        content: m.content,
        metadata: m.metadata_json ? JSON.parse(m.metadata_json) : {},
        createdAt: m.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chat/send
 */
router.post('/send', optionalAuth, async (req, res, next) => {
  try {
    const { conversationId, agentId, skillId, message, attachments } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung tin nhắn không được để trống.' });
    }

    const userId = req.user ? req.user.id : 'usr_anonymous';

    const result = await AIRuntime.execute({
      userId,
      conversationId,
      agentId,
      skillId,
      messageText: message.trim(),
      attachments: attachments || []
    });

    if (!result.success && result.restricted) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/chat/conversations/:id
 */
router.delete('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    await db.run('UPDATE conversations SET is_archived = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Đã xóa hội thoại thành công.' });
  } catch (err) {
    next(err);
  }
});

export default router;
