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
  onOpenAdminApproval,
  pendingApprovalCount = 0,
  skills = [],
  activeSkill = {},
  onSelectSkill,
  onSelectAgent,
  onOpenStore,
  searchTerm = '',
  setSearchTerm,
  user = { name: 'QUANG NHỰT TRÍ', email: 'triqnnamabank@gmail.com', avatar: '/assets/user_avatar.png', role: 'Chủ sở hữu', plan: 'Gói Pro Vĩnh Viễn', isLoggedIn: true },
  isAdmin = true,
  onOpenAuthModal,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

            {/* NÚT DUYỆT CẤP BẢN QUYỀN RIÊNG CHO MASTER ADMIN triqnnamabank@gmail.com */}
            {isAdmin && (
              <button
                type="button"
                className="nav-btn admin-approval-nav-btn"
                onClick={onOpenAdminApproval}
                title="Mở Trung Tâm Phê Duyệt & Cấp Bản Quyền Khách Hàng"
              >
                <span className="admin-nav-crown-icon">👑</span>
                <span className="admin-nav-btn-text">Duyệt Cấp Quyền</span>
                {pendingApprovalCount > 0 ? (
                  <span className="admin-pending-counter-badge" title={`${pendingApprovalCount} yêu cầu đang chờ duyệt`}>
                    {pendingApprovalCount}
                  </span>
                ) : (
                  <span className="admin-status-dot-ok" title="Đã duyệt toàn bộ">●</span>
                )}
              </button>
            )}
          </nav>
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
