import assert from 'assert';
import { resolveOrderProduct, PRICING_CATALOG } from '../src/config/pricing.js';
import { PaymentService } from '../src/services/paymentService.js';
import { runMigrations } from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds.js';
import db from '../src/db/index.js';

async function runTests() {
  console.log('=== RUNNING COMMERCIAL PRICING & ORDER TESTS ===');

  // Initialize DB schema & seeds
  await runMigrations();
  await runSeeds();

  // Test 1: Pricing Resolution & Yearly Rule (10 months price = 12 months usage)
  console.log('\n[TEST 1] Verifying Official Pricing Catalog & 10-Month Yearly Rule...');

  const testCases = [
    { id: 'skill-mua-sam', expectedMonth: 199000, expectedYear: 1990000 },
    { id: 'skill-pccc', expectedMonth: 249000, expectedYear: 2490000 },
    { id: 'skill-mep', expectedMonth: 299000, expectedYear: 2990000 },
    { id: 'skill-phap-ly', expectedMonth: 299000, expectedYear: 2990000 },
    { id: 'skill-kol', expectedMonth: 399000, expectedYear: 3990000 },
    { id: 'skill-other-generic', expectedMonth: 149000, expectedYear: 1490000 },
    { id: 'combo-5', expectedMonth: 699000, expectedYear: 6990000 },
    { id: 'enterprise', expectedMonth: 999000, expectedYear: 9990000 },
    { id: 'master-33', expectedMonth: 1490000, expectedYear: 14900000 }
  ];

  for (const tc of testCases) {
    const monthProd = resolveOrderProduct(tc.id, 'monthly');
    const yearProd = resolveOrderProduct(tc.id, 'yearly');

    assert.strictEqual(monthProd.unitPrice, tc.expectedMonth, `Monthly price for ${tc.id} mismatch: got ${monthProd.unitPrice}, expected ${tc.expectedMonth}`);
    assert.strictEqual(yearProd.unitPrice, tc.expectedYear, `Yearly price for ${tc.id} mismatch: got ${yearProd.unitPrice}, expected ${tc.expectedYear}`);
    assert.strictEqual(yearProd.unitPrice, monthProd.unitPrice * 10, `Yearly rule violation for ${tc.id}: ${yearProd.unitPrice} !== ${monthProd.unitPrice * 10}`);
  }
  console.log('PASS: Test 1 - All prices and 10-month yearly rule verified successfully.');

  // Test 2: Included skills validation for bundles
  console.log('\n[TEST 2] Verifying Included Skills Mapping...');
  const comboProd = resolveOrderProduct('combo-5', 'monthly');
  assert.strictEqual(Array.isArray(comboProd.includedSkills), true);
  assert.strictEqual(comboProd.includedSkills.length, 5, 'Combo 5 must have 5 skills');

  const entProd = resolveOrderProduct('enterprise', 'monthly');
  assert.strictEqual(Array.isArray(entProd.includedSkills), true);
  assert.strictEqual(entProd.includedSkills.length, 8, 'Enterprise must have 8 skills');

  const masterProd = resolveOrderProduct('master-33', 'monthly');
  assert.strictEqual(masterProd.includedSkills, 'all_33', 'Master 33 must have all_33 marker');
  console.log('PASS: Test 2 - Bundle includedSkills mapped correctly.');

  // Test 3: Order Creation with Server Price Snapshot
  console.log('\n[TEST 3] Creating Orders via PaymentService...');
  
  // Ensure a test user exists in the database
  const userId = 'usr_customer_pricing_test';
  const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
  if (!existingUser) {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
       VALUES (?, 'customer_pricing_test@triai.vn', 'hash_test', 'Khách hàng Test', 'user', 'Free Trial', 1, ?, ?)`,
      [userId, now, now]
    );
  }

  // Clean old test licenses for this user
  await db.run('DELETE FROM licenses WHERE user_id = ?', [userId]);

  // Single Skill Order
  const orderSingle = await PaymentService.createOrder({
    userId,
    items: [{ skillId: 'skill-pccc', period: 'monthly' }]
  });
  assert.strictEqual(orderSingle.totalAmount, 249000, 'Single skill total amount must be 249.000');
  assert.strictEqual(orderSingle.status, 'pending');

  // Combo 5 Order
  const orderCombo = await PaymentService.createOrder({
    userId,
    items: [{ skillId: 'combo-5', period: 'yearly' }]
  });
  assert.strictEqual(orderCombo.totalAmount, 6990000, 'Combo 5 yearly total amount must be 6.990.000');

  // Enterprise Order
  const orderEnt = await PaymentService.createOrder({
    userId,
    items: [{ skillId: 'enterprise', period: 'monthly' }]
  });
  assert.strictEqual(orderEnt.totalAmount, 999000, 'Enterprise monthly total amount must be 999.000');

  // Master 33 Order
  const orderMaster = await PaymentService.createOrder({
    userId,
    items: [{ skillId: 'master-33', period: 'yearly' }]
  });
  assert.strictEqual(orderMaster.totalAmount, 14900000, 'Master 33 yearly total amount must be 14.900.000');
  console.log('PASS: Test 3 - Orders created with exact server-side pricing snapshots.');

  // Test 4: Admin Verification & Multi-License Generation
  console.log('\n[TEST 4] Verifying Admin Payment Approval & License Granting...');

  // Verify Combo 5 grants 5 licenses
  const verifiedCombo = await PaymentService.adminVerifyPayment({
    orderId: orderCombo.orderId,
    adminId: 'usr_master_admin',
    note: 'Payment received via OCB transfer'
  });
  assert.strictEqual(verifiedCombo.status, 'completed');

  const comboLicenses = await db.all('SELECT * FROM licenses WHERE user_id = ?', [userId]);
  assert.strictEqual(comboLicenses.length, 5, 'Must grant 5 separate licenses for Combo 5');
  console.log(`PASS: Verified Combo 5 order -> Granted 5 active skill licenses.`);

  // Clean and test Master 33
  await db.run('DELETE FROM licenses WHERE user_id = ?', [userId]);
  const verifiedMaster = await PaymentService.adminVerifyPayment({
    orderId: orderMaster.orderId,
    adminId: 'usr_master_admin',
    note: 'Master 33 payment confirmed'
  });
  assert.strictEqual(verifiedMaster.status, 'completed');

  const masterLicenses = await db.all('SELECT * FROM licenses WHERE user_id = ?', [userId]);
  assert.strictEqual(masterLicenses.length, 33, 'Must grant 33 separate licenses for Master 33');
  console.log(`PASS: Verified Master 33 order -> Granted 33 active skill licenses.`);

  console.log('\n======================================================');
  console.log('🎉 ALL COMMERCIAL PRICING & STORE TESTS PASSED (100%)');
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
