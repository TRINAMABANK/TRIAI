import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { env } from '../config/env.js';

export class EmailService {
  /**
   * Check if SMTP configuration is ready
   */
  static isSmtpConfigured() {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
  }

  /**
   * Get Nodemailer Transporter
   */
  static getTransporter() {
    if (!this.isSmtpConfigured()) {
      return null;
    }

    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_SECURE || false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Send an email and record in email_logs table
   */
  static async sendMail({ userId, orderId, recipient, subject, html, text, type = 'system', data = {} }) {
    if (!recipient) {
      console.warn('[EMAIL WARNING] No recipient specified, skipping email.');
      return { success: false, reason: 'NO_RECIPIENT' };
    }

    const logId = `eml_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    // Check for duplicate sent email for same order and type to prevent duplicate emails
    if (orderId && (type === 'payment_verified' || type === 'payment_rejected')) {
      const existingSent = await db.get(
        `SELECT id FROM email_logs WHERE order_id = ? AND type = ? AND status = 'sent'`,
        [orderId, type]
      );
      if (existingSent) {
        console.log(`[EMAIL NOTICE] Email for order ${orderId} type ${type} already sent (${existingSent.id}). Skipping duplicate.`);
        return { success: true, duplicate: true, logId: existingSent.id };
      }
    }

    let status = 'pending';
    let errorMessage = null;
    let sentAt = null;

    const transporter = this.getTransporter();

    if (!transporter) {
      status = 'failed';
      errorMessage = 'SMTP_NOT_CONFIGURED: Chưa thiết lập SMTP_HOST, SMTP_USER, SMTP_PASSWORD trong ENV';
      console.log(`[EMAIL LOG] SMTP not configured. Logged ${type} to ${recipient}.`);
    } else {
      try {
        await transporter.sendMail({
          from: `"${env.EMAIL_FROM_NAME || 'TRÍ AI'}" <${env.EMAIL_FROM || env.SMTP_USER}>`,
          to: recipient,
          subject,
          text: text || html.replace(/<[^>]*>?/gm, ''),
          html
        });
        status = 'sent';
        sentAt = new Date().toISOString();
        console.log(`[EMAIL SUCCESS] Sent ${type} to ${recipient} (Subject: ${subject})`);
      } catch (err) {
        status = 'failed';
        errorMessage = err.message || 'Lỗi gửi mail SMTP';
        console.error(`[EMAIL ERROR] Failed sending to ${recipient}:`, err.message);
      }
    }

    // Record in email_logs table
    try {
      await db.run(
        `INSERT INTO email_logs (id, user_id, order_id, recipient, subject, type, status, error_message, data_json, sent_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logId,
          userId || null,
          orderId || null,
          recipient,
          subject,
          type,
          status,
          errorMessage,
          JSON.stringify(data),
          sentAt,
          now
        ]
      );
    } catch (dbErr) {
      console.error('[EMAIL DB ERROR] Failed to record email_log:', dbErr.message);
    }

    return {
      logId,
      status,
      success: status === 'sent',
      errorMessage
    };
  }

  /**
   * Template 1: Payment Verified & License Activated
   */
  static async sendPaymentVerifiedEmail({ userId, userEmail, userName, orderCode, orderId, productName, amount, expiresAt }) {
    const formattedAmount = typeof amount === 'number' ? amount.toLocaleString('vi-VN') + ' đ' : amount;
    const formattedExpires = expiresAt ? new Date(expiresAt).toLocaleDateString('vi-VN') : 'Theo chu kỳ gói đã đăng ký';
    const customer = userName || userEmail?.split('@')[0] || 'Quý khách';

    const subject = `TRÍ AI — Đơn hàng ${orderCode} đã được xác nhận`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; }
    .header { text-align: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; }
    .title { color: #3b82f6; font-size: 22px; font-weight: bold; margin: 0; }
    .badge-success { background-color: #065f46; color: #34d399; font-weight: bold; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-top: 8px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 10px 0; border-bottom: 1px solid #1f2937; color: #e5e7eb; font-size: 14px; }
    .info-table td.label { color: #9ca3af; width: 40%; }
    .cta-btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-align: center; margin-top: 20px; }
    .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">TRÍ AI — NỀN TẢNG TRỢ LÝ DOANH NGHIỆP</h1>
      <div class="badge-success">✓ ĐÃ XÁC NHẬN THANH TOÁN</div>
    </div>
    <p>Xin chào <strong>${customer}</strong>,</p>
    <p>Đơn hàng <strong>${orderCode}</strong> của bạn đã được đối soát và xác nhận thanh toán thành công.</p>
    
    <table class="info-table">
      <tr>
        <td class="label">Mã đơn hàng:</td>
        <td><strong>${orderCode}</strong></td>
      </tr>
      <tr>
        <td class="label">Sản phẩm / Gói Skill:</td>
        <td><strong>${productName}</strong></td>
      </tr>
      <tr>
        <td class="label">Số tiền:</td>
        <td><strong style="color: #38bdf8;">${formattedAmount}</strong></td>
      </tr>
      <tr>
        <td class="label">Trạng thái thanh toán:</td>
        <td><strong style="color: #34d399;">ĐÃ XÁC NHẬN</strong></td>
      </tr>
      <tr>
        <td class="label">Bản quyền:</td>
        <td><strong style="color: #34d399;">ĐÃ KÍCH HOẠT</strong></td>
      </tr>
      <tr>
        <td class="label">Thời hạn:</td>
        <td>${formattedExpires}</td>
      </tr>
    </table>

    <p>Bạn có thể truy cập hệ thống và bắt đầu sử dụng ngay lập tức:</p>
    <div style="text-align: center;">
      <a href="https://banhangdinhcao.com" class="cta-btn">Truy cập Không gian Làm việc TRÍ AI</a>
    </div>

    <div class="footer">
      <p>Trân trọng,<br><strong>Đội ngũ TRÍ AI</strong></p>
      <p>Hỗ trợ kỹ thuật: support@banhangdinhcao.com | Hotline/Zalo: 0982.441.446</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      userId,
      orderId,
      recipient: userEmail,
      subject,
      html,
      type: 'payment_verified',
      data: { orderCode, productName, amount, expiresAt }
    });
  }

  /**
   * Template 2: Payment Rejected
   */
  static async sendPaymentRejectedEmail({ userId, userEmail, userName, orderCode, orderId, amount, reason }) {
    const formattedAmount = typeof amount === 'number' ? amount.toLocaleString('vi-VN') + ' đ' : amount;
    const customer = userName || userEmail?.split('@')[0] || 'Quý khách';

    const subject = `TRÍ AI — Đơn hàng ${orderCode} chưa được xác nhận`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; }
    .header { text-align: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; }
    .title { color: #ef4444; font-size: 22px; font-weight: bold; margin: 0; }
    .badge-warn { background-color: #7f1d1d; color: #f87171; font-weight: bold; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-top: 8px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 10px 0; border-bottom: 1px solid #1f2937; color: #e5e7eb; font-size: 14px; }
    .info-table td.label { color: #9ca3af; width: 40%; }
    .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">TRÍ AI — THÔNG BÁO ĐƠN HÀNG</h1>
      <div class="badge-warn">CHƯA XÁC NHẬN THANH TOÁN</div>
    </div>
    <p>Xin chào <strong>${customer}</strong>,</p>
    <p>Yêu cầu thanh toán cho đơn hàng <strong>${orderCode}</strong> hiện chưa được xác nhận do:</p>
    
    <div style="background-color: #1f2937; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
      <strong style="color: #f87171;">Lý do:</strong> ${reason || 'Chưa nhận được giao dịch khớp với số tiền hoặc nội dung chuyển khoản trên tài khoản thụ hưởng.'}
    </div>

    <table class="info-table">
      <tr>
        <td class="label">Mã đơn hàng:</td>
        <td><strong>${orderCode}</strong></td>
      </tr>
      <tr>
        <td class="label">Số tiền:</td>
        <td>${formattedAmount}</td>
      </tr>
    </table>

    <p>Nếu bạn đã thực hiện chuyển khoản thành công, xin vui lòng kiểm tra lại sao kê hoặc liên hệ trực tiếp với chúng tôi để được hỗ trợ đối soát thủ công nhanh chóng.</p>

    <div class="footer">
      <p>Trân trọng,<br><strong>Đội ngũ TRÍ AI</strong></p>
      <p>Hỗ trợ kỹ thuật: support@banhangdinhcao.com | Hotline/Zalo: 0982.441.446</p>
      <p>Website: <a href="https://banhangdinhcao.com" style="color: #3b82f6;">https://banhangdinhcao.com</a></p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      userId,
      orderId,
      recipient: userEmail,
      subject,
      html,
      type: 'payment_rejected',
      data: { orderCode, amount, reason }
    });
  }

  /**
   * Retry failed email log
   */
  static async retryEmail(logId) {
    const log = await db.get('SELECT * FROM email_logs WHERE id = ?', [logId]);
    if (!log) {
      throw new Error('Không tìm thấy bản ghi email log.');
    }

    const data = log.data_json ? JSON.parse(log.data_json) : {};
    const transporter = this.getTransporter();

    if (!transporter) {
      throw new Error('SMTP chưa được cấu hình. Vui lòng kiểm tra biến môi trường SMTP_HOST, SMTP_USER, SMTP_PASSWORD.');
    }

    try {
      await transporter.sendMail({
        from: `"${env.EMAIL_FROM_NAME || 'TRÍ AI'}" <${env.EMAIL_FROM || env.SMTP_USER}>`,
        to: log.recipient,
        subject: log.subject,
        text: log.subject,
        html: `<p>${log.subject}</p>`
      });

      const now = new Date().toISOString();
      await db.run(
        `UPDATE email_logs SET status = 'sent', sent_at = ?, error_message = NULL WHERE id = ?`,
        [now, logId]
      );

      return { success: true, message: `Đã gửi lại email thành công tới ${log.recipient}` };
    } catch (err) {
      await db.run(
        `UPDATE email_logs SET error_message = ? WHERE id = ?`,
        [err.message, logId]
      );
      throw new Error(`Gửi lại thất bại: ${err.message}`);
    }
  }
}

export default EmailService;
