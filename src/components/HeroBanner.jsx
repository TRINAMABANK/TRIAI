import React, { useState, useEffect } from 'react';
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
  X,
  ShoppingCart,
  Clock
} from 'lucide-react';
import { api } from '../api/client';

export default function HeroBanner({ 
  activeTab = 'chat',
  onChangeTab,
  onTriggerVoice, 
  onTriggerFileUpload, 
  onTriggerSkillSelect, 
  onScrollToResult,
  onFocusChat,
  user = { isLoggedIn: false },
  activeSkill = {},
  isAdmin = false,
  trialStatus = null,
  pendingApprovalCount = 0,
  onOpenAdminApproval,
  onOpenStore,
  onOpenSkillManager,
  onOpenAccountModal,
  onOpenAuthModal,
  onLogout
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Danh sách thông báo thực tế từ Backend dựa trên quyền tài khoản (Admin vs Khách hàng)
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user?.isLoggedIn) {
      setNotifications([]);
      return;
    }

    try {
      const res = await api.notifications.getAll().catch(() => null);
      if (res && res.notifications && Array.isArray(res.notifications) && res.notifications.length > 0) {
        const formatted = res.notifications.map(n => ({
          id: n.id,
          title: n.title,
          content: n.message,
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong',
          isRead: Boolean(n.is_read),
          type: n.type,
          resourceId: n.resource_id,
          resourceType: n.resource_type
        }));
        setNotifications(formatted);
      } else {
        if (isAdmin) {
          setNotifications([
            {
              id: 'def_admin_1',
              title: '👑 Trung tâm Quản trị Admin:',
              content: 'Hệ thống đang hoạt động ổn định và sẵn sàng tiếp nhận các đơn hàng mua Skill mới từ khách hàng.',
              time: 'Hôm nay',
              isRead: false
            }
          ]);
        } else {
          setNotifications([
            {
              id: 'def_user_1',
              title: '✨ Chào mừng bạn đến với TRÍ AI:',
              content: 'Tài khoản của bạn đã được kích hoạt. Hãy khám phá 33 Kỹ năng chuyên môn và các Trợ lý AI chuyên ngành.',
              time: 'Hôm nay',
              isRead: false
            }
          ]);
        }
      }
    } catch (e) {
      console.warn('Error loading notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.isLoggedIn, user?.email, isAdmin]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (item) => {
    const id = typeof item === 'object' ? item.id : item;
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );

    try {
      if (typeof id === 'string' && !id.startsWith('def_')) {
        await api.notifications.markRead(id).catch(() => null);
      }
    } catch (e) {}

    // Nếu là Admin và bấm vào thông báo đơn hàng -> Mở ngay Trung tâm duyệt đơn
    if (isAdmin && onOpenAdminApproval && typeof item === 'object') {
      setShowNotifications(false);
      onOpenAdminApproval();
    }
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

  const formatTrialTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

        {/* Top Row: AI Brand (Trái) + CỬA HÀNG SKILL (GIỎ HÀNG) + Chuông thông báo + Account Avatar (Phải) */}
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
                  {!isAdmin ? (trialStatus?.hasTrial ? 'DÙNG THỬ 15 PHÚT' : 'BẢN QUYỀN ĐÃ MỞ') : 'PRO B2B'}
                </span>
              </div>
              <p className="banner-desc-line">
                {!isAdmin && activeSkill.desc 
                  ? activeSkill.desc 
                  : 'Hệ sinh thái tự động hóa quy trình nghiệp vụ & hỗ trợ quyết định'}
              </p>
            </div>
          </div>

          {/* Top-Right Header Actions: Cửa hàng Skill (Giỏ hàng) TRƯỚC Chuông thông báo & Account Avatar */}
          <div className="banner-top-right-actions">

            {/* -1. NÚT DUYỆT CẤP QUYỀN (CHỈ DÀNH CHO ADMIN triqnnamabank@gmail.com) */}
            {isAdmin && (
              <div className="header-admin-approval-wrapper">
                <button
                  type="button"
                  className="header-admin-approval-button"
                  onClick={onOpenAdminApproval}
                  title="Trung Tâm Phê Duyệt & Cấp Bản Quyền Khách Hàng (triqnnamabank@gmail.com)"
                >
                  <span className="admin-btn-crown">👑</span>
                  <span className="header-admin-label">Duyệt Cấp Quyền</span>
                  {pendingApprovalCount > 0 && (
                    <span className="header-admin-pending-badge">
                      {pendingApprovalCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* 0. LIVE TRIAL COUNTDOWN BADGE (NẾU ĐANG DÙNG THỬ) */}
            {trialStatus?.hasTrial && (
              <div 
                className={`header-trial-badge ${trialStatus.isExpired ? 'expired' : 'active'}`}
                onClick={onOpenStore}
                title={trialStatus.isExpired ? "Hết hạn dùng thử. Bấm để nộp tiền mua bản quyền" : "Thời gian dùng thử 15 phút còn lại. Bấm để mua bản quyền chính thức"}
              >
                <Clock size={14} className="trial-clock-icon" />
                <span className="trial-time-txt">
                  {trialStatus.isExpired ? '⏰ Hết hạn dùng thử' : `⏳ Dùng thử: ${formatTrialTime(trialStatus.remainingSeconds)}`}
                </span>
                {trialStatus.isExpired ? (
                  <span className="trial-upgrade-btn">Mua ngay</span>
                ) : (
                  <span className="trial-pulse-dot" />
                )}
              </div>
            )}

            {/* 1. NÚT CỬA HÀNG SKILL (HÌNH GIỎ HÀNG) TRƯỚC BIỂU TƯỢNG THÔNG BÁO */}
            <div className="header-store-wrapper">
              <button 
                type="button"
                className="header-store-button"
                onClick={onOpenStore}
                title="Mở Cửa Hàng Skill để chọn dùng thử 15 phút hoặc mua bản quyền"
              >
                <ShoppingCart size={18} />
                <span className="header-store-label">Cửa Hàng Skill</span>
              </button>
            </div>
            
            {/* 2. CHUÔNG THÔNG BÁO (Hình 1) */}
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
                        onClick={() => handleMarkAsRead(item)}
                        title={item.isRead ? "Đã đọc" : "Bấm vào để xem chi tiết"}
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

            {/* 3. BIỂU TƯỢNG ACCOUNT AVATAR & NÚT ĐĂNG NHẬP / ĐĂNG KÝ */}
            {!user?.isLoggedIn ? (
              <div className="header-auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-header-login"
                  onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #2563eb',
                    background: '#ffffff',
                    color: '#2563eb',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <LogIn size={14} /> Đăng nhập
                </button>
                <button
                  type="button"
                  className="btn-header-register"
                  onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Đăng ký
                </button>
              </div>
            ) : (
              <div className="header-avatar-wrapper">
                <div 
                  className="header-avatar-circle-btn is-auth"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  title={`Tài khoản: ${user.name}`}
                >
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
                </div>

                {/* Dropdown Menu tài khoản */}
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
                        <div className="popup-user-email">{user.email}</div>
                      </div>
                      <button 
                        type="button" 
                        className="notif-close-x-btn" 
                        onClick={() => setShowProfileMenu(false)}
                        title="Đóng"
                        style={{ marginLeft: 'auto' }}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="popup-user-plan">
                      <ShieldCheck size={13} /> {user.plan || (isAdmin ? 'Gói Quản Trị Hệ Thống (Master)' : 'Gói Khách Hàng')}
                    </div>

                    <hr />

                    {isAdmin && (
                      <button 
                        onClick={() => { 
                          if (onOpenAdminApproval) onOpenAdminApproval(); 
                          setShowProfileMenu(false); 
                        }}
                        style={{ color: '#2563eb', fontWeight: '700' }}
                      >
                        👑 Trung Tâm Phê Duyệt & Cấp Quyền
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => { if (onOpenSkillManager) onOpenSkillManager(); setShowProfileMenu(false); }}>
                        ⚙ Quản lý &amp; Nạp Skill
                      </button>
                    )}
                    <button onClick={() => { if (onOpenAccountModal) onOpenAccountModal(); setShowProfileMenu(false); }}>
                      💎 Thông tin bản quyền
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
            )}

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
