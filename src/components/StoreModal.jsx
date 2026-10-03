import React, { useState } from 'react';
import { 
  X, ShoppingCart, Check, Sparkles, Flame, Building2, Scale, 
  Package, ShieldCheck, Zap, Bot, ArrowRight, Layers, Award
} from 'lucide-react';
import { PRICING_CATALOG, formatVND } from '../data/pricing';
import PaymentQrModal from './PaymentQrModal';

export default function StoreModal({ isOpen, onClose, onRequestPurchase, onStartTrial }) {
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'combos' | 'agents'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPkgForPayment, setSelectedPkgForPayment] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  if (!isOpen) return null;

  const iconMap = {
    ShoppingCart: ShoppingCart,
    Flame: Flame,
    Building2: Building2,
    Scale: Scale,
    Sparkles: Sparkles
  };

  const handleOpenPayment = (product) => {
    const isYearly = billingCycle === 'yearly';
    const priceNumber = isYearly ? product.yearlyPrice : product.monthlyPrice;
    
    setSelectedPkgForPayment({
      id: product.id,
      skillId: product.skillId || product.id,
      name: product.name,
      price: formatVND(priceNumber),
      priceNumber: priceNumber,
      billingCycle: billingCycle,
      type: product.type || 'skill',
      includedSkills: product.includedSkills,
      desc: product.description
    });
    setIsPaymentOpen(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container store-modal" 
        style={{ 
          maxWidth: '980px', 
          width: '95vw', 
          maxHeight: '90vh', 
          height: '90vh',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="modal-header" style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <div className="modal-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '10px', borderRadius: '12px', color: '#fff', display: 'flex' }}>
              <ShoppingCart size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>TRÍ AI Store — Kỹ Năng & Gói Bản Quyền Thương Mại</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Đơn vị tính phí: Kỹ năng AI (Skill) chuyên biệt theo chuẩn ngành</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Modal Controls: Tabs & Billing Toggle */}
        <div style={{ flexShrink: 0, padding: '14px 24px 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('skills')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === 'skills' ? '3px solid #2563eb' : '3px solid transparent',
                background: activeTab === 'skills' ? '#fff' : 'transparent',
                color: activeTab === 'skills' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'skills' ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={16} /> Skill Đơn Lẻ
            </button>
            <button
              onClick={() => setActiveTab('combos')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === 'combos' ? '3px solid #2563eb' : '3px solid transparent',
                background: activeTab === 'combos' ? '#fff' : 'transparent',
                color: activeTab === 'combos' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'combos' ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Package size={16} /> Combo & Doanh Nghiệp
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === 'agents' ? '3px solid #2563eb' : '3px solid transparent',
                background: activeTab === 'agents' ? '#fff' : 'transparent',
                color: activeTab === 'agents' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'agents' ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bot size={16} /> Chuyên Gia Agent
            </button>
          </div>

          {/* Billing Cycle Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '10px', marginBottom: '8px' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'monthly' ? '#fff' : 'transparent',
                color: billingCycle === 'monthly' ? '#0f172a' : '#64748b',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'yearly' ? '#2563eb' : 'transparent',
                color: billingCycle === 'yearly' ? '#fff' : '#64748b',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: billingCycle === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Theo Năm <span style={{ fontSize: '11px', background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>Tiết kiệm 2 tháng</span>
            </button>
          </div>

        </div>

        {/* Modal Body */}
        <div className="store-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 48px', minHeight: 0 }}>

          {/* TAB 1: SKILL ĐƠN LẺ */}
          {activeTab === 'skills' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                {PRICING_CATALOG.skills.map(skill => {
                  const Icon = iconMap[skill.iconName] || Zap;
                  const price = billingCycle === 'yearly' ? skill.yearlyPrice : skill.monthlyPrice;
                  const priceSuffix = billingCycle === 'yearly' ? '/năm' : '/tháng';

                  return (
                    <div 
                      key={skill.id} 
                      style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                    >
                      {skill.badge && (
                        <div style={{ position: 'absolute', top: '-10px', right: '14px', background: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                          {skill.badge}
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{skill.name}</h4>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{skill.category}</span>
                          </div>
                        </div>

                        <p style={{ fontSize: '13px', color: '#475569', minHeight: '38px', marginBottom: '16px', lineHeight: '1.4' }}>
                          {skill.description}
                        </p>

                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                            {formatVND(price)}
                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}> {priceSuffix}</span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', marginTop: '3px' }}>
                              ⚡ Tiết kiệm 2 tháng (10 tháng tiền / 12 tháng sử dụng)
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {skill.features.slice(0, 3).map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <Check size={14} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                              <span style={{ color: '#334155' }}>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onStartTrial) onStartTrial(skill);
                            onClose();
                          }}
                          style={{
                            flex: 1,
                            padding: '9px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            cursor: 'pointer'
                          }}
                        >
                          🎁 Thử 15p
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPayment(skill)}
                          style={{
                            flex: 1.4,
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          💳 Mua Skill
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMBO & ENTERPRISE */}
          {activeTab === 'combos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Combo 5 Skill */}
              {PRICING_CATALOG.combos.map(combo => {
                const price = billingCycle === 'yearly' ? combo.yearlyPrice : combo.monthlyPrice;
                const priceSuffix = billingCycle === 'yearly' ? '/năm' : '/tháng';
                return (
                  <div key={combo.id} style={{ background: '#fff', border: '2px solid #2563eb', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(37,99,235,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', marginBottom: '6px' }}>
                          {combo.badge}
                        </div>
                        <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{combo.name}</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{combo.description}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb' }}>
                          {formatVND(price)}
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}> {priceSuffix}</span>
                        </div>
                        {billingCycle === 'yearly' && <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>⚡ Tiết kiệm 2 tháng</div>}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>5 Skill kích hoạt trực tiếp vào License:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {combo.includedSkillNames.map((sName, idx) => (
                          <span key={idx} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#1e293b', fontWeight: '500' }}>
                            ✓ {sName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenPayment(combo)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Kích hoạt Combo 5 Skill ngay
                    </button>
                  </div>
                );
              })}

              {/* Enterprise & Master */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                
                {/* Enterprise */}
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                    {PRICING_CATALOG.enterprise.badge}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>{PRICING_CATALOG.enterprise.name}</h4>
                  <p style={{ margin: '6px 0 12px', fontSize: '12px', color: '#64748b' }}>{PRICING_CATALOG.enterprise.description}</p>
                  
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                    {formatVND(billingCycle === 'yearly' ? PRICING_CATALOG.enterprise.yearlyPrice : PRICING_CATALOG.enterprise.monthlyPrice)}
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}> {billingCycle === 'yearly' ? '/năm' : '/tháng'}</span>
                  </div>

                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {PRICING_CATALOG.enterprise.features.slice(0, 4).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleOpenPayment(PRICING_CATALOG.enterprise)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Đăng ký Enterprise
                  </button>
                </div>

                {/* Master 33 Skill */}
                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
                  <div style={{ background: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                    {PRICING_CATALOG.master.badge}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#fff' }}>{PRICING_CATALOG.master.name}</h4>
                  <p style={{ margin: '6px 0 12px', fontSize: '12px', color: '#94a3b8' }}>{PRICING_CATALOG.master.description}</p>
                  
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24', marginBottom: '14px' }}>
                    {formatVND(billingCycle === 'yearly' ? PRICING_CATALOG.master.yearlyPrice : PRICING_CATALOG.master.monthlyPrice)}
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}> {billingCycle === 'yearly' ? '/năm' : '/tháng'}</span>
                  </div>

                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', color: '#e2e8f0' }}>
                    {PRICING_CATALOG.master.features.slice(0, 4).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleOpenPayment(PRICING_CATALOG.master)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Kích hoạt Master 33 Skill
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: CHUYÊN GIA AGENT */}
          {activeTab === 'agents' && (
            <div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', fontSize: '13px', color: '#1e40af' }}>
                💡 <b>Mô hình thương mại Agent:</b> Agent không phải là sản phẩm tính phí độc lập, Agent hoạt động dựa trên các Skill chuyên môn tương ứng. Mua Skill để mở khóa Agent.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {PRICING_CATALOG.agents.map(agent => (
                  <div key={agent.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <img 
                        src={agent.avatar} 
                        alt={agent.name}
                        onError={(e) => { e.target.src = '/assets/agent_an.png'; }}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{agent.name}</h4>
                        <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>{agent.role}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: '1.4' }}>
                      {agent.desc}
                    </p>

                    <div style={{ fontSize: '12px', marginBottom: '14px' }}>
                      <span style={{ color: '#475569', fontWeight: '600' }}>Skill yêu cầu:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {agent.requiredSkillNames.map((s, idx) => (
                          <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            ⚡ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('skills')}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#f8fafc',
                        color: '#2563eb',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      Xem Skill để mở khóa →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Payment QR Modal */}
        <PaymentQrModal 
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          packageData={selectedPkgForPayment}
          billingCycle={billingCycle}
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
