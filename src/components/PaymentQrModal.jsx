import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Zap,
  Hourglass
} from 'lucide-react';
import api from '../api/client';

export default function PaymentQrModal({ 
  isOpen, 
  onClose, 
  packageData, 
  billingCycle = 'monthly',
  onPaymentSubmitted 
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 đếm ngược
  const [imgError, setImgError] = useState(false);

  // Thông tin tài khoản ngân hàng OCB duy nhất
  const BANK_INFO = {
    bankName: 'Ngân hàng TMCP Phương Đông (OCB)',
    bankCode: 'OCB',
    accountNumber: '0982441446',
    accountName: 'QUANG NHỰT TRÍ',
  };

  // Tính toán số tiền và nội dung chuyển khoản
  const getAmountNumber = () => {
    if (!packageData) return 199000;
    const priceStr = billingCycle === 'monthly' 
      ? (packageData.priceMonth || packageData.price || '199.000đ')
      : (packageData.priceYear || packageData.price || '1.990.000đ');
    
    const numericStr = priceStr.replace(/[^0-9]/g, '');
    return parseInt(numericStr, 10) || 199000;
  };

  const amountNumber = getAmountNumber();
  const formattedAmount = amountNumber.toLocaleString('vi-VN') + ' đ';

  // Mã giao dịch duy nhất
  const [transferContent, setTransferContent] = useState('');

  useEffect(() => {
    if (isOpen && packageData) {
      const code = (packageData.id || 'SKILL')
        .replace('store-', '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 8);
      const rand = Math.floor(1000 + Math.random() * 9000);
      setTransferContent(`TRIAI ${code} ${rand}`);
      setIsPendingApproval(false);
      setIsVerifying(false);
      setTimeLeft(900);
      setImgError(false);
    }
  }, [isOpen, packageData]);

  // Đếm ngược thời gian phiên giao dịch
  useEffect(() => {
    if (!isOpen || isPendingApproval) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPendingApproval]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // VietQR URL theo chuẩn Napas 247 của ngân hàng OCB
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNumber}-compact2.png?amount=${amountNumber}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmTransfer = async () => {
    setIsVerifying(true);
    try {
      if (packageData) {
        await api.payments.confirm({
          orderCode: transferContent,
          orderId: packageData.id,
          transactionRef: `TXN_${Date.now()}`
        }).catch(() => null);
      }
    } catch (e) {
      console.warn('Payment API notice:', e);
    }

    if (onPaymentSubmitted && packageData) {
      onPaymentSubmitted({
        packageData,
        billingCycle,
        transferContent,
        amountNumber,
        formattedAmount
      });
    }

    setTimeout(() => {
      setIsVerifying(false);
      setIsPendingApproval(true);
    }, 1000);
  };

  if (!isOpen || !packageData) return null;

  return (
    <div className="modal-overlay payment-modal-overlay" onClick={onClose}>
      <div className="modal-container payment-qr-modal" onClick={e => e.stopPropagation()}>
        
        {/* MODAL HEADER */}
        <div className="payment-modal-header">
          <div className="payment-title-group">
            <div className="payment-icon-badge">
              <QrCode size={22} className="qr-badge-icon" />
            </div>
            <div>
              <h3 className="payment-heading">
                {isPendingApproval ? 'Đã Ghi Nhận Yêu Cầu Chuyển Khoản' : 'Thanh Toán & Kích Hoạt Gói Skill'}
              </h3>
              <p className="payment-sub">
                {isPendingApproval 
                  ? 'Yêu cầu đang chờ Quản trị viên QUANG NHỰT TRÍ đối soát và phê duyệt'
                  : 'Quét mã VietQR 24/7 hoặc chuyển khoản chính xác nội dung bên dưới'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="payment-modal-body">
          {isPendingApproval ? (
            /* MÀN HÌNH CHỜ ADMIN PHÊ DUYỆT */
            <div className="payment-success-screen" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div className="success-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Hourglass size={56} className="success-check-pulse" />
              </div>
              
              <h2 className="success-title" style={{ color: '#b45309', marginTop: '12px' }}>
                Đang Chờ Admin Phê Duyệt!
              </h2>
              <div className="success-package-card" style={{ maxWidth: '420px', margin: '14px auto', textAlign: 'left' }}>
                <div className="success-pkg-name">✨ {packageData.name}</div>
                <div className="success-pkg-meta">
                  <span>Kỳ hạn: <b>{billingCycle === 'monthly' ? 'Theo tháng' : 'Theo năm'}</b></span>
                  <span>Số tiền: <b className="success-amount">{formattedAmount}</b></span>
                  <span>Nội dung CK: <b>{transferContent}</b></span>
                  <span>Người duyệt: <b>QUANG NHỰT TRÍ (triqnnamabank@gmail.com)</b></span>
                </div>
              </div>

              <p className="success-congrats-text" style={{ maxWidth: '440px', margin: '0 auto 18px', color: '#475569', fontSize: '13.5px', lineHeight: '1.6' }}>
                Hệ thống đã gửi thông tin giao dịch tới <b>Quản trị viên (QUANG NHỰT TRÍ)</b> để đối soát tài khoản OCB. Ngay sau khi Admin kiểm tra và bấm phê duyệt, Skill sẽ tự động được mở khóa trên tài khoản của bạn.
              </p>

              <button 
                type="button" 
                className="btn-primary"
                onClick={onClose}
                style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px' }}
              >
                <span>Đã hiểu & Đóng</span>
              </button>
            </div>
          ) : (
            /* MÀN HÌNH THANH TOÁN QRCODE 2 CỘT */
            <div className="payment-split-grid">
              
              {/* CỘT TRÁI: KHUNG MÃ QR VIETQR OCB */}
              <div className="payment-qr-column">
                <div className="qr-card-container">
                  <div className="qr-card-top-bar">
                    <span className="vietqr-logo-text">VIET<b>QR</b></span>
                    <span className="napas-badge">napas 247</span>
                  </div>

                  <div className="qr-image-frame">
                    {!imgError ? (
                      <img 
                        src={qrUrl} 
                        alt="Mã QR Chuyển khoản OCB" 
                        className="vietqr-rendered-img"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      /* Fallback khi offline hoặc không tải được ảnh từ API */
                      <div className="qr-fallback-box">
                        <QrCode size={160} className="qr-fallback-icon" />
                        <div className="qr-fallback-note">Mã QR VietQR OCB 24/7</div>
                        <div className="qr-fallback-acc">STK: {BANK_INFO.accountNumber}</div>
                      </div>
                    )}

                    {/* Logo OCB Watermark ở giữa */}
                    <div className="qr-center-bank-logo">
                      <span>OCB</span>
                    </div>
                  </div>

                  <div className="qr-countdown-row">
                    <Clock size={14} className="clock-icon" />
                    <span>Mã QR có hiệu lực trong: <b>{formatTime(timeLeft)}</b></span>
                  </div>
                </div>

                <div className="qr-helper-text">
                  Mở ứng dụng Mobile Banking của <b>bất kỳ ngân hàng nào</b> (OCB, VCB, MB, Techcombank, Momo, VNPay...) và chọn <b>Quét QR</b>.
                </div>
              </div>

              {/* CỘT PHẢI: THÔNG TIN CHUYỂN KHOẢN & SAO CHÉP NHANH */}
              <div className="payment-info-column">
                
                {/* Header thông tin gói */}
                <div className="package-summary-strip">
                  <div className="pkg-summary-top">
                    <span className="pkg-label-small">Gói Skill lựa chọn:</span>
                    <span className="pkg-cycle-pill">{billingCycle === 'monthly' ? 'Gói Tháng' : 'Gói Năm (Ưu đãi)'}</span>
                  </div>
                  <h4 className="pkg-chosen-name">{packageData.name}</h4>
                  <div className="pkg-total-price">
                    <span>Tổng thanh toán:</span>
                    <b className="total-highlight">{formattedAmount}</b>
                  </div>
                </div>

                {/* Chi tiết tài khoản ngân hàng */}
                <div className="bank-details-card">
                  <div className="bank-card-title">
                    <CreditCard size={16} />
                    <span>Thông tin chuyển khoản ngân hàng</span>
                  </div>

                  {/* 1. Ngân hàng */}
                  <div className="transfer-field-row">
                    <span className="field-lbl">Ngân hàng:</span>
                    <div className="field-val-wrap">
                      <b className="field-val text-brand">{BANK_INFO.bankName}</b>
                    </div>
                  </div>

                  {/* 2. Số tài khoản */}
                  <div className="transfer-field-row">
                    <span className="field-lbl">Số tài khoản:</span>
                    <div className="field-val-wrap">
                      <b className="field-val account-number-styled">{BANK_INFO.accountNumber}</b>
                      <button 
                        type="button" 
                        className={`btn-copy-field ${copiedField === 'acc' ? 'copied' : ''}`}
                        onClick={() => handleCopy(BANK_INFO.accountNumber, 'acc')}
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === 'acc' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Chủ tài khoản */}
                  <div className="transfer-field-row">
                    <span className="field-lbl">Chủ tài khoản:</span>
                    <div className="field-val-wrap">
                      <b className="field-val">{BANK_INFO.accountName}</b>
                    </div>
                  </div>

                  {/* 4. Số tiền */}
                  <div className="transfer-field-row">
                    <span className="field-lbl">Số tiền:</span>
                    <div className="field-val-wrap">
                      <b className="field-val amount-color">{formattedAmount}</b>
                      <button 
                        type="button"
                        className={`btn-copy-field ${copiedField === 'amount' ? 'copied' : ''}`}
                        onClick={() => handleCopy(amountNumber.toString(), 'amount')}
                        title="Sao chép số tiền"
                      >
                        {copiedField === 'amount' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Nội dung chuyển khoản */}
                  <div className="transfer-field-row content-row">
                    <span className="field-lbl">Nội dung CK:</span>
                    <div className="field-val-wrap">
                      <b className="field-val content-code">{transferContent}</b>
                      <button 
                        type="button"
                        className={`btn-copy-field ${copiedField === 'content' ? 'copied' : ''}`}
                        onClick={() => handleCopy(transferContent, 'content')}
                        title="Sao chép nội dung chuyển khoản"
                      >
                        {copiedField === 'content' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedField === 'content' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lưu ý an toàn */}
                <div className="payment-security-note">
                  <ShieldCheck size={16} className="shield-icon" />
                  <span>
                    Vui lòng giữ nguyên <b>nội dung chuyển khoản</b> để Quản trị viên đối soát chính xác và phê duyệt mở khóa Skill.
                  </span>
                </div>

                {/* Nút xác nhận hành động */}
                <div className="payment-action-buttons">
                  <button 
                    type="button" 
                    className="btn-payment-cancel"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                  <button 
                    type="button" 
                    className={`btn-payment-confirm ${isVerifying ? 'loading' : ''}`}
                    onClick={handleConfirmTransfer}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw size={16} className="spin-icon" />
                        <span>Đang gửi thông tin đối soát...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Tôi đã chuyển khoản thành công</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
