import React, { useState } from 'react';
import { 
  MessageSquare, 
  Grid2X2, 
  ShoppingCart, 
  FolderKanban, 
  Files, 
  History, 
  Settings, 
  UserRound,
  Sparkles,
  Search,
  Bell,
  ChevronRight,
  Flame,
  Package,
  Building2,
  Cpu,
  Scale,
  FileText,
  BarChart3,
  X,
  ShieldCheck,
  ChevronDown,
  LogOut,
  LogIn,
  User
} from 'lucide-react';
import { AGENTS_DATA } from '../data/agentsData';

export default function Sidebar({ 
  currentTab, 
  setTab, 
  onOpenSkillManager, 
  onOpenAccountModal,
  skills = [],
  activeSkill = {},
  onSelectSkill,
  onSelectAgent,
  onOpenStore,
  searchTerm = '',
  setSearchTerm,
  user = { name: 'QUANG NHỰT TRÍ', email: 'triqnnamabank@gmail.com', avatar: '/assets/user_avatar.png', role: 'Chủ sở hữu', plan: 'Gói Pro Vĩnh Viễn', isLoggedIn: true },
  onOpenAuthModal,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickSkills, setShowQuickSkills] = useState(true);
  const [showAgents, setShowAgents] = useState(true);

  const navItems = [
    { id: 'chat', label: 'Chat với Trí AI', icon: MessageSquare },
    { id: 'skills', label: 'Kho Skill', icon: Grid2X2 },
    { id: 'agents', label: 'Agent chuyên ngành', icon: UserRound },
    { id: 'store', label: 'Cửa hàng Skill', icon: ShoppingCart },
    { id: 'projects', label: 'Dự án của tôi', icon: FolderKanban },
    { id: 'files', label: 'Tài liệu & File', icon: Files },
    { id: 'history', label: 'Lịch sử hội thoại', icon: History },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  // 8 Skill Data chuẩn khớp màu sắc và icon 3D
  const default8Skills = [
    { id: 'mua-sam', name: 'Mua sắm', color: 'orange', icon: ShoppingCart },
    { id: 'quan-tri-tai-san', name: 'Quản trị tài sản', color: 'purple', icon: Package },
    { id: 'van-hanh-toa-nha', name: 'Vận hành tòa nhà', color: 'blue', icon: Building2 },
    { id: 'mep', name: 'MEP', color: 'green', icon: Cpu },
    { id: 'pccc', name: 'PCCC', color: 'red', icon: Flame },
    { id: 'phap-ly', name: 'Pháp lý', color: 'gold', icon: Scale },
    { id: 'ho-so-nghiem-thu', name: 'Hồ sơ nghiệm thu', color: 'cyan', icon: FileText },
    { id: 'phan-tich-chi-phi', name: 'Phân tích chi phí', color: 'pink', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar unified-sidebar">
      {/* 1. BRAND HEADER (Đã dọn dẹp 2 icon để chuyển trọn vẹn sang góc phải trên cùng) */}
      <div className="sidebar-top-bar">
        <div 
          className="brand" 
          onClick={() => setTab('chat')} 
          style={{ cursor: 'pointer' }} 
          title="Về trang Chat chính"
        >
          <div className="brand-logo-wrap">
            <img 
              src="/assets/brand_logo.png" 
              alt="Trí AI" 
              className="brand-img" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="brand-fallback-brain">🧠</span>';
              }} 
            />
          </div>
          <div className="brand-text">
            <div className="brand-title">TRÍ AI</div>
            <div className="brand-subtitle">Thư viện năng lực AI</div>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL SEARCH INPUT */}
      <div className="sidebar-search-container">
        <Search size={15} className="search-icon-gray" />
        <input 
          type="text" 
          value={searchTerm || ''} 
          onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
          placeholder="Tìm Skill, Agent, tài liệu..." 
          className="sidebar-search-input"
        />
        {searchTerm && (
          <button className="clear-search-btn" onClick={() => setSearchTerm && setSearchTerm('')}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Scrollable Middle Container */}
      <div className="sidebar-scrollable-body">
        {/* 3. SKILL ĐANG HOẠT ĐỘNG (ACTIVE SKILL CARD) */}
        <div className="sidebar-section-box">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Skill đang hoạt động</span>
            <button 
              type="button" 
              className="sidebar-link-btn" 
              onClick={onOpenSkillManager}
              title="Mở Quản lý Skill"
            >
              Quản lý
            </button>
          </div>

          <div 
            className="sidebar-active-skill-card"
            onClick={onOpenSkillManager}
            title="Bấm để xem và quản lý Skill đang dùng"
          >
            <div className="sidebar-flame-icon-box">
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

            <div className="sidebar-active-content">
              <div className="sidebar-active-name-row">
                <b className="sidebar-active-name">{activeSkill.name || 'PCCC'}</b>
                <span className="sidebar-green-badge">
                  <span className="green-bullet">●</span> Đang dùng
                </span>
              </div>
              <p className="sidebar-active-desc">
                {activeSkill.desc || 'Phân tích, kiểm tra, tư vấn, nghiệm thu hệ thống chuyên môn'}
              </p>
            </div>
            <ChevronRight size={15} className="sidebar-active-chevron" />
          </div>
        </div>

        {/* 4. NAVIGATION MENU (DANH MỤC TRANG CHÍNH) */}
        <div className="sidebar-section-box">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Danh mục chính</span>
          </div>

          <nav className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setTab(item.id)}
                  title={item.label}
                >
                  <Icon size={18} className="nav-icon" />
                  <span>{item.label}</span>
                  {item.id === 'skills' && (
                    <span 
                      className="nav-badge-load" 
                      title="Bấm để nạp thêm Skill mới"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTab('skills');
                        onOpenSkillManager();
                      }}
                    >
                      +Nạp
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 5. KHO SKILL NHANH (LƯỚI 8 SKILL TIÊU BIỂU) */}
        <div className="sidebar-section-box">
          <div 
            className="sidebar-section-header clickable-header"
            onClick={() => setShowQuickSkills(!showQuickSkills)}
          >
            <div className="sidebar-section-title-wrap">
              <span className="red-vertical-bar"></span>
              <span className="sidebar-section-title">Kho Skill nhanh</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button 
                type="button" 
                className="sidebar-link-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSkillManager();
                }}
              >
                Xem tất cả
              </button>
              <ChevronDown size={14} className={`header-chevron ${showQuickSkills ? 'open' : ''}`} />
            </div>
          </div>

          {showQuickSkills && (
            <div className="sidebar-skills-grid">
              {default8Skills.map((s) => {
                const isSelected = activeSkill.id === s.id;
                const Icon = s.icon;
                return (
                  <div 
                    key={s.id} 
                    className={`sidebar-skill-tile ${s.color} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      const matched = skills.find(item => item.id === s.id) || s;
                      if (onSelectSkill) onSelectSkill(matched);
                    }}
                    title={`Chọn ${s.name}`}
                  >
                    <Icon size={18} />
                    <span className="tile-text">{s.name}</span>
                    {isSelected && <span className="tile-dot-active" />}
                  </div>
                );
              })}

              {/* Quick switch to KOL Thời Trang */}
              <button 
                type="button"
                className="sidebar-kol-pill"
                onClick={() => {
                  const kol = skills.find(item => item.id === 'kol-thoi-trang');
                  if (kol && onSelectSkill) onSelectSkill(kol);
                }}
                title="Kích hoạt Skill KOL Thời Trang (Ý Ngọc)"
              >
                <span>✨ KOL Thời Trang (Ý Ngọc Lookbook)</span>
                {activeSkill.id === 'kol-thoi-trang' && <span className="kol-using-tag">✓ Đang dùng</span>}
              </button>
            </div>
          )}
        </div>

        {/* 6. AGENT ĐỒNG HÀNH (4 CHUYÊN GIA AI) */}
        <div className="sidebar-section-box">
          <div 
            className="sidebar-section-header clickable-header"
            onClick={() => setShowAgents(!showAgents)}
          >
            <span className="sidebar-section-title">Agent đồng hành</span>
            <ChevronDown size={14} className={`header-chevron ${showAgents ? 'open' : ''}`} />
          </div>

          {showAgents && (
            <div className="sidebar-agents-list">
              {AGENTS_DATA.map((agent) => (
                <div 
                  key={agent.id} 
                  className="sidebar-agent-row"
                  onClick={() => onSelectAgent && onSelectAgent(agent)}
                  title={`Trao đổi cùng ${agent.name}`}
                >
                  <img src={agent.avatar} alt={agent.name} className="sidebar-agent-avatar" />
                  <div className="sidebar-agent-info">
                    <b className="sidebar-agent-name">{agent.name}</b>
                    <span className="sidebar-agent-role">{agent.role}</span>
                  </div>
                  <ChevronRight size={14} className="agent-row-arrow" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. FOOTER: USER PROFILE & USAGE METER */}
      <div className="sidebar-footer">
        {/* User Profile Card */}
        <div 
          className="user-profile-card clickable-profile"
          onClick={() => {
            if (user.isLoggedIn) {
              onOpenAccountModal();
            } else {
              if (onOpenAuthModal) onOpenAuthModal();
            }
          }}
          title={user.isLoggedIn ? "Bấm để xem thông tin bản quyền & nâng cấp" : "Bấm để đăng nhập bằng Gmail"}
        >
          <div className="user-avatar-circle">
            {user.isLoggedIn ? (
              <img 
                src={user.avatar || "/assets/user_avatar.png"} 
                alt={user.name} 
                className="user-photo-img" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="avatar-fallback-initials">QT</span>';
                }}
              />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{user.isLoggedIn ? user.name : 'Chưa đăng nhập'}</div>
            <div className="user-role">{user.isLoggedIn ? (user.email || user.role || 'Chủ sở hữu') : 'Đăng nhập Gmail'}</div>
          </div>
          {user.isLoggedIn ? (
            <span className="pro-badge">Gói Pro</span>
          ) : (
            <span className="pro-badge login-badge">Đăng nhập</span>
          )}
        </div>

        {/* Usage Meter */}
        <div 
          className="usage-box clickable-usage"
          onClick={onOpenAccountModal}
          title="Bấm để xem chi tiết sử dụng tài nguyên AI"
        >
          <div className="usage-header">
            <span>Lượt dùng tháng này</span>
          </div>
          <div className="usage-progress-bar">
            <div className="usage-progress-fill" style={{ width: '32%' }}></div>
          </div>
          <div className="usage-numbers">
            <span>320 / 1.000</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
