import express from 'express';
import http from 'http';
import paymentRoutes from '../src/routes/paymentRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import chatRoutes from '../src/routes/chatRoutes.js';
import { generateToken } from '../src/utils/security.js';
import db from '../src/db/index.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

async function runRouteSecurityTests() {
  console.log('--- STARTING ROUTE-LEVEL SECURITY TESTS (VIA FETCH) ---');

  const app = express();
  app.use(express.json());
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/chat', chatRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    const customerUser = await db.get("SELECT * FROM users WHERE role = 'customer' LIMIT 1");
    const adminUser = await db.get("SELECT * FROM users WHERE email = 'triqnnamabank@gmail.com'");

    const customerToken = generateToken({ userId: customerUser.id, email: customerUser.email, role: 'customer' });
    const adminToken = generateToken({ userId: adminUser.id, email: adminUser.email, role: 'owner' });

    // TEST 1: Customer calling POST /api/payments/confirm -> MUST BE 403 FORBIDDEN
    console.log('\n[TEST A] Customer calls POST /api/payments/confirm...');
    const res1 = await fetch(`${baseUrl}/api/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ orderId: 'ord_fake_123' })
    });
    const data1 = await res1.json();
    console.log(`-> Response Status: ${res1.status}, body:`, data1);
    if (res1.status !== 403) {
      throw new Error(`FAILED: Expected 403 Forbidden but got ${res1.status}`);
    }

    // TEST 2: Anonymous calling POST /api/payments/confirm -> MUST BE 401 UNAUTHORIZED
    console.log('\n[TEST B] Anonymous calls POST /api/payments/confirm...');
    const res2 = await fetch(`${baseUrl}/api/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'ord_fake_123' })
    });
    const data2 = await res2.json();
    console.log(`-> Response Status: ${res2.status}, body:`, data2);
    if (res2.status !== 401) {
      throw new Error(`FAILED: Expected 401 Unauthorized but got ${res2.status}`);
    }

    // TEST 3: Calling webhook -> Auto-grant must be false
    console.log('\n[TEST C] Calling POST /api/payments/webhook...');
    const res3 = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode: 'TRIAI-999999', amount: 199000 })
    });
    const data3 = await res3.json();
    console.log(`-> Response Status: ${res3.status}, autoGrant:`, data3.autoGrant);
    if (data3.autoGrant !== false) {
      throw new Error(`FAILED: Webhook must NOT auto-grant!`);
    }

    // TEST 4: Customer calling POST /api/chat/send with a locked skill -> HTTP 403 license_required
    console.log('\n[TEST D] Customer sends chat with locked skill...');
    const res4 = await fetch(`${baseUrl}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        skillId: 'mep-mepf',
        message: 'Xin chào trợ lý'
      })
    });
    const data4 = await res4.json();
    console.log(`-> Response Status: ${res4.status}, body:`, data4);
    if (res4.status !== 403 || data4.reason !== 'license_required') {
      throw new Error(`FAILED: Expected 403 license_required but got ${res4.status}`);
    }

    console.log('\n--- ALL ROUTE-LEVEL SECURITY TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    server.close();
  }
  process.exit(0);
}

runRouteSecurityTests().catch(err => {
  console.error('❌ ROUTE TEST FAILED:', err);
  process.exit(1);
});
