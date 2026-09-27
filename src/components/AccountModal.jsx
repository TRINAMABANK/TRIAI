import React from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  HardDrive, 
  ImageIcon, 
  FileText, 
  Calendar,
  CreditCard,
  LogOut,
  LogIn
} from 'lucide-react';

export default function AccountModal({ isOpen, onClose, user, onOpenAuthModal, onLogout }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-wrap" onClick={onClose}>
      <div className="modal-box-card account-modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-box-head">
          <div className="head-with-badge">
            <h3>Thông Tin Tài Khoản & Gói Bản Quyền</h3>
            <span className="pro-pill-badge">{user?.plan || 'Gói Pro Vĩnh Viễn'}</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-box-body">
          {/* User profile row */}
          <div className="account-user-banner">
            <div className="account-avatar-large">
              <img 
                src={user?.avatar || "/assets/user_avatar.png"} 
                alt={user?.name || "QUANG NHỰT TRÍ"} 
                className="user-photo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = 'QT';
                }}
              />
            </div>
            <div className="account-user-details">
              <h4>{user?.name || "QUANG NHỰT TRÍ"}</h4>
              <p>{user?.role || "Chủ sở hữu bản quyền • Quản trị viên tối cao (Super Admin)"}</p>
              <span className="account-email">{user?.email || "triqnnamabank@gmail.com"}</span>
            </div>
            <div className="account-status-active">
              <CheckCircle2 size={16} /> {user?.isLoggedIn ? 'Đang hoạt động' : 'Chưa đăng nhập'}
            </div>
          </div>

          {/* Usage Quota Breakdown */}
          <div className="account-usage-section">
            <h5 className="section-small-title">Hạn Mức Tài Nguyên Tháng Này</h5>
            
            <div className="usage-meter-item">
              <div className="meter-label-row">
                <span className="meter-name"><Zap size={15} /> Lượt gọi phân tích AI:</span>
                <b>320 / 1.000 lượt (32%)</b>
              </div>
              <div className="meter-track">
                <div className="meter-bar" style={{ width: '32%', background: '#2465e9' }}></div>
              </div>
            </div>

            <div className="usage-meter-item">
              <div className="meter-label-row">
                <span className="meter-name"><ImageIcon size={15} /> Ảnh Lookbook KOL 8K:</span>
                <b>42 / 100 ảnh (42%)</b>
              </div>
              <div className="meter-track">
                <div className="meter-bar" style={{ width: '42%', background: '#e03177' }}></div>
              </div>
            </div>

            <div className="usage-meter-item">
              <div className="meter-label-row">
                <span className="meter-name"><FileText size={15} /> Hồ sơ nghiệm thu & tệp quét:</span>
                <b>18 / 50 tệp (36%)</b>
              </div>
              <div className="meter-track">
                <div className="meter-bar" style={{ width: '36%', background: '#10b981' }}></div>
              </div>
            </div>

            <div className="usage-meter-item">
              <div className="meter-label-row">
                <span className="meter-name"><HardDrive size={15} /> Dung lượng lưu trữ đám mây:</span>
                <b>1.2 GB / 10 GB (12%)</b>
              </div>
              <div className="meter-track">
                <div className="meter-bar" style={{ width: '12%', background: '#f59e0b' }}></div>
              </div>
            </div>
          </div>

          {/* Plan details */}
          <div className="account-plan-box">
            <div className="plan-icon-circ">
              <ShieldCheck size={24} />
            </div>
            <div className="plan-info-text">
              <b>Gói Doanh Nghiệp Pro (Bản quyền thương mại)</b>
              <p>Mở khóa toàn bộ 8 Skill chuyên ngành + Tự do nạp Skill mới + Phân phối cho khách hàng.</p>
              <div className="plan-expiry">
                <Calendar size={13} /> Thời hạn sử dụng: <b>Không giới hạn (Lifetime License)</b>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions-row">
          {user?.isLoggedIn ? (
            <>
              <button 
                type="button"
                className="btn-danger-outline" 
                onClick={() => {
                  if (onLogout) onLogout();
                  onClose();
                }}
              >
                <LogOut size={14} /> Đăng xuất
              </button>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  onClose();
                }}
              >
                🔄 Đổi tài khoản
              </button>
              <button className="btn-primary" onClick={onClose}>
                <CheckCircle2 size={14} /> Đã hoàn tất
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose}>Đóng</button>
              <button 
                type="button"
                className="btn-primary" 
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  onClose();
                }}
              >
                <LogIn size={14} /> Đăng nhập bằng Gmail
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
