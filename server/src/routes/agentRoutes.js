import express from 'express';
import AgentEngine from '../services/agentEngine.js';
import { requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/agents
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const agents = await AgentEngine.getAllAgents(true);
    res.json({ success: true, data: agents });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agents/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const agent = await AgentEngine.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin Agent.' });
    }
    res.json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agents (Admin only)
 */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const agent = await AgentEngine.upsertAgent(req.body);
    res.json({ success: true, data: agent, message: 'Đã lưu cấu hình Agent thành công.' });
  } catch (err) {
    next(err);
  }
});

export default router;
