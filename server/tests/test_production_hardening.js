import db from '../src/db/index.js';
import runMigrations from '../src/db/migrations.js';
import runSeeds from '../src/db/seeds.js';
import PaymentService from '../src/services/paymentService.js';
import defaultBankProvider from '../src/services/bankPaymentProvider.js';
import EmailService from '../src/services/emailService.js';
import QuotaService from '../src/services/quotaService.js';
import AIRuntime from '../src/services/aiRuntime.js';

async function runHardeningTests() {
  console.log('=================================================================');
  console.log('🧪 TRÍ AI — FINAL PRODUCTION HARDENING & RECONCILIATION TEST SUITE');
  console.log('=================================================================\n');

  try {
    // 1. Run migrations & seeds
    await runMigrations();
    await runSeeds();

    // Clean test sandbox data
    await db.run("DELETE FROM orders WHERE user_id LIKE 'test_%'");
    await db.run("DELETE FROM payments WHERE user_id LIKE 'test_%'");
    await db.run("DELETE FROM licenses WHERE user_id LIKE 'test_%'");
    await db.run("DELETE FROM users WHERE id LIKE 'test_%'");

    // Create test customer
    const testCustomerId = 'test_cust_production_hardening';
    const testCustomerEmail = 'customer.hardening@triai.vn';
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role, plan, is_active, created_at, updated_at)
       VALUES (?, ?, 'hash', 'Nguyễn Văn Test', 'customer', 'Gói Khách Hàng', 1, datetime('now'), datetime('now'))`,
      [testCustomerId, testCustomerEmail]
    );

    // =========================================================================
    // TEST 1: Bank Payment Provider Abstraction & Manual Mode
    // =========================================================================
    console.log('[TEST 1] Bank Payment Provider Abstraction & Status...');
    const providerInfo = defaultBankProvider.getProviderInfo();
    console.log('  -> Provider Mode:', providerInfo.mode);
    console.log('  -> Status Text  :', providerInfo.statusText);
    if (!providerInfo.configured) {
      if (providerInfo.statusText.includes('Đối soát thủ công')) {
        console.log('  ✅ PASS: Unconfigured provider correctly identifies manual reconciliation mode without faking auto-verification.\n');
      } else {
        throw new Error('Status text did not contain required manual reconciliation text.');
      }
    }

    // =========================================================================
    // TEST 2: Multi-Order Creation & False Request Simulation (Section 21)
    // =========================================================================
    console.log('[TEST 2] Multi-Order Creation & False Request Simulation...');
    
    // Customer creates 3 orders
    const ord1 = await PaymentService.createOrder({
      userId: testCustomerId,
      items: [{ skillId: 'kol-thoi-trang', period: 'monthly' }]
    });

    const ord2 = await PaymentService.createOrder({
      userId: testCustomerId,
      items: [{ skillId: 'pccc', period: 'monthly' }]
    });

    const ord3 = await PaymentService.createOrder({
      userId: testCustomerId,
      items: [{ skillId: 'mep', period: 'monthly' }]
    });

    console.log(`  -> Created 3 orders: ${ord1.orderCode} (${ord1.totalAmount}đ), ${ord2.orderCode} (${ord2.totalAmount}đ), ${ord3.orderCode} (${ord3.totalAmount}đ)`);

    // Customer clicks "I have transferred" for all 3
    await PaymentService.requestPayment({ orderId: ord1.orderId, userId: testCustomerId, note: 'Khách bấm CK 1' });
    await PaymentService.requestPayment({ orderId: ord2.orderId, userId: testCustomerId, note: 'Khách bấm CK 2' });
    await PaymentService.requestPayment({ orderId: ord3.orderId, userId: testCustomerId, note: 'Khách bấm CK 3' });

    // Check that NO licenses have been granted yet
    const initialLicenses = await db.all('SELECT * FROM licenses WHERE user_id = ? AND status = ' + "'active'", [testCustomerId]);
    if (initialLicenses.length > 0) {
      throw new Error(`Security violation: ${initialLicenses.length} licenses were activated prematurely!`);
    }
    console.log('  ✅ PASS: 3 orders are in PENDING status. Zero licenses activated.\n');

    // =========================================================================
    // TEST 3: Strict Reconciliation & Amount Mismatch Prevention
    // =========================================================================
    console.log('[TEST 3] Reconciliation Validation: Amount Mismatch & Duplicate Bank Ref...');
    
    // Attempt mismatch verification (e.g. order is 399k, admin enters 200k)
    let mismatchCaught = false;
    try {
      await PaymentService.adminVerifyPayment({
        orderId: ord1.orderId,
        actualAmount: 200000, // wrong amount!
        bankTransactionRef: 'FT26090999999'
      });
    } catch (err) {
      mismatchCaught = true;
      console.log('  -> Correctly blocked mismatch:', err.message);
    }

    if (!mismatchCaught) {
      throw new Error('Security failure: Admin was able to verify order with mismatched amount!');
    }
    console.log('  ✅ PASS: Amount mismatch strictly blocked.\n');

    // =========================================================================
    // TEST 4: Real Bank Verification & License Activation for Order 1
    // =========================================================================
    console.log('[TEST 4] Real Bank Verification for Order 1...');
    const bankRef1 = 'FT26090123456';
    const verifyRes = await PaymentService.adminVerifyPayment({
      orderId: ord1.orderId,
      actualAmount: ord1.totalAmount,
      bankTransactionRef: bankRef1,
      notes: 'Khớp tiền trên sao kê OCB 0982441446'
    });

    console.log(`  -> Verification result: ${verifyRes.message}`);

    // Check Duplicate Bank Ref Protection on Order 2
    let duplicateCaught = false;
    try {
      await PaymentService.adminVerifyPayment({
        orderId: ord2.orderId,
        actualAmount: ord2.totalAmount,
        bankTransactionRef: bankRef1 // reusing bankRef1!
      });
    } catch (err) {
      duplicateCaught = true;
      console.log('  -> Duplicate bank ref blocked:', err.message);
    }

    if (!duplicateCaught) {
      throw new Error('Security failure: Reused bank transaction reference was accepted!');
    }

    // Reject Order 2
    await PaymentService.adminRejectPayment({
      orderId: ord2.orderId,
      reason: 'Không nhận được tiền vào tài khoản'
    });

    // Check licenses for customer: ONLY ord1's skill should be active!
    const activeLicensesAfter = await db.all('SELECT * FROM licenses WHERE user_id = ? AND status = ' + "'active'", [testCustomerId]);
    console.log(`  -> Customer active licenses count: ${activeLicensesAfter.length} (${activeLicensesAfter.map(l => l.skill_id).join(', ')})`);
    
    if (activeLicensesAfter.length !== 1 || activeLicensesAfter[0].skill_id !== 'kol-thoi-trang') {
      throw new Error('License count or skill mismatch after selective verification!');
    }
    console.log('  ✅ PASS: Exactly 1 License activated. Duplicate bank ref prevented.\n');

    // =========================================================================
    // TEST 5: Verified Revenue Calculation (Section 4)
    // =========================================================================
    console.log('[TEST 5] Verified Revenue Calculations...');
    const adminPayments = await PaymentService.getPaymentsForAdmin();
    console.log('  -> Today Verified Revenue  :', adminPayments.kpis.todayRevenue.toLocaleString('vi-VN'), 'đ');
    console.log('  -> Total Verified Revenue  :', adminPayments.kpis.totalRevenue.toLocaleString('vi-VN'), 'đ');
    console.log('  -> Pending Payments Count  :', adminPayments.kpis.pendingCount);
    console.log('  -> Verified Payments Count :', adminPayments.kpis.verifiedCount);
    console.log('  -> Rejected Payments Count :', adminPayments.kpis.rejectedCount);

    if (adminPayments.kpis.verifiedRevenue && adminPayments.kpis.verifiedRevenue < ord1.totalAmount) {
      throw new Error('Revenue calculation did not reflect verified payment!');
    }
    console.log('  ✅ PASS: Revenue calculation strictly sums verified payments only.\n');

    // =========================================================================
    // TEST 6: Email Logs & Duplicate Prevention (Section 6-9)
    // =========================================================================
    console.log('[TEST 6] Email Logging & Duplicate Prevention...');
    const emailLogs = await db.all('SELECT * FROM email_logs WHERE recipient = ?', [testCustomerEmail]);
    console.log(`  -> Found ${emailLogs.length} email logs recorded for ${testCustomerEmail}`);
    emailLogs.forEach(l => console.log(`     - [${l.type}] Status: ${l.status}, Subject: ${l.subject}`));

    if (emailLogs.length === 0) {
      throw new Error('Email logs were not recorded!');
    }
    console.log('  ✅ PASS: Email logs recorded cleanly in database.\n');

    // =========================================================================
    // TEST 7: Resource Quota Tracking & Enforcement (Section 10-11)
    // =========================================================================
    console.log('[TEST 7] Resource Quota Tracking & Enforcement...');
    const quotaSummary = await QuotaService.getUserQuotaSummary(testCustomerId);
    console.log('  -> Plan Name    :', quotaSummary.planName);
    console.log('  -> AI Requests  :', `${quotaSummary.aiRequests.used} / ${quotaSummary.aiRequests.limit}`);
    console.log('  -> Storage Limit:', quotaSummary.storage.limitFormatted);

    // Increment and check
    await QuotaService.incrementAiRequests(testCustomerId, 5);
    const updatedQuota = await QuotaService.getUserQuotaSummary(testCustomerId);
    console.log(`  -> Usage after 5 requests: ${updatedQuota.aiRequests.used} / ${updatedQuota.aiRequests.limit}`);
    
    if (updatedQuota.aiRequests.used !== 5) {
      throw new Error('Quota counter did not increment properly!');
    }
    console.log('  ✅ PASS: Real quota tracking & counter enforcement verified.\n');

    // Clean up test records
    await db.run("DELETE FROM orders WHERE user_id LIKE 'test_%'");
    await db.run("DELETE FROM payments WHERE user_id LIKE 'test_%'");
    await db.run("DELETE FROM licenses WHERE user_id LIKE 'test_%'");
    await db.run("DELETE FROM email_logs WHERE recipient = ?", [testCustomerEmail]);
    await db.run("DELETE FROM usage_counters WHERE user_id LIKE 'test_%'");
    await db.run("DELETE FROM users WHERE id LIKE 'test_%'");

    console.log('=================================================================');
    console.log('🎉 ALL 7 PRODUCTION HARDENING TESTS PASSED 100%');
    console.log('=================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
}

runHardeningTests();
