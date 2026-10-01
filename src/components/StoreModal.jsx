import React, { useState } from 'react';
import { X, ShoppingCart, Check, Sparkles, Flame, Building2, Scale, Package, ShieldCheck } from 'lucide-react';
import PaymentQrModal from './PaymentQrModal';

export default function StoreModal({ isOpen, onClose, onRequestPurchase, onStartTrial }) {
  const [selectedPkgForPayment, setSelectedPkgForPayment] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  if (!isOpen) return null;

  const storePacks = [
    {
      id: 'store-kol',
      name: 'Gói KOL Thời Trang AI (Ý Ngọc Lookbook)',
      price: '399.000đ/tháng',
      billing: 'Thanh toán hàng tháng hoặc 3.990.000đ/năm',
      icon: Sparkles,
      color: 'pink',
      badge: 'Công nghệ mới',
      features: [
        'Khóa nhận diện gương mặt KOL Ý Ngọc nhất quán 100%',
        'Sản xuất bộ ảnh Lookbook & Fashion Campaign chuẩn 8K',
        'Tùy biến bối cảnh Luxury Hotel, Studio, Áo dài, Haute Couture',
        'Xuất file đầy đủ định dạng: PDF, PNG, JPEG độ nét cao'
      ]
    },
    {
      id: 'store-pccc',
      name: 'Gói Chuyên Gia PCCC',
      price: '199.000đ/tháng',
      billing: 'Thanh toán hàng tháng hoặc 1.800.000đ/năm',
      icon: Flame,
      color: 'red',
      features: [
        'Rà soát tự động biên bản thử áp lực, kiểm định PCCC',
        'Đối chiếu chuẩn QCVN 06:2026/BXD và Nghị định 136/2020',
        'Soạn thảo văn bản giải trình và khắc phục tồn đọng',
        'Cập nhật tự động thông tư, nghị định mới nhất'
      ]
    },
    {
      id: 'store-mua-sam',
      name: 'Gói Mua Sắm & Báo Giá',
      price: '99.000đ/tháng',
      billing: 'Thanh toán hàng tháng hoặc 950.000đ/năm',
      icon: ShoppingCart,
      color: 'orange',
      features: [
        'Tự động bóc tách so sánh tối thiểu 3-5 báo giá',
        'Đánh giá năng lực nhà thầu & tối ưu 10-15% chi phí',
        'Lập tờ trình mua sắm theo chuẩn tập đoàn ISO',
        'Cơ sở dữ liệu hơn 1.200 NCC thiết bị uy tín'
      ]
    },
    {
      id: 'store-mep',
      name: 'Gói Kỹ Sư Cơ Điện MEP',
      price: '299.000đ/tháng',
      billing: 'Thanh toán hàng tháng hoặc 2.900.000đ/năm',
      icon: Building2,
      color: 'blue',
      features: [
        'Quy trình vận hành chuẩn MEP/MEPF và HVAC tòa nhà',
        'Cảnh báo lịch bảo trì, bảo dưỡng định kỳ hệ thống',
        'Lập nhật ký vận hành kỹ thuật tự động',
        'Ứng phó khẩn cấp sự cố điện nguồn ATS và máy phát'
      ]
    },
    {
      id: 'store-phap-ly',
      name: 'Gói Pháp Chế & Soát Hợp Đồng',
      price: '199.000đ/tháng',
      billing: 'Thanh toán hàng tháng hoặc 1.800.000đ/năm',
      icon: Scale,
      color: 'gold',
      features: [
        'Soát lỗi điều khoản hợp đồng EPC, thi công, mua bán',
        'Cảnh báo rủi ro bồi thường, phạt vi phạm, bảo lãnh',
        'Soạn thảo văn bản, tờ trình, công văn hành chính',
        'Tư vấn quy trình giải quyết tranh chấp pháp lý'
      ]
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container store-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <ShoppingCart className="modal-title-icon" size={24} />
            <div>
              <h3>Cửa Hàng Skill & Gói Bản Quyền Thương Mại</h3>
              <p>Mở rộng năng lực doanh nghiệp — Kích hoạt ngay chỉ trong 1 cú click</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="store-modal-body">
          <div className="store-banner-highlight">
            <div className="promo-tag">ƯU ĐÃI DOANH NGHIỆP</div>
            <h4>Gói Toàn Năng Trí AI Enterprise</h4>
            <p>Sở hữu toàn bộ 8+ Skill chuyên ngành + Độc quyền tính năng Nạp Skill không giới hạn + Hỗ trợ kỹ thuật 24/7.</p>
            <div className="enterprise-price-row">
              <span className="price-big">4.990.000đ</span>
              <span className="price-unit">/ trọn đời (Bán theo máy hoặc Cloud)</span>
              <button 
                className="btn-buy-enterprise" 
                onClick={() => {
                  setSelectedPkgForPayment({
                    id: 'store-enterprise',
                    name: 'Gói Toàn Năng Trí AI Enterprise',
                    price: '4.990.000đ',
                    desc: 'Mở khóa toàn bộ Skill chuyên ngành + Nạp không giới hạn + Bản quyền trọn đời'
                  });
                  setIsPaymentOpen(true);
                }}
              >
                Kích hoạt Ngay
              </button>
            </div>
          </div>

          <div className="store-grid-cards">
            {storePacks.map(pack => {
              const Icon = pack.icon;
              return (
                <div key={pack.id} className="store-pack-card">
                  <div className={`store-pack-header ${pack.color}`}>
                    <div className="pack-icon-circle">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h5>{pack.name}</h5>
                      <div className="pack-price-tag">{pack.price}</div>
                    </div>
                  </div>

                  <div className="store-pack-features">
                    {pack.features.map((f, i) => (
                      <div key={i} className="pack-f-line">
                        <Check size={14} className="check-gold" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pack-billing-note">{pack.billing}</div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      type="button"
                      className="btn-trial-15m"
                      onClick={() => {
                        if (onStartTrial) {
                          onStartTrial(pack);
                        }
                        onClose();
                      }}
                      title="Dùng thử miễn phí 15 phút"
                      style={{
                        flex: 1,
                        padding: '9px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      🎁 Dùng thử 15p
                    </button>

                    <button 
                      type="button"
                      className="btn-activate-pack"
                      onClick={() => {
                        setSelectedPkgForPayment(pack);
                        setIsPaymentOpen(true);
                      }}
                      style={{ flex: 1.3, marginTop: 0 }}
                    >
                      💳 Mua bản quyền
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment QR Modal */}
        <PaymentQrModal 
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          packageData={selectedPkgForPayment}
          billingCycle="monthly"
          onPaymentSubmitted={(paymentInfo) => {
            if (onRequestPurchase) {
              onRequestPurchase(paymentInfo);
            }
            onClose();
          }}
        />
      </div>
    </div>
  );
}
