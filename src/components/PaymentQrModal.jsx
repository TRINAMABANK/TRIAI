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
  RefreshCw, 
  Hourglass,
  AlertCircle
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
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 đếm ngược
  const [imgError, setImgError] = useState(false);

  // Server-generated order data (Single Source of Truth)
  const [serverOrder, setServerOrder] = useState({
    orderId: '',
    orderCode: '',
    totalAmount: 199000,
    formattedAmount: '199.000 đ',
    qrUrl: '',
    bankInfo: {
      bankName: 'OCB',
      bankFullName: 'Ngân hàng TMCP Phương Đông (OCB)',
      accountNumber: '0982441446',
      accountHolder: 'QUANG NHỰT TRÍ'
    },
    transferContent: 'TRIAI'
  });

  // Khởi tạo đơn hàng từ Server khi mở Modal
  useEffect(() => {
    if (isOpen && packageData) {
      setIsPendingApproval(false);
      setIsVerifying(false);
      setOrderError('');
      setTimeLeft(900);
      setImgError(false);
      setIsLoadingOrder(true);

      api.orders.create({
        items: [{ skillId: packageData.id, period: billingCycle }],
        note: `Khách hàng đặt mua Skill [${packageData.name || packageData.id}] - Gói ${billingCycle === 'monthly' ? 'Tháng' : 'Năm'}`
      })
      .then(res => {
        if (res && res.order) {
          const ord = res.order;
          setServerOrder({
            orderId: ord.orderId,
            orderCode: ord.orderCode,
            totalAmount: ord.totalAmount,
            formattedAmount: ord.formattedAmount || `${ord.totalAmount.toLocaleString('vi-VN')} đ`,
            qrUrl: ord.qrUrl,
            bankInfo: ord.bankInfo || {
              bankName: 'OCB',
              bankFullName: 'Ngân hàng TMCP Phương Đông (OCB)',
              accountNumber: '0982441446',
              accountHolder: 'QUANG NHỰT TRÍ'
            },
            transferContent: ord.transferContent || ord.orderCode
          });
        }
      })
      .catch(err => {
        console.warn('Lỗi tạo đơn hàng từ Server, fallback tạo trực tiếp:', err);
        // Fallback hiển thị thông tin OCB chuẩn nếu offline
        const fallbackCode = `TRIAI-${Math.floor(100000 + Math.random() * 900000)}`;
        const fallbackAmount = billingCycle === 'yearly' ? 1990000 : 199000;
        setServerOrder({
          orderId: `ord_${Date.now()}`,
          orderCode: fallbackCode,
          totalAmount: fallbackAmount,
          formattedAmount: `${fallbackAmount.toLocaleString('vi-VN')} đ`,
          qrUrl: `https://img.vietqr.io/image/OCB-0982441446-compact2.png?amount=${fallbackAmount}&addInfo=${encodeURIComponent(fallbackCode)}&accountName=${encodeURIComponent('QUANG NHỰT TRÍ')}`,
          bankInfo: {
            bankName: 'OCB',
            bankFullName: 'Ngân hàng TMCP Phương Đông (OCB)',
            accountNumber: '0982441446',
            accountHolder: 'QUANG NHỰT TRÍ'
          },
          transferContent: fallbackCode
        });
      })
      .finally(() => {
        setIsLoadingOrder(false);
      });
    }
  }, [isOpen, packageData, billingCycle]);

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

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Khách hàng bấm "Tôi đã chuyển khoản"
  const handleConfirmTransfer = async () => {
    setIsVerifying(true);
    try {
      if (serverOrder.orderId) {
        await api.orders.requestPayment(serverOrder.orderId, {
          transactionRef: serverOrder.transferContent,
          note: `Khách báo đã chuyển khoản ${serverOrder.formattedAmount} cho đơn ${serverOrder.orderCode}`
        }).catch(() => null);
      }
    } catch (e) {
      console.warn('Payment request error:', e);
    }

    if (onPaymentSubmitted && packageData) {
      onPaymentSubmitted({
        packageData,
        billingCycle,
        orderId: serverOrder.orderId,
        orderCode: serverOrder.orderCode,
        transferContent: serverOrder.transferContent,
        amountNumber: serverOrder.totalAmount,
        formattedAmount: serverOrder.formattedAmount
      });
    }

    setTimeout(() => {
      setIsVerifying(false);
      setIsPendingApproval(true);
    }, 800);
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
                {isPendingApproval ? 'Đã Gửi Yêu Cầu Chuyển Khoản' : 'Thanh Toán & Kích Hoạt Bản Quyền'}
              </h3>
              <p className="payment-sub">
                {isPendingApproval 
                  ? 'Yêu cầu đang chờ Quản trị viên QUANG NHỰT TRÍ đối soát và kích hoạt'
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
          {isLoadingOrder ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <RefreshCw size={36} className="spin-icon" style={{ color: '#0284c7', margin: '0 auto 12px' }} />
              <h4 style={{ color: '#0f172a', margin: '0 0 6px' }}>Đang tạo mã thanh toán VietQR từ Server...</h4>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Vui lòng chờ trong giây lát.</p>
            </div>
          ) : isPendingApproval ? (
            /* MÀN HÌNH CHỜ ADMIN PHÊ DUYỆT */
            <div className="payment-success-screen" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div className="success-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Hourglass size={56} className="success-check-pulse" />
              </div>
              
              <h2 className="success-title" style={{ color: '#b45309', marginTop: '12px' }}>
                Đã Gửi Yêu Cầu. Đang Chờ Admin Đối Soát!
              </h2>
              <div className="success-package-card" style={{ maxWidth: '440px', margin: '14px auto', textAlign: 'left' }}>
                <div className="success-pkg-name">✨ {packageData.name}</div>
                <div className="success-pkg-meta">
                  <span>Mã đơn hàng: <b>{serverOrder.orderCode}</b></span>
                  <span>Kỳ hạn: <b>{billingCycle === 'monthly' ? 'Theo tháng' : 'Theo năm'}</b></span>
                  <span>Số tiền: <b className="success-amount">{serverOrder.formattedAmount}</b></span>
                  <span>Nội dung CK: <b style={{ color: '#0284c7' }}>{serverOrder.transferContent}</b></span>
                  <span>Người đối soát: <b>QUANG NHỰT TRÍ (triqnnamabank@gmail.com)</b></span>
                </div>
              </div>

              <p className="success-congrats-text" style={{ maxWidth: '460px', margin: '0 auto 18px', color: '#475569', fontSize: '13.5px', lineHeight: '1.6' }}>
                Hệ thống đã chuyển thông tin đơn hàng <b>{serverOrder.orderCode}</b> tới <b>Quản trị viên (QUANG NHỰT TRÍ)</b> để đối soát tài khoản OCB. Ngay sau khi Admin xác nhận, Skill sẽ tự động mở khóa trên tài khoản của bạn.
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
              
              {/* CỘT TRÁI: KHUNG MÃ QR VIETQR OCB THẬT */}
              <div className="payment-qr-column">
                <div className="qr-card-container">
                  <div className="qr-card-top-bar">
                    <span className="vietqr-logo-text">VIET<b>QR</b></span>
                    <span className="napas-badge">napas 247</span>
                  </div>

                  <div className="qr-image-frame">
                    {!imgError && serverOrder.qrUrl ? (
                      <img 
                        src={serverOrder.qrUrl} 
                        alt="Mã QR Chuyển khoản OCB" 
                        className="vietqr-rendered-img"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      /* Fallback khi offline */
                      <div className="qr-fallback-box">
                        <QrCode size={160} className="qr-fallback-icon" />
                        <div className="qr-fallback-note">Mã QR VietQR OCB 24/7</div>
                        <div className="qr-fallback-acc">STK: {serverOrder.bankInfo?.accountNumber || '0982441446'}</div>
                      </div>
                    )}

                    {/* Logo OCB Watermark ở giữa */}
                    <div className="qr-center-bank-logo">
                      <span>{serverOrder.bankInfo?.bankName || 'OCB'}</span>
                    </div>
                  </div>

                  <div className="qr-countdown-row">
                    <Clock size={14} className="clock-icon" />
                    <span>Mã QR có hiệu lực trong: <b>{formatTime(timeLeft)}</b></span>
                  </div>
                </div>

                <div className="qr-helper-text">
                  Mở ứng dụng Mobile Banking của <b>bất kỳ ngân hàng nào</b> (OCB, Vietcombank, MB, Techcombank, Momo, VNPay...) và chọn <b>Quét QR</b>.
                </div>
              </div>

              {/* CỘT PHẢI: THÔNG TIN CHUYỂN KHOẢN SERVER-SIDE */}
              <div className="payment-info-column">
                
                {/* Header thông tin gói */}
                <div className="package-summary-strip">
                  <div className="pkg-summary-top">
                    <span className="pkg-label-small">Gói Skill:</span>
                    <span className="pkg-cycle-pill">{billingCycle === 'monthly' ? 'Gói Tháng' : 'Gói Năm (Ưu đãi)'}</span>
                  </div>
                  <h4 className="pkg-chosen-name">{packageData.name}</h4>
                  <div className="pkg-total-price">
                    <span>Tổng thanh toán:</span>
                    <b className="total-highlight">{serverOrder.formattedAmount}</b>
                  </div>
                </div>

                {/* Chi tiết tài khoản ngân hàng OCB cấu hình từ Server */}
                <div className="bank-details-card">
                  <div className="bank-card-title">
                    <CreditCard size={16} />
                    <span>Thông tin chuyển khoản ngân hàng</span>
                  </div>

                  {/* 1. Ngân hàng */}
                  <div className="transfer-field-row">
                    <span className="field-lbl">Ngân hàng:</span>
                    <div className="field-val-wrap">
                      <b className="field-val text-brand">{serverOrder.bankInfo?.bankFullName || 'Ngân hàng TMCP Phương Đông (OCB)'}</b>
                    </div>
                  </div>

                  {/* 2. Số tài khoản */}
                  <div className="transfer-field-row">
                    <span className="field-lbl">Số tài khoản:</span>
                    <div className="field-val-wrap">
                      <b className="field-val account-number-styled">{serverOrder.bankInfo?.accountNumber || '0982441446'}</b>
                      <button 
                        type="button" 
                        className={`btn-copy-field ${copiedField === 'acc' ? 'copied' : ''}`}
                        onClick={() => handleCopy(serverOrder.bankInfo?.accountNumber || '0982441446', 'acc')}
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
                      <b className="field-val">{serverOrder.bankInfo?.accountHolder || 'QUANG NHỰT TRÍ'}</b>
                    </div>
                  </div>

                  {/* 4. Số tiền */}
                  <div className="transfer-field-row">
                    <span className="field-lbl">Số tiền:</span>
                    <div className="field-val-wrap">
                      <b className="field-val amount-color">{serverOrder.formattedAmount}</b>
                      <button 
                        type="button" 
                        className={`btn-copy-field ${copiedField === 'amount' ? 'copied' : ''}`}
                        onClick={() => handleCopy(String(serverOrder.totalAmount), 'amount')}
                        title="Sao chép số tiền"
                      >
                        {copiedField === 'amount' ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Nội dung chuyển khoản duy nhất */}
                  <div className="transfer-field-row content-row">
                    <span className="field-lbl">Nội dung CK:</span>
                    <div className="field-val-wrap">
                      <b className="field-val content-code">{serverOrder.transferContent}</b>
                      <button 
                        type="button" 
                        className={`btn-copy-field ${copiedField === 'content' ? 'copied' : ''}`}
                        onClick={() => handleCopy(serverOrder.transferContent, 'content')}
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
                    Vui lòng chuyển <b>chính xác nội dung: {serverOrder.transferContent}</b> để Quản trị viên đối soát tài khoản và kích hoạt bản quyền nhanh nhất.
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
                        <span>Tôi đã chuyển khoản</span>
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
