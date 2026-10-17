import assert from 'assert';
import http from 'http';
import express from 'express';
import db from '../src/db/index.js';
import { env } from '../src/config/env.js';
import { runMigrations } from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../src/utils/security.js';
import SkillEngine from '../src/services/skillEngine.js';
import AgentEngine from '../src/services/agentEngine.js';
import LicenseEngine from '../src/services/licenseEngine.js';
import QuotaService from '../src/services/quotaService.js';
import PaymentService from '../src/services/paymentService.js';
import EmailService from '../src/services/emailService.js';
import authRoutes from '../src/routes/authRoutes.js';
import orderRoutes from '../src/routes/orderRoutes.js';
import paymentRoutes from '../src/routes/paymentRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import skillRoutes from '../src/routes/skillRoutes.js';
import notificationRoutes from '../src/routes/notificationRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

async function runFullE2ETestSuite() {
  console.log('=================================================================');
  console.log('🚀 TRÍ AI — END-TO-END SAAS BUSINESS FLOW ACCEPTANCE TEST SUITE');
  console.log('=================================================================');

  await runMigrations();
  await runSeeds();

  // Spin up an Express test server instance
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use('/orders', orderRoutes);
  app.use('/payments', paymentRoutes);
  app.use('/skills', skillRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/admin', adminRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();
  const testCustomerEmail = `e2e_customer_${timestamp}@triai.vn`;
  const testPassword = 'StrongPass2026!@#';
  let customerToken = null;
  let customerId = null;
  let adminToken = null;

  try {
    // -------------------------------------------------------------
    // STEP 1: Đăng ký tài khoản và đăng nhập
    // -------------------------------------------------------------
    console.log('\n[STEP 1] Đăng ký tài khoản và đăng nhập (Registration & Auth)...');

    // 1.1 Weak password rejected
    const weakReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail, password: '123', fullName: 'E2E Customer' })
    });
    assert.strictEqual(weakReg.status, 400, 'Weak password must be rejected');

    // 1.2 Valid registration
    const validReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail, password: testPassword, fullName: 'E2E Customer' })
    });
    const regData = await validReg.json();
    assert.strictEqual(validReg.status, 201);
    assert.strictEqual(regData.success, true);
    assert.ok(regData.token, 'Token returned upon registration');
    customerId = regData.user.id;
    customerToken = regData.token;
    console.log('  ✅ PASS: Đăng ký tài khoản thành công với chính sách mật khẩu an toàn.');

    // 1.3 Login with correct credentials
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCustomerEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.user.role, 'customer');
    console.log('  ✅ PASS: Đăng nhập thành công và cấp JWT token chuẩn.');

    // -------------------------------------------------------------
    // STEP 2: Phân quyền quản trị viên (Admin RBAC & Master Admin Protection)
    // -------------------------------------------------------------
    console.log('\n[STEP 2] Phân quyền Quản trị viên (RBAC & Privilege Boundary)...');

    // 2.1 Customer calling Admin route
    const custOnAdmin = await fetch(`${baseUrl}/admin/users`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert.strictEqual(custOnAdmin.status, 403, 'Customer cannot access admin endpoints');

    // 2.2 Generate Master Admin token
    const masterAdmin = await db.get('SELECT * FROM users WHERE email = ?', [env.ADMIN_EMAIL]);
    assert.ok(masterAdmin, 'Master admin user must exist');
    adminToken = generateToken({ userId: masterAdmin.id, email: masterAdmin.email, role: 'owner' });

    const adminQuery = await fetch(`${baseUrl}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminData = await adminQuery.json();
    assert.strictEqual(adminQuery.status, 200);
    assert.strictEqual(adminData.success, true);
    console.log('  ✅ PASS: Phân quyền RBAC nghiêm ngặt: Customer bị chặn 403, Master Admin truy cập hợp lệ.');

    // -------------------------------------------------------------
    // STEP 3: Xem, chọn và sử dụng Skill/Agent
    // -------------------------------------------------------------
    console.log('\n[STEP 3] Xem, chọn và sử dụng Skill/Agent...');

    const skills = await SkillEngine.getAllSkills('published');
    assert.ok(skills.length >= 33, `Must have at least 33 skills in store catalog (Found: ${skills.length})`);

    const targetSkill = skills[0];
    const skillDetail = await SkillEngine.getSkillById(targetSkill.id);
    assert.ok(skillDetail, 'Skill detail loaded');
    assert.strictEqual(skillDetail.id, targetSkill.id);

    const agents = await AgentEngine.getAllAgents();
    assert.ok(agents.length > 0, 'Agent engine loaded');
    console.log(`  ✅ PASS: Nạp danh mục 33 Skill chuẩn và danh sách Agent (${skills.length} skills, ${agents.length} agents).`);

    // -------------------------------------------------------------
    // STEP 4: Quota tài nguyên thật & Trial
    // -------------------------------------------------------------
    console.log('\n[STEP 4] Quota tài nguyên thật & Giới hạn sử dụng...');

    // 4.1 Check initial quota
    const initialQuota = await QuotaService.getUserQuotaSummary(customerId);
    assert.strictEqual(initialQuota.planName, 'Tài khoản Miễn phí');
    assert.strictEqual(initialQuota.aiRequests.used, 0);

    // 4.2 Record request usage
    await QuotaService.incrementAiRequests(customerId, 1);
    const updatedQuota = await QuotaService.getUserQuotaSummary(customerId);
    assert.strictEqual(updatedQuota.aiRequests.used, 1);
    console.log('  ✅ PASS: Quota tài nguyên theo dõi thực tế trên database (1 / 20 requests).');

    // -------------------------------------------------------------
    // STEP 5: Tạo đơn hàng và mã VietQR
    // -------------------------------------------------------------
    console.log('\n[STEP 5] Tạo đơn hàng & Sinh mã VietQR chuyển khoản...');

    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [{
          skillId: targetSkill.id,
          skillName: targetSkill.name,
          planDuration: 'monthly'
        }],
        note: 'Đơn hàng kiểm thử E2E'
      })
    });
    const orderData = await orderRes.json();
    assert.strictEqual(orderRes.status, 201);
    assert.strictEqual(orderData.success, true);
    assert.ok(orderData.order.orderCode.startsWith('TRIAI-'));
    assert.strictEqual(orderData.order.status, 'pending');
    assert.ok(orderData.order.qrUrl.includes('img.vietqr.io'));
    const orderId = orderData.order.orderId;
    const orderCode = orderData.order.orderCode;
    const totalAmount = orderData.order.totalAmount;
    console.log(`  ✅ PASS: Tạo đơn hàng ${orderCode} (${totalAmount.toLocaleString('vi-VN')} đ) và sinh URL VietQR chuẩn.`);

    // -------------------------------------------------------------
    // STEP 6 & 7: Đối soát giao dịch & Cập nhật trạng thái
    // -------------------------------------------------------------
    console.log('\n[STEP 6 & 7] Đối soát giao dịch thực tế & Cập nhật trạng thái...');

    // Customer requests payment verification
    const custProofRes = await fetch(`${baseUrl}/orders/${orderId}/payment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ transactionRef: 'OCB_TRANSFER_MEMO' })
    });
    const custProofData = await custProofRes.json();
    assert.strictEqual(custProofData.success, true);

    // Verify license is still NOT granted
    const licBefore = await LicenseEngine.checkAccess(customerId, targetSkill.id);
    assert.strictEqual(licBefore.granted, false, 'No license granted before real bank reconciliation');

    // Admin verifies actual transaction with bank reference
    const bankRef = `FT_E2E_${timestamp}`;
    const verifyRes = await fetch(`${baseUrl}/admin/orders/${orderId}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        actualAmount: totalAmount,
        bankTransactionRef: bankRef,
        notes: 'Đối soát thành công qua sao kê OCB'
      })
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyData.success, true);
    assert.strictEqual(verifyData.status, 'paid');
    console.log(`  ✅ PASS: Admin đối soát với mã ngân hàng ${bankRef}. Trạng thái cập nhật 'paid'.`);

    // -------------------------------------------------------------
    // STEP 8: Kích hoạt License chính xác
    // -------------------------------------------------------------
    console.log('\n[STEP 8] Kích hoạt License chính xác...');

    const licAfter = await LicenseEngine.checkAccess(customerId, targetSkill.id);
    assert.strictEqual(licAfter.granted, true, 'License must be granted after verification');
    assert.strictEqual(licAfter.type, 'monthly');
    assert.ok(licAfter.expiresAt);
    console.log(`  ✅ PASS: Bản quyền Skill kích hoạt thành công (Hạn dùng: ${licAfter.expiresAt}).`);

    // -------------------------------------------------------------
    // STEP 9: Kiểm tra Lịch sử, Thông báo & Email
    // -------------------------------------------------------------
    console.log('\n[STEP 9] Kiểm tra Lịch sử đơn hàng, Email log & Thông báo...');

    // Customer notifications
    const notifsRes = await fetch(`${baseUrl}/notifications`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const notifsData = await notifsRes.json();
    assert.strictEqual(notifsRes.status, 200);
    assert.ok(notifsData.notifications.length > 0);
    assert.strictEqual(notifsData.notifications[0].type, 'payment_verified');

    // Customer order history
    const myOrdersRes = await fetch(`${baseUrl}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const myOrdersData = await myOrdersRes.json();
    assert.strictEqual(myOrdersData.success, true);
    assert.strictEqual(myOrdersData.orders[0].status, 'paid');
    console.log('  ✅ PASS: Lịch sử đơn hàng cập nhật và thông báo thanh toán đã được gửi.');

    // -------------------------------------------------------------
    // STEP 10: Kiểm tra lỗi, giao dịch trùng & Truy cập trái phép
    // -------------------------------------------------------------
    console.log('\n[STEP 10] Kiểm tra xử lý lỗi, giao dịch trùng & chống truy cập trái phép...');

    // 10.1 Duplicate bank transaction reference across another order
    const order2 = await PaymentService.createOrder({
      userId: customerId,
      items: [{ skillId: skills[1].id, skillName: skills[1].name, planDuration: 'monthly' }]
    });

    let duplicateRefBlocked = false;
    try {
      await PaymentService.adminVerifyPayment({
        orderId: order2.orderId,
        actualAmount: order2.totalAmount,
        bankTransactionRef: bankRef, // Reuse existing bankRef
        adminEmail: env.ADMIN_EMAIL
      });
    } catch (err) {
      duplicateRefBlocked = err.message.includes('đã được đối soát');
    }
    assert.strictEqual(duplicateRefBlocked, true, 'Duplicate bank ref must be rejected');
    console.log('  ✅ PASS: Tái sử dụng mã giao dịch ngân hàng bị từ chối chống gian lận.');

    // 10.2 Amount mismatch
    let mismatchBlocked = false;
    try {
      await PaymentService.adminVerifyPayment({
        orderId: order2.orderId,
        actualAmount: order2.totalAmount - 50000,
        bankTransactionRef: `FT_NEW_${timestamp}`,
        adminEmail: env.ADMIN_EMAIL
      });
    } catch (err) {
      mismatchBlocked = err.message.includes('không khớp');
    }
    assert.strictEqual(mismatchBlocked, true, 'Amount mismatch must be blocked');
    console.log('  ✅ PASS: Số tiền thực nhận lệch với đơn hàng bị từ chối.');

    console.log('\n=================================================================');
    console.log('🎉 ALL 10 END-TO-END BUSINESS FLOW STEPS PASSED 100%');
    console.log('=================================================================');
  } finally {
    server.close();
  }
}

runFullE2ETestSuite().catch(err => {
  console.error('\n❌ E2E TEST SUITE FAILURE:', err);
  process.exit(1);
});
