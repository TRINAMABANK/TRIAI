import express from 'express';
import db from '../db/index.js';
import { env } from '../config/env.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbTest = await db.get('SELECT 1 as connected');
    res.json({
      status: 'healthy',
      platform: 'TRÍ AI SaaS Platform',
      version: '1.0.0',
      database: dbTest?.connected === 1 ? 'connected' : 'disconnected',
      environment: env.NODE_ENV,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

export default router;
