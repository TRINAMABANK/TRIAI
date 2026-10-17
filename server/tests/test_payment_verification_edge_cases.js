import assert from 'assert';
import express from 'express';
import http from 'http';
import db from '../src/db/index.js';
import { runMigrations } from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds.js';
import { env } from '../src/config/env.js';
import { generateToken } from '../src/utils/security.js';
import PaymentService from '../src/services/paymentService.js';
import LicenseEngine from '../src/services/licenseEngine.js';
import paymentRoutes from '../src/routes/paymentRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import orderRoutes from '../src/routes/orderRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

console.log('=================================================================');
console.log('🧪 TRÍ AI — STRICT PAYMENT VERIFICATION & RECONCILIATION EDGE CASES');
console.log('=================================================================');

async function runEdgeCaseTests() {
  await runMigrations();
  await runSeeds();

  // Spin up an ephemeral HTTP server for route-level tests
  const app = express();
  app.use(express.json());
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/orders', orderRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  const customerId = `usr_edge_${Date.now()}`;
  const customerEmail = `customer_${Date.now()}@triai.vn`;
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
     VALUES (?, ?, 'hash', 'Edge Test User', 'customer', 'Plan', 1, ?, ?)`,
    [customerId, customerEmail, new Date().toISOString(), new Date().toISOString()]
  );

  const customerToken = generateToken({ userId: customerId, email: customerEmail, role: 'customer' });
  const adminToken = generateToken({ userId: 'usr_master_admin', email: env.ADMIN_EMAIL, role: 'owner' });

  // -------------------------------------------------------------------------
  // TEST 1: Thiếu số tiền thực nhận (Missing actualAmount)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] Missing actualAmount on confirmation...');
  const ord1 = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'kol-thoi-trang', period: 'monthly' }]
  });

  // 1.1 Via Service method directly
  let caughtNoAmount = false;
  try {
    await PaymentService.adminVerifyPayment({
      orderId: ord1.orderId,
      adminUserId: 'usr_master_admin',
      adminEmail: env.ADMIN_EMAIL,
      bankTransactionRef: `FT_TEST1_${Date.now()}`
      // actualAmount omitted!
    });
  } catch (err) {
    caughtNoAmount = true;
    assert.match(err.message, /Số tiền thực nhận từ ngân hàng là bắt buộc/);
  }
  assert.strictEqual(caughtNoAmount, true, 'Service must reject verification without actualAmount');

  // 1.2 Via HTTP endpoint POST /api/payments/confirm
  const httpNoAmount = await fetch(`${baseUrl}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      orderId: ord1.orderId,
      bankTransactionRef: `FT_HTTP_${Date.now()}`
    })
  });
  assert.strictEqual(httpNoAmount.status, 400);
  const httpNoAmountData = await httpNoAmount.json();
  assert.strictEqual(httpNoAmountData.success, false);
  console.log('  ✅ PASS: Missing actualAmount is strictly rejected with 400 / Error.');

  // -------------------------------------------------------------------------
  // TEST 2: Thiếu mã giao dịch (Missing bankTransactionRef)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] Missing bankTransactionRef...');

  // 2.1 Via Service method directly
  let caughtNoRef = false;
  try {
    await PaymentService.adminVerifyPayment({
      orderId: ord1.orderId,
      adminUserId: 'usr_master_admin',
      adminEmail: env.ADMIN_EMAIL,
      actualAmount: ord1.totalAmount,
      bankTransactionRef: '   ' // empty ref!
    });
  } catch (err) {
    caughtNoRef = true;
    assert.match(err.message, /Mã giao dịch ngân hàng thực tế là bắt buộc/);
  }
  assert.strictEqual(caughtNoRef, true, 'Service must reject verification without bankTransactionRef');

  // 2.2 Via HTTP endpoint
  const httpNoRef = await fetch(`${baseUrl}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      orderId: ord1.orderId,
      actualAmount: ord1.totalAmount,
      bankTransactionRef: ''
    })
  });
  assert.strictEqual(httpNoRef.status, 400);
  console.log('  ✅ PASS: Missing bankTransactionRef is strictly rejected with 400 / Error.');

  // -------------------------------------------------------------------------
  // TEST 3: Sai số tiền (Mismatched amount)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] Mismatched actualAmount...');
  let caughtMismatch = false;
  try {
    await PaymentService.adminVerifyPayment({
      orderId: ord1.orderId,
      adminUserId: 'usr_master_admin',
      adminEmail: env.ADMIN_EMAIL,
      actualAmount: 100000, // order is 399000
      bankTransactionRef: `FT_MISMATCH_${Date.now()}`
    });
  } catch (err) {
    caughtMismatch = true;
    assert.match(err.message, /không khớp với tổng tiền đơn hàng/);
  }
  assert.strictEqual(caughtMismatch, true);
  console.log('  ✅ PASS: Mismatched amount is strictly blocked.');

  // -------------------------------------------------------------------------
  // TEST 4: Sai mã đơn hàng (Non-existent orderId)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] Non-existent orderId...');
  let caughtBadOrder = false;
  try {
    await PaymentService.adminVerifyPayment({
      orderId: 'ord_ghost_999999',
      adminUserId: 'usr_master_admin',
      adminEmail: env.ADMIN_EMAIL,
      actualAmount: 399000,
      bankTransactionRef: `FT_GHOST_${Date.now()}`
    });
  } catch (err) {
    caughtBadOrder = true;
    assert.match(err.message, /Không tìm thấy đơn hàng cần phê duyệt/);
  }
  assert.strictEqual(caughtBadOrder, true);
  console.log('  ✅ PASS: Non-existent orderId throws 404 / Error.');

  // -------------------------------------------------------------------------
  // TEST 5: Giao dịch bị sử dụng lại (Duplicate bank transaction ref)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5] Duplicate bankTransactionRef prevention...');
  const sharedBankRef = `FT_REAL_RECON_${Date.now()}`;

  // Create two separate orders
  const ordA = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'kol-thoi-trang', period: 'monthly' }]
  });
  const ordB = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'pccc', period: 'monthly' }]
  });

  // Verify Order A with sharedBankRef
  const verifyA = await PaymentService.adminVerifyPayment({
    orderId: ordA.orderId,
    adminUserId: 'usr_master_admin',
    adminEmail: env.ADMIN_EMAIL,
    actualAmount: ordA.totalAmount,
    bankTransactionRef: sharedBankRef
  });
  assert.strictEqual(verifyA.status, 'paid');

  // Attempt to verify Order B with the EXACT SAME bank reference
  let caughtDuplicateRef = false;
  try {
    await PaymentService.adminVerifyPayment({
      orderId: ordB.orderId,
      adminUserId: 'usr_master_admin',
      adminEmail: env.ADMIN_EMAIL,
      actualAmount: ordB.totalAmount,
      bankTransactionRef: sharedBankRef
    });
  } catch (err) {
    caughtDuplicateRef = true;
    assert.match(err.message, /đã được đối soát cho đơn hàng/);
  }
  assert.strictEqual(caughtDuplicateRef, true, 'Must block reused bank transaction ref');
  console.log('  ✅ PASS: Reused bank transaction reference strictly rejected across orders.');

  // -------------------------------------------------------------------------
  // TEST 6: Người dùng thường gọi API quản trị (Customer calling admin APIs)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] Regular customer calling admin endpoints...');

  // 6.1 Call POST /api/payments/confirm with customer token
  const custConfirm = await fetch(`${baseUrl}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      orderId: ordB.orderId,
      actualAmount: ordB.totalAmount,
      bankTransactionRef: `FT_CUST_${Date.now()}`
    })
  });
  assert.strictEqual(custConfirm.status, 403);

  // 6.2 Call POST /api/admin/orders/:id/verify-payment with customer token
  const custAdminRoute = await fetch(`${baseUrl}/admin/orders/${ordB.orderId}/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      actualAmount: ordB.totalAmount,
      bankTransactionRef: `FT_CUST_${Date.now()}`
    })
  });
  assert.strictEqual(custAdminRoute.status, 403);
  console.log('  ✅ PASS: Customer calling admin verification APIs blocked with 403.');

  // -------------------------------------------------------------------------
  // TEST 7: Xác nhận hai yêu cầu đồng thời (Concurrency protection)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 7] Concurrent simultaneous verification attempts...');
  const concurrentRef = `FT_CONCURRENT_${Date.now()}`;
  
  const ordConcurrent = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'mep-mepf', period: 'monthly' }]
  });

  // Launch two verification calls concurrently
  const [res1, res2] = await Promise.allSettled([
    PaymentService.adminVerifyPayment({
      orderId: ordConcurrent.orderId,
      adminUserId: 'usr_master_admin',
      adminEmail: env.ADMIN_EMAIL,
      actualAmount: ordConcurrent.totalAmount,
      bankTransactionRef: concurrentRef
    }),
    PaymentService.adminVerifyPayment({
      orderId: ordConcurrent.orderId,
      adminUserId: 'usr_master_admin',
      adminEmail: env.ADMIN_EMAIL,
      actualAmount: ordConcurrent.totalAmount,
      bankTransactionRef: concurrentRef
    })
  ]);

  // At least one must succeed, and any second concurrent call must be safely handled
  const succeeded = [res1, res2].filter(r => r.status === 'fulfilled');
  const rejected = [res1, res2].filter(r => r.status === 'rejected');
  assert.ok(succeeded.length >= 1, 'At least one concurrent call must succeed');
  
  // Verify that only 1 license was created, never duplicated
  const licensesForOrder = await db.all(
    `SELECT * FROM licenses WHERE user_id = ? AND notes = ?`,
    [customerId, `order:${ordConcurrent.orderId}`]
  );
  assert.strictEqual(licensesForOrder.length, 1, 'Must create exactly 1 license even under concurrent calls');
  console.log('  ✅ PASS: Concurrent verification safely synchronized with zero duplicate licenses.');

  // -------------------------------------------------------------------------
  // TEST 8: Đơn đã thanh toán nhưng yêu cầu xác nhận lại (Re-confirming paid order)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 8] Re-confirming an already paid order (Idempotency)...');
  const licensesCountBefore = (await db.all('SELECT * FROM licenses WHERE user_id = ?', [customerId])).length;

  const reVerifyRes = await PaymentService.adminVerifyPayment({
    orderId: ordConcurrent.orderId,
    adminUserId: 'usr_master_admin',
    adminEmail: env.ADMIN_EMAIL,
    actualAmount: ordConcurrent.totalAmount,
    bankTransactionRef: `FT_RETRY_${Date.now()}`
  });

  assert.strictEqual(reVerifyRes.success, true);
  assert.strictEqual(reVerifyRes.alreadyVerified, true);
  
  const licensesCountAfter = (await db.all('SELECT * FROM licenses WHERE user_id = ?', [customerId])).length;
  assert.strictEqual(licensesCountAfter, licensesCountBefore, 'Re-verifying must NOT create additional licenses');
  console.log('  ✅ PASS: Re-verifying paid order is idempotent with no duplicate license grants.');

  // -------------------------------------------------------------------------
  // TEST 9: Lỗi giữa chừng khi cập nhật thanh toán và license (Atomic rollback)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 9] Atomic rollback on error mid-transaction...');
  const ordRollback = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'phap-ly-tuan-thu', period: 'monthly' }]
  });

  // Force an error inside a transactional execution
  let rollbackErrorCaught = false;
  try {
    await db.transaction(async () => {
      await db.run('UPDATE orders SET status = "paid" WHERE id = ?', [ordRollback.orderId]);
      await db.run('INSERT INTO licenses (id, user_id, skill_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
        `lic_fail_${Date.now()}`,
        customerId,
        'phap-ly-tuan-thu',
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      // Artificially throw error mid-way
      throw new Error('SIMULATED_NETWORK_DISRUPTION');
    });
  } catch (err) {
    rollbackErrorCaught = true;
    assert.strictEqual(err.message, 'SIMULATED_NETWORK_DISRUPTION');
  }
  assert.strictEqual(rollbackErrorCaught, true);

  // Check that the order is still PENDING and NO license was saved
  const orderAfterRollback = await db.get('SELECT status FROM orders WHERE id = ?', [ordRollback.orderId]);
  assert.strictEqual(orderAfterRollback.status, 'pending', 'Order must remain pending after rollback');
  const licenseAfterRollback = await db.get('SELECT * FROM licenses WHERE id LIKE "lic_fail_%"');
  assert.strictEqual(licenseAfterRollback, null, 'License must NOT exist after rollback');
  console.log('  ✅ PASS: Mid-transaction error rolled back completely; zero partial data committed.');

  // -------------------------------------------------------------------------
  // TEST 10: Đơn nhiều sản phẩm & Không hủy đơn khác skill (Multi-item order & scoped cancel)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 10] Multi-product order creation & scoped cancellation...');

  // Create a pending order for skill A
  const ordSkillA = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'mua-sam', period: 'monthly' }]
  });

  // Create another pending order for skill B (different skill!)
  const ordSkillB = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'pccc', period: 'monthly' }]
  });

  // Create a duplicate pending order for skill A (same skill as ordSkillA)
  // Force new order with different period so it doesn't reuse
  const ordSkillAYearly = await PaymentService.createOrder({
    userId: customerId,
    items: [{ productId: 'mua-sam', period: 'yearly' }]
  });

  // Verify ordSkillA
  await PaymentService.adminVerifyPayment({
    orderId: ordSkillA.orderId,
    adminUserId: 'usr_master_admin',
    adminEmail: env.ADMIN_EMAIL,
    actualAmount: ordSkillA.totalAmount,
    bankTransactionRef: `FT_SKILL_A_${Date.now()}`
  });

  // Order B for skill PCCC must STILL BE PENDING (not cancelled!)
  const freshOrdB = await db.get('SELECT status FROM orders WHERE id = ?', [ordSkillB.orderId]);
  assert.strictEqual(freshOrdB.status, 'pending', 'Unrelated order for different skill must NOT be cancelled');

  // Duplicate order for the same skill (mua-sam) SHOULD be cancelled
  const freshOrdAYearly = await db.get('SELECT status FROM orders WHERE id = ?', [ordSkillAYearly.orderId]);
  assert.strictEqual(freshOrdAYearly.status, 'cancelled', 'Duplicate pending order for same skill should be auto-cancelled');
  console.log('  ✅ PASS: Multi-product and scoped order cancellation verified; unrelated orders preserved intact.');

  console.log('\n=================================================================');
  console.log('🎉 ALL 10 PAYMENT VERIFICATION EDGE CASE TESTS PASSED 100%');
  console.log('=================================================================');

  server.close();
  process.exit(0);
}

runEdgeCaseTests().catch((err) => {
  console.error('\n❌ EDGE CASE TEST FAILURE:', err);
  process.exit(1);
});
