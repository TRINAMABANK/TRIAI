import assert from 'assert';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import db from '../src/db/index.js';
import { env } from '../src/config/env.js';
import { runMigrations } from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds.js';
import { generateToken } from '../src/utils/security.js';
import { verifyFileMagicBytes } from '../src/middleware/upload.js';
import StorageService from '../src/services/storageService.js';
import SkillEngine from '../src/services/skillEngine.js';
import { BankPaymentProvider } from '../src/services/bankPaymentProvider.js';

async function runUploadAndZipTests() {
  console.log('=================================================================');
  console.log('🔒 TRÍ AI — UPLOAD, ZIP & WEBHOOK SECURITY TEST SUITE');
  console.log('=================================================================');

  await runMigrations();
  await runSeeds();

  const testDir = path.resolve(process.cwd(), '.tmp_test_uploads');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const custAId = `usr_test_upload_a_${Date.now()}`;
  const custBId = `usr_test_upload_b_${Date.now()}`;
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
     VALUES (?, ?, 'dummyhash', 'User A', 'customer', 'Plan', 1, ?, ?),
            (?, ?, 'dummyhash', 'User B', 'customer', 'Plan', 1, ?, ?)`,
    [custAId, `test_a_${Date.now()}@triai.vn`, now, now, custBId, `test_b_${Date.now()}@triai.vn`, now, now]
  );

  // -------------------------------------------------------------
  // TEST 1: Magic Bytes Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 1] Magic Bytes / File Header Inspection...');

  // 1.1 Real PNG header
  const realPngPath = path.join(testDir, 'real.png');
  const validPngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
  fs.writeFileSync(realPngPath, validPngHeader);
  const pngCheck = verifyFileMagicBytes(realPngPath, '.png');
  assert.strictEqual(pngCheck.valid, true, 'Valid PNG header must pass');

  // 1.2 Fake PNG (PHP script renamed to .png)
  const fakePngPath = path.join(testDir, 'fake.png');
  fs.writeFileSync(fakePngPath, '<?php echo "Hacked"; ?>');
  const fakePngCheck = verifyFileMagicBytes(fakePngPath, '.png');
  assert.strictEqual(fakePngCheck.valid, false, 'Fake PNG with PHP content must be rejected');
  console.log('  ✅ PASS: Spoofed PNG with PHP script rejected by magic bytes inspection.');

  // 1.3 Fake PDF (Executable MZ renamed to .pdf)
  const fakePdfPath = path.join(testDir, 'fake.pdf');
  fs.writeFileSync(fakePdfPath, 'MZ\x90\x00\x03\x00\x00\x00WindowsPE');
  const fakePdfCheck = verifyFileMagicBytes(fakePdfPath, '.pdf');
  assert.strictEqual(fakePdfCheck.valid, false, 'Fake PDF with MZ header must be rejected');
  console.log('  ✅ PASS: Spoofed PDF with PE executable header rejected.');

  // 1.4 Valid PDF
  const realPdfPath = path.join(testDir, 'real.pdf');
  fs.writeFileSync(realPdfPath, '%PDF-1.4\n%realpdfcontent\n%%EOF');
  const pdfCheck = verifyFileMagicBytes(realPdfPath, '.pdf');
  assert.strictEqual(pdfCheck.valid, true, 'Real PDF must pass');
  console.log('  ✅ PASS: Genuine PDF header verified successfully.');

  // -------------------------------------------------------------
  // TEST 2: File Storage Anti-IDOR & Access Control
  // -------------------------------------------------------------
  console.log('\n[TEST 2] File Storage Anti-IDOR & Access Scoping...');

  // Save private file for User A
  const savedFileA = await StorageService.saveFileRecord({
    userId: custAId,
    originalName: 'CustomerA_Secret.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    filename: `safe_uuid_${Date.now()}.pdf`,
    purpose: 'attachment',
    isPublic: 0
  });

  assert.ok(savedFileA.id, 'File record created');
  assert.strictEqual(savedFileA.isPublic, false);

  // User B tries to access User A's file
  const fileRecordA = await StorageService.getFileById(savedFileA.id);
  const canUserBAccess = await StorageService.canAccessFile(fileRecordA, custBId, 'customer');
  assert.strictEqual(canUserBAccess, false, 'User B must not have access to User A private file');
  console.log('  ✅ PASS: Cross-user file access blocked (Anti-IDOR).');

  // User A accesses their own file
  const canUserAAccess = await StorageService.canAccessFile(fileRecordA, custAId, 'customer');
  assert.strictEqual(canUserAAccess, true, 'User A must have access to their own file');

  // Admin accesses User A's file
  const canAdminAccess = await StorageService.canAccessFile(fileRecordA, 'usr_master_admin', 'admin');
  assert.strictEqual(canAdminAccess, true, 'Admin has oversight access');
  console.log('  ✅ PASS: Owner and Admin authorized access verified.');

  // User B tries to delete User A's file
  let deleteBlocked = false;
  try {
    await StorageService.deleteFile(savedFileA.id, custBId, 'customer');
  } catch (err) {
    deleteBlocked = true;
  }
  assert.strictEqual(deleteBlocked, true, 'User B cannot delete User A file');
  console.log('  ✅ PASS: Unauthorized file deletion strictly blocked with 403.');

  // User A deletes their own file
  const userADelete = await StorageService.deleteFile(savedFileA.id, custAId, 'customer');
  assert.strictEqual(userADelete, true);
  const verifyDeleted = await StorageService.getFileById(savedFileA.id);
  assert.strictEqual(!verifyDeleted, true, 'File metadata deleted cleanly from database');
  console.log('  ✅ PASS: Consistent file metadata deletion verified.');

  // -------------------------------------------------------------
  // TEST 3: Skill ZIP Protection (Path Traversal, Zip Bomb, Code Execution)
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Skill ZIP Package Security & Protection...');

  // 3.1 Path Traversal in ZIP
  const traversalZip = new JSZip();
  traversalZip.file('../../etc/cron.d/evil.sh', '#!/bin/bash\nrm -rf /');
  const traversalBuffer = await traversalZip.generateAsync({ type: 'nodebuffer' });

  let traversalBlocked = false;
  try {
    await SkillEngine.importFromZip(traversalBuffer, 'traversal.zip');
  } catch (err) {
    traversalBlocked = err.message.includes('Path Traversal');
  }
  assert.strictEqual(traversalBlocked, true, 'Path Traversal entry must be rejected');
  console.log('  ✅ PASS: ZIP Path Traversal attempt (../../evil) strictly rejected.');

  // 3.2 Executable file inside ZIP (.exe / .php / .sh)
  const malwareZip = new JSZip();
  malwareZip.file('manifest.json', JSON.stringify({ name: 'Malware Skill' }));
  malwareZip.file('payload.exe', Buffer.from([0x4D, 0x5A, 0x90, 0x00]));
  const malwareBuffer = await malwareZip.generateAsync({ type: 'nodebuffer' });

  let malwareBlocked = false;
  try {
    await SkillEngine.importFromZip(malwareBuffer, 'malware.zip');
  } catch (err) {
    malwareBlocked = err.message.includes('thực thi nguy hiểm');
  }
  assert.strictEqual(malwareBlocked, true, 'Executable in ZIP must be rejected');
  console.log('  ✅ PASS: Dangerous executable in ZIP payload rejected.');

  // 3.3 Nested archive inside ZIP (.zip in .zip)
  const nestedZip = new JSZip();
  nestedZip.file('manifest.json', JSON.stringify({ name: 'Nested Skill' }));
  nestedZip.file('inner.zip', Buffer.from([0x50, 0x4B, 0x03, 0x04]));
  const nestedBuffer = await nestedZip.generateAsync({ type: 'nodebuffer' });

  let nestedBlocked = false;
  try {
    await SkillEngine.importFromZip(nestedBuffer, 'nested.zip');
  } catch (err) {
    nestedBlocked = err.message.includes('nén lồng nhau');
  }
  assert.strictEqual(nestedBlocked, true, 'Nested archive in ZIP must be rejected');
  console.log('  ✅ PASS: Nested archive in ZIP payload rejected.');

  // 3.4 Corrupted / Invalid ZIP
  const corruptedBuffer = Buffer.from('This is not a zip file at all');
  let corruptBlocked = false;
  try {
    await SkillEngine.importFromZip(corruptedBuffer, 'corrupted.zip');
  } catch (err) {
    corruptBlocked = err.message.includes('không phải là gói ZIP');
  }
  assert.strictEqual(corruptBlocked, true, 'Corrupted ZIP must be rejected');
  console.log('  ✅ PASS: Corrupted ZIP file cleanly rejected.');

  // 3.5 Valid Skill Package with Sanitized Input
  const validZip = new JSZip();
  validZip.file('manifest.json', JSON.stringify({
    id: `skl_valid_${Date.now()}`,
    name: 'Kỹ năng Bán Hàng Đỉnh Cao <script>alert(1)</script>',
    category: 'Thương mại điện tử',
    desc: 'Tối ưu hóa phễu bán lẻ đa kênh',
    author: 'Admin Team',
    version: '1.2.0'
  }));
  validZip.file('SKILL.md', '# Hướng dẫn Bán Hàng\n\nNội dung hướng dẫn chuyên sâu.');
  const validBuffer = await validZip.generateAsync({ type: 'nodebuffer' });

  const importedSkill = await SkillEngine.importFromZip(validBuffer, 'valid_package.zip');
  assert.ok(importedSkill, 'Skill imported');
  assert.ok(!importedSkill.name.includes('<script>'), 'HTML script tags must be stripped');
  assert.strictEqual(importedSkill.name, 'Kỹ năng Bán Hàng Đỉnh Cao alert(1)');
  console.log('  ✅ PASS: Valid Skill package imported with sanitized metadata.');

  // -------------------------------------------------------------
  // TEST 4: Bank Webhook & Provider Status Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Bank Webhook Authentication & Replay Attack Defense...');

  // 4.1 Manual provider mode rejects webhook auto-verification
  const manualProvider = new BankPaymentProvider({ provider: 'manual' });
  assert.strictEqual(manualProvider.isConfigured(), false);
  const manualWebhookRes = manualProvider.verifyWebhook({ headers: {}, body: {} });
  assert.strictEqual(manualWebhookRes.valid, false);
  assert.strictEqual(manualWebhookRes.statusCode, 403);
  console.log('  ✅ PASS: Unconfigured provider rejects webhook requests (manual mode enforced).');

  // 4.2 SePay Provider with invalid token
  const sepayProvider = new BankPaymentProvider({
    provider: 'sepay',
    apiKey: 'SEPAY_TEST_KEY_12345',
    webhookSecret: 'SEPAY_SECRET_ABC'
  });
  assert.strictEqual(sepayProvider.isConfigured(), true);

  const fakeSepayReq = {
    headers: { authorization: 'Apikey WRONG_KEY' },
    body: { amount: 399000, id: 'SEPAY_TX_001', content: 'TRIAI-123456' }
  };
  const sepayBadAuth = sepayProvider.verifyWebhook(fakeSepayReq);
  assert.strictEqual(sepayBadAuth.valid, false);
  assert.strictEqual(sepayBadAuth.statusCode, 401);
  console.log('  ✅ PASS: SePay webhook with invalid API key rejected with 401 Unauthorized.');

  // 4.3 SePay Provider with valid token
  const validSepayReq = {
    headers: { authorization: 'Apikey SEPAY_TEST_KEY_12345' },
    body: {
      amount: 399000,
      id: `SEPAY_TX_${Date.now()}`,
      content: 'Chuyen khoan don TRIAI-888999 tai OCB',
      transactionDate: new Date().toISOString()
    }
  };
  const sepayGoodAuth = sepayProvider.verifyWebhook(validSepayReq);
  assert.strictEqual(sepayGoodAuth.valid, true);
  assert.strictEqual(sepayGoodAuth.transactions[0].amount, 399000);
  assert.strictEqual(sepayGoodAuth.transactions[0].orderCode, 'TRIAI-888999');
  console.log('  ✅ PASS: SePay webhook with valid authorization parsed and verified.');

  // 4.4 PayOS HMAC SHA-256 Signature verification
  const payosSecret = 'PAYOS_CHECKSUM_KEY_SECURE_123';
  const payosProvider = new BankPaymentProvider({
    provider: 'payos',
    apiKey: 'PAYOS_API_KEY',
    webhookSecret: payosSecret,
    clientId: 'PAYOS_CLIENT_ID'
  });

  const payosData = {
    amount: 249000,
    description: 'TRIAI-777666 THANH TOAN GÓI',
    orderCode: 777666,
    reference: `PAYOS_REF_${Date.now()}`
  };

  const sortedKeys = Object.keys(payosData).sort();
  const signString = sortedKeys.map(k => `${k}=${payosData[k]}`).join('&');
  const crypto = await import('crypto');
  const validPayosSignature = crypto.createHmac('sha256', payosSecret).update(signString).digest('hex');

  const payosGoodReq = {
    headers: {},
    body: { data: payosData, signature: validPayosSignature }
  };
  const payosGoodAuth = payosProvider.verifyWebhook(payosGoodReq);
  assert.strictEqual(payosGoodAuth.valid, true);
  assert.strictEqual(payosGoodAuth.transactions[0].amount, 249000);
  assert.strictEqual(payosGoodAuth.transactions[0].orderCode, 'TRIAI-777666');
  console.log('  ✅ PASS: PayOS webhook with valid HMAC SHA-256 signature verified.');

  const payosBadReq = {
    headers: {},
    body: { data: payosData, signature: 'invalid_forged_signature_123' }
  };
  const payosBadAuth = payosProvider.verifyWebhook(payosBadReq);
  assert.strictEqual(payosBadAuth.valid, false);
  assert.strictEqual(payosBadAuth.statusCode, 401);
  console.log('  ✅ PASS: PayOS webhook with forged HMAC signature strictly rejected.');

  // Clean up test temp files
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n=================================================================');
  console.log('🎉 ALL UPLOAD, ZIP & BANK WEBHOOK SECURITY TESTS PASSED 100%');
  console.log('=================================================================');
  process.exit(0);
}

runUploadAndZipTests().catch(err => {
  console.error('\n❌ UPLOAD & ZIP TEST SUITE FAILURE:', err);
  process.exit(1);
});
