import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import db from './db/index.js';
import { verifyToken } from './utils/security.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrations.js';
import { runSeeds } from './db/seeds.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import Routes
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import licenseRoutes from './routes/licenseRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// 1. CORS Configuration (Strict origin whitelist, disallow arbitrary origin reflection)
const allowedOrigins = [
  'https://banhangdinhcao.com',
  'https://www.banhangdinhcao.com',
  env.APP_URL
];

if (env.CORS_ORIGIN && env.CORS_ORIGIN !== '*') {
  env.CORS_ORIGIN.split(',').forEach(o => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

if (env.IS_DEV) {
  ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://localhost:80', 'http://localhost:5000'].forEach(devOrigin => {
    if (!allowedOrigins.includes(devOrigin)) allowedOrigins.push(devOrigin);
  });
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || (env.IS_DEV && origin.startsWith('http://localhost:'))) {
      return callback(null, true);
    }
    return callback(new Error('CORS request blocked by TRÍ AI security policy.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 2. Body Parsers (Strict limit to prevent ReDoS / memory exhaustion)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 3. Static uploads serving (Protected with security headers and Anti-IDOR for private files)
const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', async (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'; img-src 'self' data:;");

  const requestedFilename = path.basename(req.path);
  if (!requestedFilename) return next();

  try {
    const fileRecord = await db.get(
      'SELECT user_id, is_public FROM files WHERE storage_path LIKE ? OR storage_path LIKE ?',
      [`%${requestedFilename}`, requestedFilename]
    );

    // If file is tracked in database and marked private (is_public = 0)
    if (fileRecord && fileRecord.is_public === 0) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Tệp tin riêng tư yêu cầu đăng nhập để truy cập.' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ.' });
      }
      if (decoded.userId !== fileRecord.user_id && decoded.role !== 'admin' && decoded.role !== 'owner') {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập tệp tin riêng tư này (Forbidden).' });
      }
    }
    next();
  } catch (err) {
    next();
  }
}, express.static(uploadsPath, { dotfiles: 'ignore', index: false }));

// 4. API Routes Mounting
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 5. Serve Frontend Static SPA (Single-port deployment)
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), '../dist')
];
const distPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  console.log(`📦 Serving Frontend SPA from: ${distPath}`);
  app.use(express.static(distPath));
  // Express 5 compatible SPA fallback middleware
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// 6. Error & 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 7. Bootstrap Server
async function startServer() {
  try {
    console.log('Starting TRÍ AI SaaS Backend Server...');
    
    // Auto-migrate schema
    await runMigrations();

    // Auto-seed initial data (Master Admin, Agents, 33 Skills)
    await runSeeds();

    const PORT = env.PORT || 80;
    app.listen(PORT, () => {
      console.log(`
======================================================
  TRÍ AI SAAS PLATFORM -- BACKEND ONLINE
  API Server:   http://localhost:${PORT}
  Health:       http://localhost:${PORT}/api/health
  Master Admin: ${env.ADMIN_EMAIL}
  Database:     ${env.DATABASE_PATH}
======================================================
      `);
    });
  } catch (error) {
    console.error('[ERROR] Failed to start TRÍ AI Server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
