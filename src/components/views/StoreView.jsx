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
  QrCode,
  Users,
  Layers,
  Lock,
  Unlock,
  ArrowRight,
  Gift
} from 'lucide-react';
import PaymentQrModal from '../PaymentQrModal';
import { PRICING_CATALOG, formatVND } from '../../data/pricing';

export default function StoreView({ 
  onRequestPurchase, 
  onSwitchToChat, 
  onStartTrial,
  user = { isLoggedIn: false },
  ownedSkills = [],
  onOpenAuthModal 
}) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [activeStoreTab, setActiveStoreTab] = useState('skills'); // 'skills' | 'combos' | 'agents'
  const [selectedPkgForPayment, setSelectedPkgForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Icon mapping
  const iconMap = {
    ShoppingCart,
    Flame,
    Building2,
    Scale,
    Sparkles,
    Zap,
    Package,
    Users
  };

  const handlePurchase = (pkg) => {
    if (!user?.isLoggedIn) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    setSelectedPkgForPayment(pkg);
    setIsPaymentModalOpen(true);
  };

  const handleStartTrialClick = (skill) => {
    if (!user?.isLoggedIn) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }
    if (onStartTrial) {
      onStartTrial({
        id: skill.skillId || skill.id,
        name: skill.name,
        checklist: skill.features?.map(f => ({ label: f, status: 'pass' })) || []
      });
    }
  };

  const isSkillOwned = (skillId) => {
    if (!user?.isLoggedIn) return false;
    if (user?.role === 'owner' || user?.role === 'admin') return true;
    return ownedSkills && ownedSkills.some(s => s.id === skillId || s === skillId);
  };

  return (
    <div className="view-page-container store-redesign-container" style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* View Header */}
      <div className="view-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div className="view-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            <Sparkles size={14} /> Cửa Hàng Bản Quyền Thương Mại TRÍ AI
          </div>
          <h1 className="view-title" style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Bảng Giá & Gói Năng Lực AI Chuyên Biệt
          </h1>
          <p className="view-desc" style={{ fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '720px' }}>
            Minh bạch chi phí, sở hữu vĩnh viễn theo chu kỳ. Skill là đơn vị tính phí cốt lõi, tích hợp trực tiếp vào toàn bộ Chuyên gia AI của hệ thống.
          </p>
        </div>

        {/* Billing Cycle Switcher (No fake -20%, accurately 'Tiết kiệm 2 tháng') */}
        <div className="billing-toggle-pill" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '30px', border: '1px solid #e2e8f0' }}>
          <button 
            type="button"
            className={`pill-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 18px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: billingCycle === 'monthly' ? '#2563eb' : 'transparent',
              color: billingCycle === 'monthly' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            Theo tháng
          </button>
          <button 
            type="button"
            className={`pill-cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '8px 18px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: billingCycle === 'yearly' ? '#2563eb' : 'transparent',
              color: billingCycle === 'yearly' ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            Theo năm 
            <span style={{ background: '#10b981', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
              Tiết kiệm 2 tháng
            </span>
          </button>
        </div>
      </div>

      {/* 3 Store Section Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveStoreTab('skills')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '700',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeStoreTab === 'skills' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeStoreTab === 'skills' ? '#2563eb' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={16} /> KHU 1: KỸ NĂNG CHUYÊN SÂU (SKILLS)
        </button>
        <button
          type="button"
          onClick={() => setActiveStoreTab('combos')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '700',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeStoreTab === 'combos' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeStoreTab === 'combos' ? '#2563eb' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Package size={16} /> KHU 2: GÓI COMBO & DOANH NGHIỆP
        </button>
        <button
          type="button"
          onClick={() => setActiveStoreTab('agents')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '700',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeStoreTab === 'agents' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeStoreTab === 'agents' ? '#2563eb' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> KHU 3: CHUYÊN GIA AI (AGENTS)
        </button>
      </div>

      {/* ==================================================================== */}
      {/* KHU 1: SKILL ĐƠN LẺ */}
      {/* ==================================================================== */}
      {activeStoreTab === 'skills' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Danh Mục Skill Chuyên Biệt</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Kích hoạt từng kỹ năng riêng lẻ theo đúng nhu cầu công việc của bạn.</p>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              🎁 Tất cả Skill đều hỗ trợ <b>Dùng thử 15 phút miễn phí</b>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {PRICING_CATALOG.skills.map((skill) => {
              const IconComp = iconMap[skill.iconName] || Sparkles;
              const price = billingCycle === 'yearly' ? skill.yearlyPrice : skill.monthlyPrice;
              const isOwned = isSkillOwned(skill.skillId);

              return (
                <div 
                  key={skill.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {skill.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
                      background: '#f59e0b',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {skill.badge}
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(37, 99, 235, 0.08)',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComp size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>{skill.category}</div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '2px 0 0 0' }}>{skill.name}</h3>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0', minHeight: '40px' }}>
                      {skill.description}
                    </p>

                    <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{formatVND(price)}</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>/{billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', marginTop: '2px' }}>
                          ✓ Tiết kiệm 2 tháng chi phí sử dụng
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Quyền năng chuyên môn:</div>
                      {skill.features.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                          <Check size={14} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => handleStartTrialClick(skill)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Gift size={14} style={{ color: '#f59e0b' }} /> Dùng thử 15p
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePurchase({
                        id: skill.skillId || skill.id,
                        name: skill.name,
                        monthlyPrice: skill.monthlyPrice,
                        yearlyPrice: skill.yearlyPrice,
                        priceMonth: formatVND(skill.monthlyPrice),
                        priceYear: formatVND(skill.yearlyPrice),
                        billingCycle
                      })}
                      style={{
                        flex: 1.4,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isOwned ? '#10b981' : '#2563eb',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                      }}
                    >
                      {isOwned ? (
                        <>✓ Đã sở hữu</>
                      ) : (
                        <><Zap size={14} /> Kích hoạt ngay</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* KHU 2: GÓI COMBO & DOANH NGHIỆP */}
      {/* ==================================================================== */}
      {activeStoreTab === 'combos' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Gói Tiết Kiệm & Doanh Nghiệp Toàn Năng</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Tiết kiệm tối đa khi mua theo gói Combo kết hợp hoặc giải pháp Master toàn diện.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* 1. COMBO 5 SKILL */}
            {PRICING_CATALOG.combos.map(combo => {
              const price = billingCycle === 'yearly' ? combo.yearlyPrice : combo.monthlyPrice;
              return (
                <div 
                  key={combo.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '2px solid #3b82f6',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-12px', right: '24px', background: '#3b82f6', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '12px' }}>
                    {combo.badge}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>{combo.category}</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{combo.name}</h3>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>{combo.description}</p>

                    <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e40af' }}>{formatVND(price)}</span>
                        <span style={{ fontSize: '14px', color: '#3b82f6' }}>/{billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>
                          ✓ Tiết kiệm 2 tháng sử dụng (10 tháng tiền / 12 tháng dùng)
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>5 Skill được kích hoạt cùng lúc:</div>
                      {combo.includedSkillNames?.map((skName, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                          <Check size={14} style={{ color: '#10b981' }} />
                          <span>{skName}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Quyền lợi kèm theo:</div>
                      {combo.features.map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          <Check size={14} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePurchase({
                      id: combo.id,
                      name: combo.name,
                      monthlyPrice: combo.monthlyPrice,
                      yearlyPrice: combo.yearlyPrice,
                      priceMonth: formatVND(combo.monthlyPrice),
                      priceYear: formatVND(combo.yearlyPrice),
                      billingCycle
                    })}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(37,99,235,0.3)'
                    }}
                  >
                    <Zap size={16} /> Kích hoạt Combo 5 Skill
                  </button>
                </div>
              );
            })}

            {/* 2. ENTERPRISE PACK */}
            {(() => {
              const ent = PRICING_CATALOG.enterprise;
              const price = billingCycle === 'yearly' ? ent.yearlyPrice : ent.monthlyPrice;
              return (
                <div 
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '2px solid #8b5cf6',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.1)',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-12px', right: '24px', background: '#8b5cf6', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '12px' }}>
                    {ent.badge}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '4px' }}>{ent.category}</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{ent.name}</h3>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>{ent.description}</p>

                    <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: '#6d28d9' }}>{formatVND(price)}</span>
                        <span style={{ fontSize: '14px', color: '#8b5cf6' }}>/{billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>
                          ✓ Tiết kiệm 2 tháng sử dụng
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>8 Skill cốt lõi được mở khóa:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {ent.includedSkillNames?.map((skName, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                            <Check size={12} style={{ color: '#10b981' }} />
                            <span>{skName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Quyền năng doanh nghiệp:</div>
                      {ent.features.map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          <Check size={14} style={{ color: '#8b5cf6', marginTop: '2px', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePurchase({
                      id: ent.id,
                      name: ent.name,
                      monthlyPrice: ent.monthlyPrice,
                      yearlyPrice: ent.yearlyPrice,
                      priceMonth: formatVND(ent.monthlyPrice),
                      priceYear: formatVND(ent.yearlyPrice),
                      billingCycle
                    })}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#8b5cf6',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(139,92,246,0.3)'
                    }}
                  >
                    <ShieldCheck size={16} /> Kích hoạt Gói Enterprise
                  </button>
                </div>
              );
            })()}

            {/* 3. MASTER 33 SKILL PACK */}
            {(() => {
              const mst = PRICING_CATALOG.master;
              const price = billingCycle === 'yearly' ? mst.yearlyPrice : mst.monthlyPrice;
              return (
                <div 
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '2px solid #f59e0b',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.15)',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-12px', right: '24px', background: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '12px' }}>
                    {mst.badge}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', marginBottom: '4px' }}>{mst.category}</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{mst.name}</h3>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>{mst.description}</p>

                    <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: '#b45309' }}>{formatVND(price)}</span>
                        <span style={{ fontSize: '14px', color: '#d97706' }}>/{billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>
                          ✓ Tiết kiệm 2 tháng sử dụng
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Đặc quyền trọn gói Master:</div>
                      {mst.features.map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                          <Check size={14} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePurchase({
                      id: mst.id,
                      name: mst.name,
                      monthlyPrice: mst.monthlyPrice,
                      yearlyPrice: mst.yearlyPrice,
                      priceMonth: formatVND(mst.monthlyPrice),
                      priceYear: formatVND(mst.yearlyPrice),
                      billingCycle
                    })}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(245,158,11,0.3)'
                    }}
                  >
                    <Sparkles size={16} /> Sở Hữu Trọn Bộ 33 Skill Master
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* KHU 3: CHUYÊN GIA AI (AGENTS) */}
      {/* ==================================================================== */}
      {activeStoreTab === 'agents' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Hệ Sinh Thái Chuyên Gia AI (Agents)</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Mỗi Agent đóng vai trò chuyên môn và sử dụng các Skill tương ứng. Mở khóa Skill để kích hoạt đầy đủ năng lực cho Agent.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {PRICING_CATALOG.agents.map((agent) => {
              const hasAllSkills = agent.requiredSkillIds.every(skId => isSkillOwned(skId));
              const missingSkills = agent.requiredSkillIds.filter(skId => !isSkillOwned(skId));

              return (
                <div 
                  key={agent.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      <img 
                        src={agent.avatar} 
                        alt={agent.name} 
                        style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                        onError={(e) => { e.target.src = '/assets/user_avatar.png'; }}
                      />
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>{agent.name}</h3>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb' }}>{agent.role}</div>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                      {agent.desc}
                    </p>

                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Skill Agent sử dụng:</div>
                      {agent.requiredSkillNames.map((skName, i) => {
                        const skId = agent.requiredSkillIds[i];
                        const owned = isSkillOwned(skId);
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#334155' }}>• {skName}</span>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: owned ? '#10b981' : '#f59e0b' }}>
                              {owned ? '✓ Đã mở khóa' : '🔒 Đang khóa'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    {hasAllSkills ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSwitchToChat) onSwitchToChat(agent);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#10b981',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Unlock size={14} /> Trò chuyện với {agent.name}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const firstMissing = missingSkills[0];
                          const targetSkill = PRICING_CATALOG.skills.find(s => s.skillId === firstMissing) || PRICING_CATALOG.skills[0];
                          handlePurchase({
                            id: targetSkill.skillId || targetSkill.id,
                            name: targetSkill.name,
                            monthlyPrice: targetSkill.monthlyPrice,
                            yearlyPrice: targetSkill.yearlyPrice,
                            priceMonth: formatVND(targetSkill.monthlyPrice),
                            priceYear: formatVND(targetSkill.yearlyPrice),
                            billingCycle
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Lock size={14} /> Mua Skill để mở khóa Agent
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment QR Modal */}
      {isPaymentModalOpen && selectedPkgForPayment && (
        <PaymentQrModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          packageData={selectedPkgForPayment}
          billingCycle={billingCycle}
          user={user}
          onPaymentSuccess={(data) => {
            setIsPaymentModalOpen(false);
            if (onRequestPurchase) onRequestPurchase(data);
          }}
        />
      )}
    </div>
  );
}
