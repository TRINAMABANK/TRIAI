import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Check, 
  Sparkles, 
  Flame, 
  Building2, 
  Scale, 
  Cpu, 
  Package, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  Download,
  QrCode
} from 'lucide-react';
import PaymentQrModal from '../PaymentQrModal';

export default function StoreView({ onActivateSkill, onSwitchToChat, onStartTrial }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [purchasedId, setPurchasedId] = useState(null);
  const [selectedPkgForPayment, setSelectedPkgForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const packages = [
    {
      id: 'store-master-33',
      name: 'Trọn Bộ 33 Skill Độc Quyền Trí AI (Master V1)',
      category: 'Toàn diện (All-in-One)',
      priceMonth: '990.000đ',
      priceYear: '8.900.000đ',
      badge: 'Gói Cao Cấp VIP',
      desc: 'Sở hữu toàn bộ 33 bộ Skill chuyên nghiệp cho doanh nghiệp: Phân tích 4 góc, PCCC, MEP, Vận hành, Mua sắm, AI Workflow, Sales AI, Thiết kế & KOL.',
      icon: Sparkles,
      color: 'blue',
      downloadUrl: '/data/TRI-AI-SKILLS-V1.zip',
      features: [
        'Trọn gói 33 Skill chuẩn thương mại với đầy đủ workflows & prompts',
        'Bao gồm file ZIP từng Skill và Master ZIP (TRI-AI-SKILLS-V1.zip)',
        'Tải ngay file cấu hình JSON Master tương thích mọi hệ sinh thái AI',
        'Hỗ trợ xuất hóa đơn, nhãn trắng (White-label) và hướng dẫn bàn giao'
      ]
    },
    {
      id: 'store-muasam',
      name: 'Gói Skill Mua Sắm & Báo Giá',
      category: 'Doanh nghiệp',
      priceMonth: '99.000đ',
      priceYear: '990.000đ',
      desc: 'Tự động bóc tách và so sánh đa báo giá, đánh giá năng lực nhà cung cấp và lập tờ trình.',
      icon: ShoppingCart,
      color: 'orange',
      features: [
        'So sánh tự động 3 - 5 nhà cung cấp',
        'Bóc tách bảng dự toán Excel & PDF',
        'Soạn thảo tờ trình phê duyệt chuẩn ISO',
        'Hỗ trợ đàm phán tối ưu 10-15% chi phí'
      ]
    },
    {
      id: 'store-pccc',
      name: 'Gói Skill PCCC & Thẩm Duyệt',
      category: 'Kỹ thuật chuyên sâu',
      priceMonth: '199.000đ',
      priceYear: '1.990.000đ',
      badge: 'Bán chạy nhất',
      desc: 'Rà soát 100% hồ sơ nghiệm thu PCCC theo QCVN 06:2026/BXD, phát hiện sai sót bản vẽ hoàn công.',
      icon: Flame,
      color: 'red',
      features: [
        'Đối chiếu quy chuẩn QCVN 06:2026/BXD mới nhất',
        'Kiểm tra biên bản nghiệm thu & thử nghiệm',
        'Khoanh vùng 5 điểm checklist an toàn',
        'Xuất báo cáo kỹ thuật định dạng Word (.doc)'
      ]
    },
    {
      id: 'store-kol',
      name: 'Gói KOL Thời Trang AI (Ý Ngọc)',
      category: 'KOL & Marketing',
      priceMonth: '399.000đ',
      priceYear: '3.990.000đ',
      badge: 'Công nghệ mới',
      desc: 'Sản xuất bộ ảnh Lookbook và chiến dịch quảng cáo thời trang cao cấp với người mẫu Ý Ngọc giữ nhận diện 100%.',
      icon: Sparkles,
      color: 'pink',
      features: [
        'Khóa nhận diện gương mặt KOL Ý Ngọc 100%',
        'Xuất ảnh Commercial Photography 8K sắc nét',
        'Tùy biến trang phục Áo dài, Haute Couture',
        'Tự động tích hợp vào hệ thống Trí AI'
      ]
    },
    {
      id: 'store-mep',
      name: 'Gói MEP & Vận Hành Tòa Nhà',
      category: 'Vận hành kỹ thuật',
      priceMonth: '299.000đ',
      priceYear: '2.990.000đ',
      desc: 'Quản lý vận hành hệ thống cơ điện lạnh, máy phát điện, thang máy và xử lý sự cố công trình.',
      icon: Building2,
      color: 'blue',
      features: [
        'Sơ đồ vận hành MEPF & HVAC trung tâm',
        'Nhật ký kiểm tra định kỳ hàng tuần',
        'Quy trình ứng phó khẩn cấp sự cố kỹ thuật',
        'Bảo trì phòng ngừa rủi ro hư hỏng thiết bị'
      ]
    },
    {
      id: 'store-enterprise',
      name: 'Gói Combo Enterprise Toàn Diện',
      category: 'Gói thương mại B2B',
      priceMonth: '799.000đ',
      priceYear: '7.990.000đ',
      badge: 'Được doanh nghiệp chọn nhiều',
      desc: 'Mở khóa toàn bộ 8 Skill chuyên ngành + Quyền nạp không giới hạn Skill mới + Giấy phép bán lại bản quyền.',
      icon: Zap,
      color: 'gold',
      features: [
        'Mở khóa trọn bộ 8 Skill cốt lõi',
        'Nạp và tạo Skill mới không giới hạn',
        'Hỗ trợ xuất gói thương mại phân phối lại',
        'Hỗ trợ kỹ thuật 24/7 trực tiếp từ Trí AI'
      ]
    }
  ];

  const handlePurchase = (pkg) => {
    setSelectedPkgForPayment(pkg);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (pkg) => {
    setPurchasedId(pkg.id);
    onActivateSkill({
      id: pkg.id,
      name: pkg.name,
      category: pkg.category,
      desc: pkg.desc
    });
    setTimeout(() => {
      onSwitchToChat(`Tôi vừa thanh toán và kích hoạt thành công ${pkg.name}. Hãy hướng dẫn tôi cách sử dụng hiệu quả nhất!`);
    }, 400);
  };

  const handleDownloadContract = (pkg) => {
    const text = `HỢP ĐỒNG BẢN QUYỀN VÀ CHUYỂN GIAO CÔNG NGHỆ TRÍ AI\nGói giải pháp: ${pkg.name}\nChi phí: ${billingCycle === 'monthly' ? pkg.priceMonth : pkg.priceYear}\nChủ sở hữu công nghệ: QUANG NHỰT TRÍ (TRÍ AI)\nKhách hàng: Đối tác Doanh nghiệp\nĐiều khoản: Toàn quyền khai thác và nạp thêm Skill nghiệp vụ.`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hop_dong_ban_quyen_${pkg.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-page-container">
      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">Thương mại & Bản quyền B2B</div>
          <h1 className="view-title">Cửa Hàng Skill & Bản Quyền Phần Mềm</h1>
          <p className="view-desc">Cung cấp các gói năng lực AI đóng gói sẵn cho khách hàng, đối tác hoặc mở rộng quyền sử dụng cho doanh nghiệp của bạn.</p>
        </div>

        {/* Billing toggle */}
        <div className="billing-toggle-pill">
          <button 
            className={`pill-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Theo tháng
          </button>
          <button 
            className={`pill-cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Theo năm <span className="discount-tag">-20%</span>
          </button>
        </div>
      </div>

      {/* Commercial Highlight Banner */}
      <div className="commercial-info-banner">
        <div className="banner-badge-hot">DÀNH CHO CHỦ SỞ HỮU TRÍ AI</div>
        <h3>Mô Hình Kinh Doanh Sẵn Sàng Bán Cho Khách Hàng</h3>
        <p>Mỗi Skill là một sản phẩm độc lập có thể phân phối dưới dạng dịch vụ thuê bao SaaS hoặc đóng gói trọn gói kèm phần cứng/hệ thống quản trị tòa nhà.</p>
      </div>

      {/* Store Pricing Grid */}
      <div className="store-pricing-grid">
        {packages.map((pkg) => {
          const IconComponent = pkg.icon;
          const isPurchased = purchasedId === pkg.id;

          return (
            <div key={pkg.id} className={`pricing-package-card ${pkg.badge ? 'has-badge' : ''}`}>
              {pkg.badge && <div className="pkg-top-badge">{pkg.badge}</div>}

              <div className="pkg-head">
                <div className={`pkg-icon-wrap ${pkg.color}`}>
                  <IconComponent size={24} />
                </div>
                <div className="pkg-cat-tag">{pkg.category}</div>
                <h3 className="pkg-name">{pkg.name}</h3>
                <p className="pkg-desc">{pkg.desc}</p>
              </div>

              <div className="pkg-price-row">
                <span className="pkg-amount">
                  {billingCycle === 'monthly' ? pkg.priceMonth : pkg.priceYear}
                </span>
                <span className="pkg-period">/{billingCycle === 'monthly' ? 'tháng' : 'năm'}</span>
              </div>

              <div className="pkg-features-list">
                <div className="features-headline">Bao gồm các quyền năng:</div>
                {pkg.features.map((feat, i) => (
                  <div key={i} className="feat-line">
                    <Check size={16} className="feat-check-icon" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pkg-cta-area">
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '8px' }}>
                  <button 
                    type="button"
                    className="btn-trial-15m"
                    onClick={() => {
                      if (onStartTrial) {
                        onStartTrial(pkg);
                      }
                    }}
                    title={`Dùng thử miễn phí Skill ${pkg.name} trong 15 phút`}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
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
                    className={`btn-buy-package ${isPurchased ? 'bought' : ''}`}
                    onClick={() => handlePurchase(pkg)}
                    style={{ flex: 1.2 }}
                  >
                    {isPurchased ? '✓ Đã kích hoạt' : '💳 Mua bản quyền'}
                  </button>
                </div>

                {pkg.downloadUrl ? (
                  <a 
                    href={pkg.downloadUrl}
                    download="TRI-AI-SKILLS-V1.zip"
                    className="btn-download-contract"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}
                    title="Tải trọn bộ file ZIP 33 Skill"
                  >
                    <Download size={14} /> Tải file ZIP Master
                  </a>
                ) : (
                  <button 
                    className="btn-download-contract"
                    onClick={() => handleDownloadContract(pkg)}
                    title="Tải mẫu hợp đồng chuyển giao bản quyền"
                  >
                    <Download size={14} /> Mẫu hợp đồng
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment QR Modal */}
      <PaymentQrModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        packageData={selectedPkgForPayment}
        billingCycle={billingCycle}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
