import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  ChevronRight, 
  Flame, 
  ShoppingCart, 
  Package, 
  Building2, 
  Cpu, 
  Scale, 
  FileText, 
  BarChart3,
  X,
  ShieldCheck
} from 'lucide-react';
import { AGENTS_DATA } from '../data/agentsData';

export default function RightSidebar({ 
  skills, 
  activeSkill, 
  onSelectSkill, 
  onOpenSkillManager, 
  onSelectAgent, 
  onOpenStore,
  searchTerm,
  setSearchTerm
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // 8 Skill Data chuẩn khớp màu sắc và icon 3D
  const default8Skills = [
    { id: 'mua-sam', name: 'Mua sắm', color: 'orange', img: '/assets/skill_1_muasam.png', icon: ShoppingCart },
    { id: 'quan-tri-tai-san', name: 'Quản trị tài sản', color: 'purple', img: '/assets/skill_2_taisan.png', icon: Package },
    { id: 'van-hanh-toa-nha', name: 'Vận hành tòa nhà', color: 'blue', img: '/assets/skill_3_toanha.png', icon: Building2 },
    { id: 'mep', name: 'MEP', color: 'green', img: '/assets/skill_4_mep.png', icon: Cpu },
    { id: 'pccc', name: 'PCCC', color: 'red', img: '/assets/skill_5_pccc.png', icon: Flame },
    { id: 'phap-ly', name: 'Pháp lý', color: 'gold', img: '/assets/skill_6_phaply.png', icon: Scale },
    { id: 'ho-so-nghiem-thu', name: 'Hồ sơ nghiệm thu', color: 'cyan', img: '/assets/skill_7_hosonghiemthu.png', icon: FileText },
    { id: 'phan-tich-chi-phi', name: 'Phân tích chi phí', color: 'pink', img: '/assets/skill_8_chiphi.png', icon: BarChart3 },
  ];

  // 4 Cửa hàng Skill chuẩn 4 cột ngang
  const storeCards = [
    { id: 'store-mua-sam', name: 'Skill Mua sắm', price: '99.000đ/tháng', color: 'orange', icon: ShoppingCart },
    { id: 'store-pccc', name: 'Skill PCCC', price: '199.000đ/tháng', color: 'red', icon: Flame },
    { id: 'store-toanha', name: 'Skill Vận hành tòa nhà', price: '299.000đ/tháng', color: 'blue', icon: Building2 },
    { id: 'store-phaply', name: 'Skill Pháp lý', price: '199.000đ/tháng', color: 'gold', icon: Scale },
  ];

  return (
    <aside className="right-sidebar-panel">
      {/* 1. TOP HEADER (NẰM Ở ĐẦU CỘT PHẢI CHUẨN THIẾT KẾ MẪU) */}
      <div className="right-top-header">
        <div className="header-search-pill">
          <Search size={16} className="search-icon-gray" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm Skill, Agent, tài liệu..." 
            className="header-search-field"
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Bell with red badge 3 */}
        <div className="header-bell-wrapper">
          <button 
            className="header-bell-pill"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showNotifications) setUnreadCount(0);
            }}
            title="3 thông báo mới"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="bell-red-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notif-popup-card">
              <div className="notif-popup-head">
                <b>Thông báo hệ thống</b>
                <button onClick={() => setUnreadCount(0)}>Đã đọc</button>
              </div>
              <div className="notif-popup-body">
                <div className="notif-line">
                  <b>Rà soát hồ sơ PCCC cơ sở 2:</b>
                  <p>Hệ thống tự động đã đối chiếu 100% biên bản thử nghiệm và sơ đồ hoàn công.</p>
                </div>
                <div className="notif-line">
                  <b>Cập nhật Skill:</b>
                  <p>Hệ sinh thái Trí AI đã bổ sung tiêu chuẩn QCVN 06:2026/BXD mới nhất.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Executive User Avatar Photo */}
        <div className="header-avatar-circle" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <img 
            src="/assets/user_avatar.png" 
            alt="Anh Trí" 
            className="user-photo-img" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span class="avatar-fallback-initials">AT</span>';
            }}
          />

          {showProfileMenu && (
            <div className="profile-popup-menu">
              <div className="popup-user-name">Anh Trí</div>
              <div className="popup-user-plan"><ShieldCheck size={12} /> Gói Pro B2B</div>
              <hr />
              <button onClick={onOpenSkillManager}>⚙ Quản lý & Nạp Skill</button>
              <button onClick={() => alert('Phiên bản Trí AI v1.0. Bản quyền thuộc về Anh Trí.')}>📜 Bản quyền thương mại</button>
            </div>
          )}
        </div>
      </div>

      <div className="right-widgets-body">
        {/* 2. SKILL ĐANG HOẠT ĐỘNG */}
        <section className="widget-box">
          <div className="widget-head">
            <span className="widget-title-main">Skill đang hoạt động</span>
            <button className="widget-action-link" onClick={onOpenSkillManager}>
              Quản lý
            </button>
          </div>

          <div 
            className="active-skill-card"
            onClick={onOpenSkillManager}
            title="Bấm để xem và quản lý Skill"
          >
            <div className="active-flame-icon-box">
              <img 
                src="/assets/pccc_badge.png" 
                alt="PCCC" 
                className="flame-badge-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '🔥';
                }}
              />
            </div>

            <div className="active-skill-content">
              <div className="active-title-row">
                <b className="active-skill-name">{activeSkill.name || 'PCCC'}</b>
                <span className="active-green-badge">
                  <span className="green-bullet">●</span> Đang sử dụng
                </span>
              </div>
              <p className="active-skill-desc">
                {activeSkill.desc || 'Phân tích, kiểm tra, tư vấn, lập hồ sơ, nghiệm thu hệ thống PCCC'}
              </p>
            </div>

            <div className="active-skill-chevron">
              <ChevronRight size={18} />
            </div>
          </div>
        </section>

        {/* 3. KHO SKILL CỦA BẠN (LƯỚI 4x2 ĐỐI XỨNG CỰC ĐẸP) */}
        <section className="widget-box">
          <div className="widget-head">
            <div className="widget-title-with-bar">
              <span className="red-vertical-bar"></span>
              <span className="widget-title-main">Kho Skill của bạn</span>
            </div>
            <button className="widget-action-link" onClick={onOpenSkillManager}>
              Xem tất cả
            </button>
          </div>

          <div className="skills-8-grid">
            {default8Skills.map((s) => {
              const isSelected = activeSkill.id === s.id;
              const Icon = s.icon;
              return (
                <div 
                  key={s.id} 
                  className={`skill-tile-card ${s.color} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    const matched = skills.find(item => item.id === s.id) || s;
                    onSelectSkill(matched);
                  }}
                  title={`Bấm để chọn ${s.name}`}
                >
                  <div className="skill-tile-icon-wrap">
                    <Icon size={24} />
                  </div>
                  <div className="skill-tile-label">{s.name}</div>
                  {isSelected && <span className="tile-check-badge">✓</span>}
                </div>
              );
            })}
          </div>

          {/* Quick Switch Pill cho Skill mới: KOL Thời Trang */}
          <div style={{ marginTop: '8px' }}>
            <button 
              className="quick-kol-switch-btn"
              onClick={() => {
                const kol = skills.find(item => item.id === 'kol-thoi-trang');
                if (kol) onSelectSkill(kol);
              }}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '8px',
                border: activeSkill.id === 'kol-thoi-trang' ? '1px solid #be185d' : '1px solid #fbcfe8',
                background: activeSkill.id === 'kol-thoi-trang' ? '#db2777' : '#fdf2f8',
                color: activeSkill.id === 'kol-thoi-trang' ? '#ffffff' : '#be185d',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              title="Kích hoạt Skill KOL Thời Trang"
            >
              <span>✨ Skill mới nạp: KOL Thời Trang (Ý Ngọc Lookbook)</span>
              {activeSkill.id === 'kol-thoi-trang' && <span style={{ fontWeight: 800 }}>✓ Đang dùng</span>}
            </button>
          </div>
        </section>

        {/* 4. AGENT CHUYÊN NGÀNH (4 CHÂN DUNG NGƯỜI THẬT SẮC NÉT) */}
        <section className="widget-box">
          <div className="widget-head">
            <span className="widget-title-main">Agent chuyên ngành</span>
            <button className="widget-action-link" onClick={() => onSelectAgent(AGENTS_DATA[0])}>
              Xem tất cả
            </button>
          </div>

          <div className="agents-4-cards-row">
            {AGENTS_DATA.map((agent) => (
              <div 
                key={agent.id} 
                className="agent-mini-card"
                onClick={() => onSelectAgent(agent)}
                title={`Bấm để trao đổi với ${agent.name}`}
              >
                <div className="agent-photo-top">
                  <img src={agent.avatar} alt={agent.name} className="agent-img-fluid" />
                </div>
                <div className="agent-details-bottom">
                  <b className="agent-title-text">{agent.name}</b>
                  <p className="agent-subtitle-text">{agent.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. CỬA HÀNG SKILL (4 CỘT NGANG CHUẨN THIẾT KẾ MẪU) */}
        <section className="widget-box">
          <div className="widget-head">
            <span className="widget-title-main">Cửa hàng Skill</span>
            <button className="widget-action-link" onClick={onOpenStore}>
              Xem tất cả
            </button>
          </div>

          <div className="store-4-horizontal-row">
            {storeCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={`store-column-card ${item.color}`}>
                  <div className="store-icon-top">
                    <Icon size={24} />
                  </div>
                  <b className="store-col-title">{item.name}</b>
                  <div className="store-col-price">{item.price}</div>
                  <button 
                    className="store-col-btn"
                    onClick={() => onOpenStore(item)}
                  >
                    Chi tiết
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
