import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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

// 1. CORS Configuration
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Static uploads serving
const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

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

// 5. Error & 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 6. Bootstrap Server
async function startServer() {
  try {
    console.log('🚀 Starting TRÍ AI SaaS Backend Server...');
    
    // Auto-migrate schema
    await runMigrations();

    // Auto-seed initial data (Master Admin, Agents, 33 Skills)
    await runSeeds();

    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
======================================================
  🤖 TRÍ AI SAAS PLATFORM — BACKEND ONLINE
  📡 API Server:  http://localhost:${PORT}
  🏥 Health:      http://localhost:${PORT}/api/health
  👑 Master Admin: ${env.ADMIN_EMAIL}
  🗄️ Database:    ${env.DATABASE_PATH}
======================================================
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start TRÍ AI Server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
