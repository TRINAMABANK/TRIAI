import db from '../src/db/index.js';
import { runMigrations } from '../src/db/migrations.js';
import { env } from '../src/config/env.js';
import express from 'express';
import authRoutes from '../src/routes/authRoutes.js';
import http from 'http';

async function runGoogleAuthTests() {
  console.log('=================================================================');
  console.log('🧪 TRÍ AI — GOOGLE OAUTH 2.0 / GIS AUTHENTICATION TESTS');
  console.log('=================================================================');

  await runMigrations();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;

  try {
    // 1. Test missing credential / token
    console.log('\n[TEST 1] Missing ID token & empty request...');
    const res1 = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data1 = await res1.json();
    if (res1.status === 400 && data1.success === false) {
      console.log('  ✅ PASS: Empty Google payload correctly rejected with 400.');
    } else {
      throw new Error(`Test 1 Failed: ${JSON.stringify(data1)}`);
    }

    // 2. Test invalid / fake ID token format verification
    console.log('\n[TEST 2] Invalid fake Google ID token...');
    const res2 = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake_invalid_id_token_123' })
    });
    const data2 = await res2.json();
    if (res2.status === 401 && data2.success === false) {
      console.log(`  ✅ PASS: Fake Google ID token rejected: ${data2.error}`);
    } else {
      throw new Error(`Test 2 Failed: ${JSON.stringify(data2)}`);
    }

    // 3. Test dev fallback account creation and linking
    console.log('\n[TEST 3] Account creation and linking...');
    const testGoogleEmail = 'google.customer.test@gmail.com';
    
    // Cleanup test user if exists
    await db.run('DELETE FROM users WHERE email = ?', [testGoogleEmail]);

    // First sign-in creates user
    const res3 = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testGoogleEmail,
        fullName: 'Google Test User',
        avatarUrl: 'https://lh3.googleusercontent.com/test-avatar'
      })
    });
    const data3 = await res3.json();

    if (res3.status === 200 && data3.success && data3.token) {
      console.log('  ✅ PASS: First Google sign-in created new account with JWT token.');
    } else {
      throw new Error(`Test 3 Failed: ${JSON.stringify(data3)}`);
    }

    // Second sign-in links and logs in
    const res4 = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testGoogleEmail,
        fullName: 'Google Test User Updated',
        avatarUrl: 'https://lh3.googleusercontent.com/test-avatar'
      })
    });
    const data4 = await res4.json();

    if (res4.status === 200 && data4.user.email === testGoogleEmail) {
      console.log('  ✅ PASS: Second Google sign-in successfully logged in existing linked account.');
    } else {
      throw new Error(`Test 4 Failed: ${JSON.stringify(data4)}`);
    }

    // Cleanup
    await db.run('DELETE FROM users WHERE email = ?', [testGoogleEmail]);

    console.log('\n=================================================================');
    console.log('🎉 ALL GOOGLE AUTHENTICATION TESTS PASSED 100%');
    console.log('=================================================================');
  } finally {
    server.close();
  }
}

runGoogleAuthTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
