import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage configuration with purely random filenames (UUID)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Cryptographically secure random UUID - Never use user provided filename directly
    cb(null, `${uuidv4()}${ext}`);
  }
});

// Explicit blocked file extensions (executables, scripts, HTML/SVG markup)
export const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.mjs', '.cjs',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.jsp', '.asp', '.aspx', '.cgi', '.jar', '.war', '.py', '.pyc', '.rb', '.pl',
  '.html', '.htm', '.xhtml', '.svg', '.xml', '.dll', '.so', '.dylib', '.bin', '.msi'
]);

// Allowed file extensions whitelist
export const ALLOWED_EXTENSIONS = new Set([
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
export const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'application/pdf', 'text/plain', 'text/csv'];
export const ALLOWED_MIME_TYPES = new Set([
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
export const fileFilter = (req, file, cb) => {
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

/**
 * Verify Magic Bytes (File Header Signature) against extension & MIME
 * Rejects spoofed files (e.g. PHP/EXE renamed to PNG or PDF)
 */
export function verifyFileMagicBytes(filePath, ext) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'Tệp tin không tồn tại trên hệ thống.' };
  }

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(512);
  const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
  fs.closeSync(fd);

  if (bytesRead === 0) {
    return { valid: false, error: 'Tệp tin rỗng (0 bytes).' };
  }

  const normalizedExt = (ext || '').toLowerCase();

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (normalizedExt === '.png') {
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47 ||
        buffer[4] !== 0x0D || buffer[5] !== 0x0A || buffer[6] !== 0x1A || buffer[7] !== 0x0A) {
      return { valid: false, error: 'Tệp tin PNG không có chữ ký nhị phân hợp lệ (Invalid PNG magic bytes).' };
    }
  }

  // 2. JPEG/JPG: FF D8 FF
  else if (normalizedExt === '.jpg' || normalizedExt === '.jpeg') {
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
      return { valid: false, error: 'Tệp tin JPEG không có chữ ký nhị phân hợp lệ (Invalid JPEG magic bytes).' };
    }
  }

  // 3. GIF: GIF87a or GIF89a
  else if (normalizedExt === '.gif') {
    const header = buffer.toString('ascii', 0, 6);
    if (header !== 'GIF87a' && header !== 'GIF89a') {
      return { valid: false, error: 'Tệp tin GIF không có chữ ký nhị phân hợp lệ.' };
    }
  }

  // 4. WebP: RIFF....WEBP
  else if (normalizedExt === '.webp') {
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    if (riff !== 'RIFF' || webp !== 'WEBP') {
      return { valid: false, error: 'Tệp tin WebP không có chữ ký nhị phân hợp lệ.' };
    }
  }

  // 5. PDF: %PDF
  else if (normalizedExt === '.pdf') {
    const header = buffer.toString('ascii', 0, 4);
    if (header !== '%PDF') {
      return { valid: false, error: 'Tệp tin PDF không có chữ ký nhị phân hợp lệ (Missing %PDF header).' };
    }
  }

  // 6. ZIP, DOCX, XLSX, PPTX: PK (50 4B)
  else if (['.zip', '.docx', '.xlsx', '.pptx'].includes(normalizedExt)) {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
      return { valid: false, error: `Tệp tin ${normalizedExt.toUpperCase()} không có chữ ký PK nén hợp lệ.` };
    }
  }

  // 7. Audio: MP3, WAV
  else if (normalizedExt === '.mp3') {
    const id3 = buffer.toString('ascii', 0, 3);
    const isMpegSync = buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;
    if (id3 !== 'ID3' && !isMpegSync) {
      return { valid: false, error: 'Tệp tin MP3 không có chữ ký âm thanh hợp lệ.' };
    }
  } else if (normalizedExt === '.wav') {
    const riff = buffer.toString('ascii', 0, 4);
    const wave = buffer.toString('ascii', 8, 12);
    if (riff !== 'RIFF' || wave !== 'WAVE') {
      return { valid: false, error: 'Tệp tin WAV không có chữ ký hợp lệ.' };
    }
  }

  // 8. Plain text / CSV: Check for binary null bytes & dangerous executable/script signatures
  else if (normalizedExt === '.txt' || normalizedExt === '.csv') {
    for (let i = 0; i < Math.min(bytesRead, 256); i++) {
      if (buffer[i] === 0x00) {
        return { valid: false, error: 'Tệp tin văn bản chứa ký tự nhị phân null không hợp lệ.' };
      }
    }
    // Check for PE executable (MZ) or Linux ELF (\x7fELF)
    if ((buffer[0] === 0x4D && buffer[1] === 0x5A) || (buffer[0] === 0x7F && buffer.toString('ascii', 1, 4) === 'ELF')) {
      return { valid: false, error: 'Tệp tin chứa chữ ký mã nhị phân thực thi nguy hiểm (PE/ELF).' };
    }
    // Check for script injection in text
    const sample = buffer.toString('utf8', 0, Math.min(bytesRead, 256)).toLowerCase();
    if (sample.includes('<?php') || sample.includes('<%') || sample.includes('<script') || sample.includes('<html')) {
      return { valid: false, error: 'Tệp tin chứa mã kịch bản nguy hiểm không được phép tải lên.' };
    }
  }

  return { valid: true };
}

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1
  },
  fileFilter
});

export const uploadZip = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for skill packages
    files: 1
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
