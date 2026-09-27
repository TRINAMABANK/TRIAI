import React, { useState } from 'react';
import { 
  MessageSquare, 
  Mic, 
  Paperclip, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Cpu,
  Bell,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
  X
} from 'lucide-react';

export default function HeroBanner({ 
  activeTab = 'chat',
  onChangeTab,
  onTriggerVoice, 
  onTriggerFileUpload, 
  onTriggerSkillSelect, 
  onScrollToResult,
  onFocusChat,
  user = { 
    name: 'QUANG NHỰT TRÍ', 
    email: 'triqnnamabank@gmail.com', 
    avatar: '/assets/user_avatar.png', 
    role: 'Chủ sở hữu', 
    plan: 'Gói Pro Vĩnh Viễn', 
    isLoggedIn: true 
  },
  activeSkill = {},
  isAdmin = true,
  onOpenSkillManager,
  onOpenAccountModal,
  onOpenAuthModal,
  onLogout
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Danh sách thông báo tương tác (chưa đọc: chữ in đậm, đọc rồi: chữ thường, click vào là đọc xong)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Rà soát hồ sơ PCCC cơ sở 2:',
      content: 'Hệ thống tự động đã đối chiếu 100% biên bản thử nghiệm và sơ đồ hoàn công.',
      time: '10:24',
      isRead: false
    },
    {
      id: 2,
      title: 'Cập nhật Skill:',
      content: 'Hệ sinh thái Trí AI đã bổ sung tiêu chuẩn QCVN 06:2026/BXD mới nhất.',
      time: '09:15',
      isRead: false
    },
    {
      id: 3,
      title: 'Bản quyền Pro:',
      content: `Tài khoản ${user.name || 'QUANG NHỰT TRÍ'} đang hoạt động với đầy đủ quyền năng Enterprise.`,
      time: 'Hôm qua',
      isRead: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(item => item.id === id ? { ...item, isRead: true } : item)
    );
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const toggleSound = (text = 'Anh cứ nói, Trí AI sẽ lo phần còn lại.') => {
    if (!isPlayingAudio && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
      showToast('Đang phát giọng nói Trí AI...');
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      showToast('Đã dừng phát giọng nói');
    }
  };

  const handleTabClick = (tabKey, title) => {
    if (onChangeTab) {
      onChangeTab(tabKey);
    }
    showToast(`Đã chuyển sang: ${title}`);
    
    if (tabKey === 'chat' && onFocusChat) onFocusChat();
    if (tabKey === 'voice' && onTriggerVoice) onTriggerVoice();
    if (tabKey === 'file' && onTriggerFileUpload) onTriggerFileUpload();
    if (tabKey === 'skill' && onTriggerSkillSelect) onTriggerSkillSelect();
    if (tabKey === 'result' && onScrollToResult) onScrollToResult();
  };

  const tabs = [
    { key: 'chat', label: 'Chat văn bản', icon: MessageSquare },
    { key: 'voice', label: 'Nói giọng nói', icon: Mic },
    { key: 'file', label: 'Phân tích file', icon: Paperclip },
    { key: 'skill', label: 'Sử dụng Skill', icon: Sparkles },
    { key: 'result', label: 'Kết quả thực tế', icon: CheckCircle2 }
  ];

  return (
    <div className="modern-hero-banner-wrap" id="hero-banner-cot2">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="banner-toast-badge">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Banner Container */}
      <div className="modern-hero-banner">
        {/* Glow Ambient Lights */}
        <div className="banner-glow-ambient glow-left" />
        <div className="banner-glow-ambient glow-right" />

        {/* Top Row: AI Brand (Trái) + 2 TÍNH NĂNG CHUẨN MẪU (Phải): Chuông thông báo & Account Avatar */}
        <div className="banner-top-row">
          
          {/* Brand Left Unit */}
          <div className="banner-brand-unit">
            <div 
              className="banner-brain-badge" 
              onClick={() => toggleSound(`Xin chào ${user.name || 'anh Trí'}! ${activeSkill.name ? 'Skill ' + activeSkill.name : 'Trí AI'} đã sẵn sàng phục vụ.`)}
              title="Bấm để nghe Trí AI chào mừng"
            >
              <Cpu size={22} className="brain-icon-glow" />
              <span className="brain-pulse-ring" />
            </div>
            <div className="banner-brand-texts">
              <div className="banner-title-line">
                <span className="b-title">TRÍ AI</span>
                <span className="b-subtitle">
                  {!isAdmin && activeSkill.name ? activeSkill.name : 'Trợ lý AI của bạn'}
                </span>
                <span className="b-version-tag">
                  {!isAdmin ? 'ĐÃ MỞ KHÓA' : 'PRO B2B'}
                </span>
              </div>
              <p className="banner-desc-line">
                {!isAdmin && activeSkill.desc 
                  ? activeSkill.desc 
                  : 'Hệ sinh thái tự động hóa quy trình nghiệp vụ & hỗ trợ quyết định'}
              </p>
            </div>
          </div>

          {/* Top-Right Header Actions: Chuông thông báo & Account Avatar */}
          <div className="banner-top-right-actions">
            
            {/* 1. CHUÔNG THÔNG BÁO (Hình 1) */}
            <div className="header-bell-wrapper">
              <button 
                type="button"
                className="header-bell-button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                title="Thông báo hệ thống"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="header-bell-badge">{unreadCount}</span>
                )}
              </button>

              {/* Popup thông báo: Có nút CLOSE X, bỏ chữ "Đã đọc", chưa đọc in đậm, bấm vào là đọc xong */}
              {showNotifications && (
                <div className="notif-popup-card header-notif-dropdown">
                  <div className="notif-popup-head">
                    <div className="notif-head-title-wrap">
                      <b>Thông báo hệ thống</b>
                      {unreadCount > 0 && (
                        <span className="notif-unread-tag">{unreadCount} mới</span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      className="notif-close-x-btn" 
                      onClick={() => setShowNotifications(false)}
                      title="Đóng thông báo (CLOSE)"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="notif-popup-body">
                    {notifications.map((item) => (
                      <div 
                        key={item.id}
                        className={`notif-line ${item.isRead ? 'is-read' : 'is-unread'}`}
                        onClick={() => handleMarkAsRead(item.id)}
                        title={item.isRead ? "Đã đọc" : "Bấm vào để đánh dấu đã đọc"}
                      >
                        <div className="notif-line-top">
                          <b className="notif-item-title">{item.title}</b>
                          {!item.isRead && <span className="notif-dot-unread" />}
                          <span className="notif-time-tag">{item.time}</span>
                        </div>
                        <p className="notif-item-content">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. BIỂU TƯỢNG ACCOUNT AVATAR (Hình 1) */}
            <div className="header-avatar-wrapper">
              <div 
                className={`header-avatar-circle-btn ${user.isLoggedIn ? 'is-auth' : 'is-guest'}`}
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                title={user.isLoggedIn ? `Tài khoản: ${user.name}` : 'Bấm để đăng nhập'}
              >
                {user.isLoggedIn ? (
                  <>
                    <img 
                      src={user.avatar || "/assets/user_avatar.png"} 
                      alt={user.name} 
                      className="header-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span class="avatar-fallback-initials">QT</span>';
                      }}
                    />
                    <span className="header-online-status-dot" />
                  </>
                ) : (
                  <User size={18} className="guest-icon" />
                )}
              </div>

              {/* Dropdown Menu tài khoản: Nền trắng, chữ đen */}
              {showProfileMenu && (
                <div className="profile-popup-menu header-profile-dropdown">
                  <div className="popup-user-card-head">
                    <div className="popup-avatar-small">
                      <img 
                        src={user.avatar || "/assets/user_avatar.png"} 
                        alt={user.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="popup-user-meta">
                      <div className="popup-user-name">{user.name}</div>
                      <div className="popup-user-email">{user.email || 'triqnnamabank@gmail.com'}</div>
                    </div>
                    <button 
                      type="button" 
                      className="notif-close-x-btn" 
                      onClick={() => setShowProfileMenu(false)}
                      title="Đóng (CLOSE)"
                      style={{ marginLeft: 'auto' }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="popup-user-plan">
                    <ShieldCheck size={13} /> {user.plan || 'Gói Pro Vĩnh Viễn'}
                  </div>

                  <hr />

                  <button onClick={() => { if (onOpenSkillManager) onOpenSkillManager(); setShowProfileMenu(false); }}>
                    ⚙ Quản lý &amp; Nạp Skill
                  </button>
                  <button onClick={() => { if (onOpenAccountModal) onOpenAccountModal(); setShowProfileMenu(false); }}>
                    💎 Thông tin bản quyền
                  </button>
                  <button onClick={() => { if (onOpenAuthModal) onOpenAuthModal(); setShowProfileMenu(false); }}>
                    🔄 Đổi tài khoản Gmail khác
                  </button>
                  <button 
                    className="btn-popup-logout"
                    onClick={() => { if (onLogout) onLogout(); setShowProfileMenu(false); }}
                  >
                    <LogOut size={14} /> Đăng xuất tài khoản
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Bottom Row: 5 Action Tabs Bar */}
        <div className="banner-action-tabs-bar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                type="button"
                key={tab.key}
                className={`banner-action-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key, tab.label)}
                title={tab.label}
              >
                <Icon size={15} className="tab-btn-icon" />
                <span className="tab-btn-label">{tab.label}</span>
                {isActive && <span className="tab-btn-glow-bar" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
