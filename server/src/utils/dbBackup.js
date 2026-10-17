import path from 'path';
import fs from 'fs';
import db from '../db/index.js';
import { env } from '../config/env.js';

export async function backupDatabase(targetDir = './.backups') {
  const resolvedTargetDir = path.resolve(process.cwd(), targetDir);
  if (!fs.existsSync(resolvedTargetDir)) {
    fs.mkdirSync(resolvedTargetDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `triai_backup_${timestamp}.db`;
  const backupFilePath = path.join(resolvedTargetDir, backupFileName);

  console.log(`[DB BACKUP] Checkpointing WAL and backing up database to: ${backupFilePath}...`);

  // 1. Force WAL log flush and checkpoint to disk
  await db.run('PRAGMA wal_checkpoint(TRUNCATE);');

  // 2. Atomic copy of clean SQLite database file
  const currentDbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
  fs.copyFileSync(currentDbPath, backupFilePath);

  const stats = fs.statSync(backupFilePath);
  console.log(`[DB BACKUP SUCCESS] Backup completed: ${backupFileName} (${(stats.size / 1024).toFixed(1)} KB)`);

  return {
    success: true,
    fileName: backupFileName,
    filePath: backupFilePath,
    sizeBytes: stats.size,
    timestamp: new Date().toISOString()
  };
}

export async function restoreDatabase(backupFilePath) {
  const resolvedBackupPath = path.resolve(process.cwd(), backupFilePath);
  if (!fs.existsSync(resolvedBackupPath)) {
    throw new Error(`Backup file not found at: ${resolvedBackupPath}`);
  }

  const currentDbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
  console.log(`[DB RESTORE] Restoring database from ${resolvedBackupPath} to ${currentDbPath}...`);

  // Verify backup file header (SQLite format 3)
  const fd = fs.openSync(resolvedBackupPath, 'r');
  const header = Buffer.alloc(16);
  fs.readSync(fd, header, 0, 16, 0);
  fs.closeSync(fd);

  if (header.toString('utf8', 0, 15) !== 'SQLite format 3') {
    throw new Error('Selected backup file is not a valid SQLite database.');
  }

  // Copy backup to database location
  fs.copyFileSync(resolvedBackupPath, currentDbPath);
  console.log(`[DB RESTORE SUCCESS] Database successfully restored from ${backupFilePath}`);

  return {
    success: true,
    message: 'Database restored successfully.'
  };
}

// Allow direct CLI execution: node server/src/utils/dbBackup.js [backup|restore] [path]
if (process.argv[1] && process.argv[1].endsWith('dbBackup.js')) {
  const action = process.argv[2] || 'backup';
  if (action === 'backup') {
    backupDatabase().then(() => process.exit(0)).catch(err => {
      console.error('[DB BACKUP ERROR]', err);
      process.exit(1);
    });
  } else if (action === 'restore') {
    const file = process.argv[3];
    if (!file) {
      console.error('Usage: node dbBackup.js restore <path-to-backup.db>');
      process.exit(1);
    }
    restoreDatabase(file).then(() => process.exit(0)).catch(err => {
      console.error('[DB RESTORE ERROR]', err);
      process.exit(1);
    });
  }
}
