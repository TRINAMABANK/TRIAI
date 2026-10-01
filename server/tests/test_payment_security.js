import db from './src/db/index.js';
import runMigrations from './src/db/migrations.js';
import { runSeeds } from './src/db/seeds.js';
import PaymentService from './src/services/paymentService.js';
import LicenseEngine from './src/services/licenseEngine.js';
import { generateToken } from './src/utils/security.js';

async function runTests() {
  console.log('--- STARTING PAYMENT SECURITY & ADMIN VERIFICATION TESTS ---');

  // 1. Run migrations and seeds
  await runMigrations();
  await runSeeds();

  // Create a dummy customer
  const customerId = `usr_test_${Date.now()}`;
  const customerEmail = `customer_${Date.now()}@test.com`;
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
     VALUES (?, ?, 'hash', 'Test Customer', 'customer', 'Standard', 1, ?, ?)`,
    [customerId, customerEmail, now, now]
  );

  console.log(`\n[TEST 1] Customer creates an order...`);
  const orderRes = await PaymentService.createOrder({
    userId: customerId,
    items: [{ skillId: 'kol-thoi-trang', period: 'monthly' }],
    note: 'Mua ban quyen KOL'
  });

  console.log(`-> Order Created: ${orderRes.orderCode}, Status: ${orderRes.status}`);
  if (orderRes.status !== 'pending') {
    throw new Error('FAILED: Initial order status must be pending!');
  }

  // Check if license was granted
  const accessBefore = await LicenseEngine.checkAccess(customerId, 'kol-thoi-trang');
  console.log(`-> License check before admin approval: granted=${accessBefore.granted}, reason=${accessBefore.reason}`);
  if (accessBefore.granted) {
    throw new Error('FAILED: License must NOT be granted upon order creation!');
  }

  // Check notification created
  const notif = await db.get('SELECT * FROM notifications WHERE order_id = ?', [orderRes.orderId]);
  console.log(`-> Notification in DB: title="${notif?.title}", is_read=${notif?.is_read}`);
  if (!notif) {
    throw new Error('FAILED: Admin notification was not created!');
  }

  console.log(`\n[TEST 2] Customer submits payment proof...`);
  const proofRes = await PaymentService.submitPaymentProof({
    orderId: orderRes.orderId,
    transactionRef: 'FT240982441446',
    note: 'Đã chuyển khoản OCB',
    userId: customerId
  });

  console.log(`-> Proof submission response: status=${proofRes.status}, message=${proofRes.message}`);
  const accessAfterProof = await LicenseEngine.checkAccess(customerId, 'kol-thoi-trang');
  console.log(`-> License check after proof submission: granted=${accessAfterProof.granted}`);
  if (accessAfterProof.granted) {
    throw new Error('FAILED: License must NOT be granted after proof submission!');
  }

  console.log(`\n[TEST 3] Admin verifies actual payment...`);
  const verifyRes = await PaymentService.adminVerifyPayment({
    orderId: orderRes.orderId,
    adminUserId: 'usr_master_admin',
    adminEmail: 'triqnnamabank@gmail.com',
    transactionRef: 'FT240982441446_VERIFIED'
  });

  console.log(`-> Admin Verify response: status=${verifyRes.status}, message=${verifyRes.message}`);

  // Check DB state
  const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderRes.orderId]);
  const updatedPayment = await db.get('SELECT * FROM payments WHERE order_id = ?', [orderRes.orderId]);
  console.log(`-> Order status in DB: ${updatedOrder.status}`);
  console.log(`-> Payment status in DB: ${updatedPayment.status}`);

  if (updatedOrder.status !== 'completed' || updatedPayment.status !== 'success') {
    throw new Error('FAILED: DB order and payment must be completed/success!');
  }

  // Check License access
  const accessAfterVerify = await LicenseEngine.checkAccess(customerId, 'kol-thoi-trang');
  console.log(`-> License check after admin verify: granted=${accessAfterVerify.granted}, type=${accessAfterVerify.type}`);
  if (!accessAfterVerify.granted) {
    throw new Error('FAILED: License must be active after Admin verification!');
  }

  // Check Audit Log
  const auditLog = await db.get("SELECT * FROM audit_logs WHERE action = 'verify_payment' AND resource_id = ?", [orderRes.orderId]);
  console.log(`-> Audit log created: ${auditLog?.action}, details=${auditLog?.details_json}`);
  if (!auditLog) {
    throw new Error('FAILED: Audit log not recorded!');
  }

  console.log('\n--- ALL PAYMENT SECURITY TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
