import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of tri-ai-v1
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '80', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV !== 'production',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:5000/api',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  DATABASE_PATH: process.env.DATABASE_PATH || './.data/triai.db',
  
  JWT_SECRET: process.env.JWT_SECRET || 'triai_master_jwt_secret_dev_key_2026_qnt',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  ADMIN_EMAIL: (process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'triqnnamabank@gmail.com').toLowerCase().trim(),
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || 'Giamua@2023admin',
  
  TRIAL_DURATION_MINUTES: parseInt(process.env.TRIAL_DURATION_MINUTES || '15', 10),
  
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  
  BANK_NAME: process.env.VIETQR_BANK_CODE || process.env.BANK_NAME || 'OCB',
  BANK_ACCOUNT_NUMBER: process.env.VIETQR_ACCOUNT_NUMBER || process.env.BANK_ACCOUNT_NUMBER || '0982441446',
  BANK_ACCOUNT_HOLDER: process.env.VIETQR_ACCOUNT_NAME || process.env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ',

  // Bank Reconciliation Provider Abstraction
  BANK_PROVIDER: process.env.BANK_PROVIDER || 'manual', // 'manual' | 'casso' | 'sepay' | 'payos'
  BANK_API_KEY: process.env.BANK_API_KEY || '',
  BANK_WEBHOOK_SECRET: process.env.BANK_WEBHOOK_SECRET || '',

  // Google OAuth 2.0 / Google Identity Services
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim(),
  GOOGLE_CLIENT_SECRET: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),

  // SMTP Email Configuration
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'support@banhangdinhcao.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'TRÍ AI'
};

export const config = env;

export function validateEnvironment(targetEnv = env) {
  if (targetEnv.NODE_ENV === 'production') {
    const insecureSecrets = [
      'triai_master_jwt_secret_dev_key_2026_qnt',
      'your_jwt_secret_key',
      'secret',
      'jwt_secret'
    ];
    if (!targetEnv.JWT_SECRET || insecureSecrets.includes(targetEnv.JWT_SECRET) || targetEnv.JWT_SECRET.length < 32) {
      throw new Error('[FATAL SECURITY] Trong môi trường production, JWT_SECRET phải được cấu hình an toàn (tối thiểu 32 ký tự) và không được dùng khóa mặc định.');
    }

    const insecurePasswords = [
      'Giamua@2023admin',
      'admin123',
      'password',
      '12345678'
    ];
    if (!targetEnv.ADMIN_INITIAL_PASSWORD || insecurePasswords.includes(targetEnv.ADMIN_INITIAL_PASSWORD) || targetEnv.ADMIN_INITIAL_PASSWORD.length < 10) {
      throw new Error('[FATAL SECURITY] Trong môi trường production, ADMIN_INITIAL_PASSWORD phải được cấu hình mật khẩu mạnh (tối thiểu 10 ký tự) và không dùng mật khẩu mặc định.');
    }

    if (!targetEnv.ADMIN_EMAIL || targetEnv.ADMIN_EMAIL === 'admin@example.com') {
      throw new Error('[FATAL SECURITY] Trong môi trường production, MASTER_ADMIN_EMAIL / ADMIN_EMAIL phải được chỉ định rõ.');
    }
  }
  return true;
}

if (env.NODE_ENV === 'production') {
  validateEnvironment(env);
}

export default env;

