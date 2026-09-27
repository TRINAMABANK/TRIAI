import React, { useState } from 'react';
import { Search, Bell, Sparkles, X, Check, ShieldCheck } from 'lucide-react';

export default function Header({ searchTerm, setSearchTerm, onOpenSkillManager }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Hồ sơ PCCC cơ sở 2 hoàn tất rà soát',
      time: '10 phút trước',
      type: 'success',
      desc: 'Báo cáo kiểm tra và biên bản thử nghiệm hệ thống báo cháy đã sẵn sàng tải về.'
    },
    {
      id: 2,
      title: 'Cập nhật QCVN 06:2026/BXD về PCCC',
      time: '1 giờ trước',
      type: 'info',
      desc: 'Hệ thống Skill PCCC đã được cập nhật căn cứ pháp luật và tiêu chuẩn mới nhất.'
    },
    {
      id: 3,
      title: 'Có thể nạp thêm gói Skill mới',
      time: 'Hôm nay',
      type: 'promo',
      desc: 'Anh có thể nạp các gói Skill chuyên biệt (Thuế, Giám sát, Đấu thầu) để thương mại hóa.'
    }
  ];

  return (
    <header className="top-header">
      {/* Search Bar */}
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm Skill, Agent, tài liệu..." 
          className="search-input"
        />
        {searchTerm && (
          <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Nút nạp skill nhanh */}
        <button 
          className="btn-header-load-skill"
          onClick={onOpenSkillManager}
          title="Nạp thêm Skill mới vào hệ thống"
        >
          <Sparkles size={16} />
          <span>+ Nạp Skill Mới</span>
        </button>

        {/* Notification Bell */}
        <div className="notification-wrapper">
          <button 
            className="bell-btn" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showNotifications) setUnreadCount(0);
            }}
            title="Thông báo"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <b>Thông báo hệ thống</b>
                <button onClick={() => setUnreadCount(0)} className="mark-read-btn">
                  Đã đọc
                </button>
              </div>
              <div className="notifications-list">
                {notifications.map(n => (
                  <div key={n.id} className="notification-item">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-desc">{n.desc}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Portrait Avatar */}
        <div className="user-avatar-wrap" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <img 
            src="/assets/user_avatar.png" 
            alt="Anh Trí" 
            className="user-header-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span class="avatar-fallback">AT</span>';
            }} 
          />

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <b>Anh Trí</b>
                <span className="pro-pill"><ShieldCheck size={13} /> Gói Pro B2B</span>
              </div>
              <div className="profile-email">owner@triai.vn</div>
              <hr className="dropdown-divider" />
              <button className="dropdown-item" onClick={onOpenSkillManager}>
                ⚙ Quản lý & Nạp Skill
              </button>
              <button className="dropdown-item" onClick={() => alert('Bản quyền thương mại Trí AI v1.0. Bản quyền thuộc về Anh Trí.')}>
                📜 Thông tin bản quyền Webapp
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
