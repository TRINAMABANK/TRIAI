import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of tri-ai-v1
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV !== 'production',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:5000/api',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  DATABASE_PATH: process.env.DATABASE_PATH || './.data/triai.db',
  
  JWT_SECRET: process.env.JWT_SECRET || 'triai_master_jwt_secret_dev_key_2026_qnt',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  ADMIN_EMAIL: (process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'triqnnamabank@gmail.com').toLowerCase().trim(),
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || 'TriAI@2026!Admin',
  
  TRIAL_DURATION_MINUTES: parseInt(process.env.TRIAL_DURATION_MINUTES || '15', 10),
  
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  
  BANK_NAME: process.env.VIETQR_BANK_CODE || process.env.BANK_NAME || 'OCB',
  BANK_ACCOUNT_NUMBER: process.env.VIETQR_ACCOUNT_NUMBER || process.env.BANK_ACCOUNT_NUMBER || '0982441446',
  BANK_ACCOUNT_HOLDER: process.env.VIETQR_ACCOUNT_NAME || process.env.BANK_ACCOUNT_HOLDER || 'QUANG NHỰT TRÍ'
};

export const config = env;

export default env;
