import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Sparkles,
  UserCheck,
  Zap,
  ShoppingCart
} from 'lucide-react';
import { AGENTS_DATA } from '../../data/agentsData';
import { PRICING_CATALOG } from '../../data/pricing';

export default function AgentsView({ onSelectAgent, onSwitchToChat, ownedSkills = [], onOpenStore }) {
  const [search, setSearch] = useState('');

  // Map agent skill requirements
  const agentSkillRequirements = {
    'tro-ly-mua-sam': [
      { id: 'mua-sam', name: 'Skill Mua Sắm & Báo Giá' },
      { id: 'tai-chinh', name: 'Skill Phân Tích Chi Phí' },
      { id: 'phap-ly', name: 'Skill Soạn Thảo & Kiểm Tra' }
    ],
    'anh-an': [
      { id: 'pccc', name: 'Skill PCCC & Thẩm Duyệt' },
      { id: 'mep', name: 'Skill MEP & Vận Hành' },
      { id: 'van-hanh-toa-nha', name: 'Skill Vận Hành Tòa Nhà' }
    ],
    'tro-ly-phap-ly': [
      { id: 'phap-ly', name: 'Skill Pháp Lý & Hợp Đồng' },
      { id: 'pccc', name: 'Skill Kiểm Tra Căn Cứ PCCC' }
    ],
    'tro-ly-tai-chinh': [
      { id: 'tai-chinh', name: 'Skill Phân Tích Chi Phí & Dự Toán' },
      { id: 'mua-sam', name: 'Skill Bóc Tách Báo Giá' }
    ],
    'tro-ly-kol': [
      { id: 'kol-thoi-trang', name: 'Skill KOL & Visual AI' }
    ]
  };

  const isSkillActive = (skillId) => {
    return ownedSkills && (
      ownedSkills.includes(skillId) || 
      ownedSkills.includes(`skill-${skillId}`) ||
      ownedSkills.includes('all') ||
      ownedSkills.includes('master-33')
    );
  };

  const filteredAgents = AGENTS_DATA.filter(agent => 
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.role.toLowerCase().includes(search.toLowerCase()) ||
    (agent.specialties && agent.specialties.some(s => s.toLowerCase().includes(search.toLowerCase())))
  );

  const handleStartChatWithAgent = (agent, samplePrompt = '') => {
    onSwitchToChat(samplePrompt || `Xin chào ${agent.name}! Tôi muốn bạn tư vấn về lĩnh vực ${agent.role}.`, agent);
  };

  return (
    <div className="view-page-container">
      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">Mô hình Agent & Skill bản quyền</div>
          <h1 className="view-title">Chuyên Gia AI Chuyên Ngành</h1>
          <p className="view-desc">Agent là chuyên gia AI thực thi nhiệm vụ dựa trên các Skill chuyên môn tương ứng. Mở khóa Skill để kích hoạt năng lực chuyên sâu cho Agent.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="view-controls-card">
        <div className="view-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên chuyên gia, chức danh (Kỹ sư, Mua sắm, Pháp lý, KOL, Tài chính)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Commercial Model Note */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '13px', color: '#475569' }}>
          💡 <b>Nguyên tắc bản quyền:</b> Agent sử dụng các Kỹ năng AI (Skill) chuyên biệt. Khi sở hữu Skill tương ứng, Agent sẽ mở khóa đầy đủ khả năng nghiệp vụ.
        </div>
        {onOpenStore && (
          <button 
            onClick={() => onOpenStore()}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShoppingCart size={14} /> Mở Cửa Hàng Skill
          </button>
        )}
      </div>

      {/* Agents Roster Grid */}
      <div className="agents-cards-grid">
        {filteredAgents.map((agent) => {
          const requiredSkills = agentSkillRequirements[agent.id] || [];
          const missingSkills = requiredSkills.filter(s => !isSkillActive(s.id));
          const allUnlocked = missingSkills.length === 0;

          return (
            <div key={agent.id} className="agent-master-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="agent-card-header">
                  <div className="agent-avatar-frame">
                    <img 
                      src={agent.avatar} 
                      alt={agent.name} 
                      className="agent-avatar-img"
                      onError={(e) => {
                        e.target.src = '/assets/agent_an.png';
                      }}
                    />
                    <span className="agent-online-dot" title="Đang trực tuyến"></span>
                  </div>
                  <div className="agent-header-info">
                    <div className="agent-status-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {allUnlocked ? (
                        <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Unlock size={12} /> Đã kích hoạt đầy đủ
                        </span>
                      ) : (
                        <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} /> Cần bổ sung Skill ({missingSkills.length})
                        </span>
                      )}
                    </div>
                    <h3 className="agent-card-name">{agent.name}</h3>
                    <div className="agent-card-role">{agent.role}</div>
                  </div>
                </div>

                <div className="agent-card-body">
                  <p className="agent-bio-text">{agent.bio}</p>

                  {/* Required Skills Section */}
                  <div style={{ marginTop: '12px', marginBottom: '12px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Skill chuyên môn sử dụng:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {requiredSkills.map(s => {
                        const active = isSkillActive(s.id);
                        return (
                          <span 
                            key={s.id}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: active ? '#dcfce7' : '#f1f5f9',
                              color: active ? '#166534' : '#64748b',
                              border: active ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                              fontWeight: active ? '600' : '400'
                            }}
                          >
                            {active ? '✓' : '🔒'} {s.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="agent-specialties-block">
                    <div className="specialties-title">Nghiệp vụ thực thi:</div>
                    <div className="specialties-chips">
                      {agent.specialties && agent.specialties.map((spec, i) => (
                        <span key={i} className="spec-chip">{spec}</span>
                      ))}
                    </div>
                  </div>

                  <div className="agent-greeting-preview">
                    <b>Câu chào:</b>
                    <p>"{agent.greeting}"</p>
                  </div>
                </div>
              </div>

              <div className="agent-card-footer" style={{ marginTop: '16px' }}>
                <button 
                  className="btn-agent-chat"
                  onClick={() => handleStartChatWithAgent(agent)}
                  style={{ flex: 1.2 }}
                >
                  <MessageSquare size={16} /> Trò chuyện
                </button>
                {missingSkills.length > 0 && onOpenStore ? (
                  <button 
                    className="btn-agent-profile"
                    onClick={() => onOpenStore()}
                    style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a', fontWeight: '600' }}
                    title="Mở Store để mua Skill tương ứng"
                  >
                    🛒 Mua Skill
                  </button>
                ) : (
                  <button 
                    className="btn-agent-profile"
                    onClick={() => onSelectAgent(agent)}
                  >
                    Hồ sơ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
