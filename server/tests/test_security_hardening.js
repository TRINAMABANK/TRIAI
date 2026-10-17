import assert from 'assert';
import express from 'express';
import http from 'http';
import db from '../src/db/index.js';
import { runMigrations } from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds.js';
import { env, validateEnvironment } from '../src/config/env.js';
import { generateToken, hashPassword } from '../src/utils/security.js';
import { upload } from '../src/middleware/upload.js';
import authRoutes from '../src/routes/authRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import fileRoutes from '../src/routes/fileRoutes.js';
import notificationRoutes from '../src/routes/notificationRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

console.log('=================================================================');
console.log('🔒 TRÍ AI — FULL-STACK SECURITY & VULNERABILITY HARDENING TESTS');
console.log('=================================================================');

async function runSecurityTests() {
  await runMigrations();
  await runSeeds();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  // -------------------------------------------------------------
  // TEST 1: Production Environment Secret & Password Validation
  // -------------------------------------------------------------
  console.log('\n[TEST 1] Production Environment Security Validation...');
  
  assert.throws(
    () => {
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'triai_master_jwt_secret_dev_key_2026_qnt', // default insecure
        ADMIN_INITIAL_PASSWORD: 'SecurePassword123!',
        ADMIN_EMAIL: 'triqnnamabank@gmail.com'
      });
    },
    /JWT_SECRET phải được cấu hình an toàn/,
    'Must reject default JWT_SECRET in production'
  );

  assert.throws(
    () => {
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'a_very_long_and_extremely_secure_jwt_secret_string_32_chars',
        ADMIN_INITIAL_PASSWORD: 'Giamua@2023admin', // default insecure
        ADMIN_EMAIL: 'triqnnamabank@gmail.com'
      });
    },
    /ADMIN_INITIAL_PASSWORD phải được cấu hình mật khẩu mạnh/,
    'Must reject default ADMIN_INITIAL_PASSWORD in production'
  );

  const isValidProd = validateEnvironment({
    NODE_ENV: 'production',
    JWT_SECRET: 'this_is_a_highly_secure_production_jwt_secret_key_2026_valid',
    ADMIN_INITIAL_PASSWORD: 'SuperStrongProductionAdminPass!2026',
    ADMIN_EMAIL: 'triqnnamabank@gmail.com'
  });
  assert.strictEqual(isValidProd, true);
  console.log('  ✅ PASS: Production startup validation strictly blocks insecure defaults.');

  // -------------------------------------------------------------
  // TEST 2: Public Registration Privilege Escalation Prevention
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Public Registration Privilege Escalation & Password Policy...');

  // 2.1 Attempt to register as master admin email
  const regAdminAttempt = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: env.ADMIN_EMAIL,
      password: 'HackerPassword123!',
      fullName: 'Fake Admin'
    })
  });
  const regAdminData = await regAdminAttempt.json();
  assert.strictEqual(regAdminAttempt.status, 403, 'Must return 403 Forbidden for admin email registration');
  assert.strictEqual(regAdminData.success, false);
  console.log('  ✅ PASS: Direct registration with Master Admin email strictly blocked (403).');

  // 2.2 Attempt to register with weak password (< 8 chars)
  const regWeakPass = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'weakuser@triai.vn',
      password: '123',
      fullName: 'Weak Password User'
    })
  });
  const regWeakData = await regWeakPass.json();
  assert.strictEqual(regWeakPass.status, 400);
  assert.strictEqual(regWeakData.success, false);
  console.log('  ✅ PASS: Weak passwords (< 8 characters) strictly rejected (400).');

  // 2.3 Valid public registration always receives customer role only
  const validEmail = `cust_security_${Date.now()}@triai.vn`;
  const regValid = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: validEmail,
      password: 'StrongUserPassword123!',
      fullName: 'Security Test Customer'
    })
  });
  const regValidData = await regValid.json();
  assert.strictEqual(regValid.status, 201);
  assert.strictEqual(regValidData.user.role, 'customer', 'Public registration must never elevate to admin/owner');
  const userToken = regValidData.token;
  const custId = regValidData.user.id;
  console.log('  ✅ PASS: Public registration succeeds with role "customer".');

  // -------------------------------------------------------------
  // TEST 3: Google OAuth Dev Fallback Security
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Google OAuth Dev Fallback & Admin Spoofing Prevention...');

  // 3.1 Attempt dev mock using Master Admin email
  const mockAdminAttempt = await fetch(`${baseUrl}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: env.ADMIN_EMAIL,
      fullName: 'Fake Google Admin'
    })
  });
  const mockAdminData = await mockAdminAttempt.json();
  assert.strictEqual(mockAdminAttempt.status, 403, 'Dev mock cannot spoof admin');
  assert.strictEqual(mockAdminData.success, false);
  console.log('  ✅ PASS: Dev mock Google login cannot claim Master Admin account (403).');

  // -------------------------------------------------------------
  // TEST 4: File Upload Whitelist & Authentication
  // -------------------------------------------------------------
  console.log('\n[TEST 4] File Upload Security & Dangerous Extension Blocking...');

  // 4.1 Anonymous upload rejected
  const anonUpload = await fetch(`${baseUrl}/files/upload`, {
    method: 'POST'
  });
  assert.strictEqual(anonUpload.status, 401, 'Anonymous file upload must be rejected (401)');
  console.log('  ✅ PASS: Anonymous file upload blocked with 401.');

  // 4.2 Test upload.fileFilter logic directly against dangerous extensions
  const fakeReq = {};
  const testFiles = [
    { originalname: 'malicious.php', mimetype: 'application/x-php', shouldPass: false },
    { originalname: 'exploit.exe', mimetype: 'application/octet-stream', shouldPass: false },
    { originalname: 'script.sh', mimetype: 'application/x-sh', shouldPass: false },
    { originalname: 'xss.html', mimetype: 'text/html', shouldPass: false },
    { originalname: 'document.pdf', mimetype: 'application/pdf', shouldPass: true },
    { originalname: 'photo.png', mimetype: 'image/png', shouldPass: true }
  ];

  for (const tf of testFiles) {
    let filterError = null;
    let filterResult = null;
    upload.fileFilter(fakeReq, tf, (err, pass) => {
      filterError = err;
      filterResult = pass;
    });

    if (tf.shouldPass) {
      assert.strictEqual(filterError, null, `Allowed file ${tf.originalname} should not produce error`);
      assert.strictEqual(filterResult, true);
    } else {
      assert.ok(filterError, `Dangerous file ${tf.originalname} must be rejected`);
    }
  }
  console.log('  ✅ PASS: Strict extension whitelist blocks .php, .exe, .sh, .html while allowing .pdf, .png.');

  // -------------------------------------------------------------
  // TEST 5: Notification User Access Control Scoping
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Notification Access Scoping (Anti-IDOR)...');

  // Insert a private notification for user A
  const notifIdA = `notif_priv_${Date.now()}`;
  await db.run(
    `INSERT INTO notifications (id, user_id, type, title, message, resource_type, resource_id, is_read, created_at)
     VALUES (?, ?, 'system', 'Private Notif', 'Confidential info', 'test', '123', 0, ?)`,
    [notifIdA, custId, new Date().toISOString()]
  );

  // User B tries to mark user A's notification as read
  const userBId = `usr_cust_b_${Date.now()}`;
  const userBEmail = `other_cust_${Date.now()}@triai.vn`;
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
     VALUES (?, ?, 'dummyhash', 'User B', 'customer', 'Plan', 1, ?, ?)`,
    [userBId, userBEmail, new Date().toISOString(), new Date().toISOString()]
  );
  const userBToken = generateToken({ userId: userBId, email: userBEmail, role: 'customer' });
  const idorAttempt = await fetch(`${baseUrl}/notifications/${notifIdA}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userBToken}`
    }
  });
  const idorData = await idorAttempt.json();
  assert.strictEqual(idorAttempt.status, 403, 'Must return 403 when tampering with another user notification');
  assert.strictEqual(idorData.success, false);

  // User A marks their own notification as read
  const legitimateRead = await fetch(`${baseUrl}/notifications/${notifIdA}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  const legitData = await legitimateRead.json();
  assert.strictEqual(legitimateRead.status, 200);
  assert.strictEqual(legitData.success, true);
  console.log('  ✅ PASS: Notification access strictly scoped to recipient; cross-user tampering blocked (403).');

  // -------------------------------------------------------------
  // TEST 6: Admin Privilege Protection (Cannot Lock or Demote Master Admin)
  // -------------------------------------------------------------
  console.log('\n[TEST 6] Master Admin Account Protection & Privilege Boundaries...');

  const masterUser = await db.get('SELECT * FROM users WHERE email = ?', [env.ADMIN_EMAIL]);
  assert.ok(masterUser, 'Master admin user must exist');

  // Create a regular admin user
  const regularAdminId = `usr_reg_admin_${Date.now()}`;
  const staffAdminEmail = `staff_admin_${Date.now()}@triai.vn`;
  const regAdminPassHash = await hashPassword('AdminPass123!');
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 'Staff Admin', 'admin', 'Staff Plan', 1, ?, ?)`,
    [regularAdminId, staffAdminEmail, regAdminPassHash, new Date().toISOString(), new Date().toISOString()]
  );
  const staffAdminToken = generateToken({ userId: regularAdminId, email: staffAdminEmail, role: 'admin' });

  // 6.1 Staff admin tries to lock Master Admin
  const lockMasterAttempt = await fetch(`${baseUrl}/admin/users/${masterUser.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffAdminToken}`
    },
    body: JSON.stringify({ is_active: false })
  });
  assert.strictEqual(lockMasterAttempt.status, 403, 'Must return 403 when trying to lock Master Admin');

  // 6.2 Staff admin tries to demote Master Admin
  const demoteMasterAttempt = await fetch(`${baseUrl}/admin/users/${masterUser.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffAdminToken}`
    },
    body: JSON.stringify({ role: 'customer' })
  });
  assert.strictEqual(demoteMasterAttempt.status, 403, 'Must return 403 when trying to demote Master Admin');

  // 6.3 Staff admin tries to promote another customer to Owner
  const promoteAttempt = await fetch(`${baseUrl}/admin/users/${custId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffAdminToken}`
    },
    body: JSON.stringify({ role: 'owner' })
  });
  assert.strictEqual(promoteAttempt.status, 403, 'Staff admin cannot promote anyone to owner');
  console.log('  ✅ PASS: Master Admin protected from lock/demotion; owner promotion restricted to existing owner.');

  // -------------------------------------------------------------
  // TEST 7: Rate Limiter Middleware
  // -------------------------------------------------------------
  console.log('\n[TEST 7] In-Memory Rate Limiting Verification...');

  let rateLimitHit = false;
  for (let i = 0; i < 25; i++) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ratelimit@test.com', password: 'wrongpassword' })
    });
    if (res.status === 429) {
      rateLimitHit = true;
      const data = await res.json();
      assert.strictEqual(data.success, false);
      break;
    }
  }
  assert.strictEqual(rateLimitHit, true, 'Rate limiter must trigger HTTP 429 after threshold');
  console.log('  ✅ PASS: Rate limiter correctly triggered HTTP 429 Too Many Requests.');

  console.log('\n=================================================================');
  console.log('🎉 ALL SECURITY HARDENING TESTS PASSED 100%');
  console.log('=================================================================');
  process.exit(0);
}

runSecurityTests().catch((err) => {
  console.error('\n❌ SECURITY TEST FAILURE:', err);
  process.exit(1);
});
