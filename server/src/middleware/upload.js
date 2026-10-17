import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitize basename to remove directory traversal and illegal characters
    const cleanBase = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

// Explicit blocked file extensions (executables, scripts, HTML/SVG markup)
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.mjs', '.cjs',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.jsp', '.asp', '.aspx', '.cgi', '.jar', '.war', '.py', '.pyc', '.rb', '.pl',
  '.html', '.htm', '.xhtml', '.svg', '.xml', '.dll', '.so', '.dylib', '.bin', '.msi'
]);

// Allowed file extensions whitelist
const ALLOWED_EXTENSIONS = new Set([
  // Images
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
  // Audio
  '.mp3', '.wav', '.m4a', '.ogg', '.webm',
  // Compressed
  '.zip'
]);

// Allowed MIME types
const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'application/pdf', 'text/plain', 'text/csv'];
const ALLOWED_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed'
]);

// File upload filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (BLOCKED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Tệp tin có đuôi mở rộng '${ext}' bị từ chối vì lý do an ninh hệ thống.`));
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Định dạng tệp tin '${ext}' không được hỗ trợ tải lên.`));
  }

  const isMimeAllowed = ALLOWED_MIME_PREFIXES.some(prefix => file.mimetype.startsWith(prefix)) || ALLOWED_MIME_TYPES.has(file.mimetype);
  if (!isMimeAllowed) {
    return cb(new Error(`MIME type '${file.mimetype}' không hợp lệ.`));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter
});

export const uploadZip = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for skill packages
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.zip' && (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.mimetype === 'application/octet-stream')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file gói nén định dạng .ZIP'));
    }
  }
});

export default upload;
