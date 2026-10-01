import express from 'express';
import http from 'http';
import db from '../src/db/index.js';
import runMigrations from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds.js';
import { env } from '../src/config/env.js';
import { generateToken } from '../src/utils/security.js';
import orderRoutes from '../src/routes/orderRoutes.js';
import paymentRoutes from '../src/routes/paymentRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import notificationRoutes from '../src/routes/notificationRoutes.js';
import chatRoutes from '../src/routes/chatRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import LicenseEngine from '../src/services/licenseEngine.js';

async function runVietQRTests() {
  console.log('=== STARTING REAL VIETQR PAYMENT & ADMIN VERIFICATION SUITE ===');

  await runMigrations();
  await runSeeds();

  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/chat', chatRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Create two test users: Customer A and Customer B
    const now = new Date().toISOString();
    const custAId = `usr_cust_a_${Date.now()}`;
    const custAEmail = `cust_a_${Date.now()}@test.com`;
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
       VALUES (?, ?, 'hash', 'Customer A', 'customer', 'Standard', 1, ?, ?)`,
      [custAId, custAEmail, now, now]
    );

    const custBId = `usr_cust_b_${Date.now()}`;
    const custBEmail = `cust_b_${Date.now()}@test.com`;
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
       VALUES (?, ?, 'hash', 'Customer B', 'customer', 'Standard', 1, ?, ?)`,
      [custBId, custBEmail, now, now]
    );

    const adminUser = await db.get("SELECT * FROM users WHERE email = 'triqnnamabank@gmail.com'");
    const tokenA = generateToken({ userId: custAId, email: custAEmail, role: 'customer' });
    const tokenB = generateToken({ userId: custBId, email: custBEmail, role: 'customer' });
    const tokenAdmin = generateToken({ userId: adminUser.id, email: adminUser.email, role: 'owner' });

    // TEST 1: Server-side Order Creation with real VietQR
    console.log('\n[TEST 1] Customer A creates order on Server...');
    const createRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        items: [{ skillId: 'kol-thoi-trang', period: 'monthly' }],
        note: 'Order test KOL'
      })
    });
    const createData = await createRes.json();
    console.log('-> Order Response:', createData);
    if (!createData.success || !createData.order || !createData.order.qrUrl) {
      throw new Error('FAILED: Server did not return valid order or qrUrl');
    }
    if (!createData.order.qrUrl.includes('img.vietqr.io') || !createData.order.qrUrl.includes('0982441446')) {
      throw new Error('FAILED: Real VietQR URL does not contain OCB account 0982441446');
    }
    const orderId = createData.order.orderId;
    const orderCode = createData.order.orderCode;

    // TEST 2: Customer A cannot confirm payment directly
    console.log('\n[TEST 2] Customer A attempts POST /api/payments/confirm (Must return 403)...');
    const confirmRes = await fetch(`${baseUrl}/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ orderId })
    });
    console.log('-> Status:', confirmRes.status);
    if (confirmRes.status !== 403) {
      throw new Error(`FAILED: Expected 403 Forbidden on /payments/confirm, got ${confirmRes.status}`);
    }

    // TEST 3: Customer B cannot submit payment-request for Customer A's order
    console.log('\n[TEST 3] Customer B tries to submit payment-request for Customer A order (Must return 403)...');
    const fraudRes = await fetch(`${baseUrl}/orders/${orderId}/payment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ transactionRef: 'FRAUD_TXN' })
    });
    console.log('-> Status:', fraudRes.status);
    if (fraudRes.status !== 403) {
      throw new Error(`FAILED: Expected 403 Forbidden for cross-user payment request, got ${fraudRes.status}`);
    }

    // TEST 4: Anonymous cannot submit payment-request
    console.log('\n[TEST 4] Anonymous calls payment-request (Must return 401)...');
    const anonRes = await fetch(`${baseUrl}/orders/${orderId}/payment-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionRef: 'ANON_TXN' })
    });
    console.log('-> Status:', anonRes.status);
    if (anonRes.status !== 401) {
      throw new Error(`FAILED: Expected 401 Unauthorized for anonymous, got ${anonRes.status}`);
    }

    // TEST 5: Customer A submits legitimate payment-request -> Stays pending, NO license
    console.log('\n[TEST 5] Customer A submits payment-request...');
    const reqRes = await fetch(`${baseUrl}/orders/${orderId}/payment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ transactionRef: orderCode, note: 'Da chuyen khoan OCB 0982441446' })
    });
    const reqData = await reqRes.json();
    console.log('-> payment-request Response:', reqData);
    if (!reqData.success || reqData.status !== 'pending') {
      throw new Error('FAILED: payment-request must result in status pending');
    }

    // Verify License is NOT active
    const accessCheck = await LicenseEngine.checkAccess(custAId, 'kol-thoi-trang');
    console.log('-> License check before Admin verify:', accessCheck);
    if (accessCheck.granted) {
      throw new Error('FAILED: License must NOT be granted before Admin verify!');
    }

    // TEST 6: Admin gets notifications and sees "Khách hàng vừa gửi yêu cầu thanh toán"
    console.log('\n[TEST 6] Admin checks notifications...');
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenAdmin}` }
    });
    const notifData = await notifRes.json();
    console.log('-> Notifications count:', notifData.notifications?.length);
    const hasOrderNotif = notifData.notifications?.some(n => n.resource_id === orderId);
    if (!hasOrderNotif) {
      throw new Error('FAILED: Notification for this order not found for Admin');
    }

    // TEST 7: Admin verifies payment -> Order completed, License ACTIVE
    console.log('\n[TEST 7] Admin verifies payment...');
    const verifyRes = await fetch(`${baseUrl}/admin/orders/${orderId}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ transactionRef: `${orderCode}_OCB_CONFIRMED` })
    });
    const verifyData = await verifyRes.json();
    console.log('-> Verify Response:', verifyData);
    if (!verifyData.success || verifyData.status !== 'completed') {
      throw new Error('FAILED: Admin verify did not complete order');
    }

    // Verify License is now ACTIVE in Database
    const accessCheckAfter = await LicenseEngine.checkAccess(custAId, 'kol-thoi-trang');
    console.log('-> License check after Admin verify:', accessCheckAfter);
    if (!accessCheckAfter.granted) {
      throw new Error('FAILED: License must be active in Database after Admin verify!');
    }

    // TEST 8: Customer A uses Skill in Chat -> Success (Not restricted)
    console.log('\n[TEST 8] Customer A sends chat with licensed skill...');
    const chatRes = await fetch(`${baseUrl}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        skillId: 'kol-thoi-trang',
        message: 'Tôi muốn tư vấn tạo ảnh lookbook'
      })
    });
    const chatData = await chatRes.json();
    console.log('-> Chat Response status:', chatRes.status, 'success:', chatData.success);
    if (chatRes.status !== 200 || !chatData.success) {
      throw new Error('FAILED: Chat with licensed skill must succeed with 200');
    }

    console.log('\n=== ALL VIETQR & ADMIN PAYMENT TESTS PASSED 100%! ===');
  } finally {
    server.close();
  }
  process.exit(0);
}

runVietQRTests().catch(err => {
  console.error('❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
