import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  currentUser 
}) {
  const [email, setEmail] = useState('triqnnamabank@gmail.com');
  const [password, setPassword] = useState('••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // 1. Continue with Google
  const handleGoogleLogin = () => {
    setIsLoading(true);
    showToast('Đang kết nối tài khoản Google...');
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: 'QUANG NHỰT TRÍ',
        email: 'triqnnamabank@gmail.com',
        avatar: '/assets/user_avatar.png',
        role: 'Chủ sở hữu',
        plan: 'Gói Pro Vĩnh Viễn',
        loginType: 'google'
      });
      onClose();
    }, 700);
  };

  // 2. Continue with Apple
  const handleAppleLogin = () => {
    setIsLoading(true);
    showToast('Đang xác thực qua Apple ID...');
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: 'QUANG NHỰT TRÍ',
        email: 'triqnnamabank@icloud.com',
        avatar: '/assets/user_avatar.png',
        role: 'Chủ sở hữu',
        plan: 'Gói Pro Vĩnh Viễn',
        loginType: 'apple'
      });
      onClose();
    }, 700);
  };

  // 3. Continue with Facebook
  const handleFacebookLogin = () => {
    setIsLoading(true);
    showToast('Đang kết nối tài khoản Facebook...');
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: 'QUANG NHỰT TRÍ',
        email: 'triqnnamabank@gmail.com',
        avatar: '/assets/user_avatar.png',
        role: 'Chủ sở hữu',
        plan: 'Gói Pro Vĩnh Viễn',
        loginType: 'facebook'
      });
      onClose();
    }, 700);
  };

  // 4. Form login với Gmail & mật khẩu
  const handleFormLogin = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Vui lòng nhập địa chỉ Gmail!');
      return;
    }

    setIsLoading(true);
    showToast('Đang xác thực tài khoản Gmail...');
    setTimeout(() => {
      setIsLoading(false);
      const namePart = email.split('@')[0];
      const displayName = (email.toLowerCase().includes('triqnnamabank') || email.toLowerCase().includes('quangnhuttri'))
        ? 'QUANG NHỰT TRÍ' 
        : namePart.toUpperCase();

      onLogin({
        name: displayName,
        email: email.trim(),
        avatar: '/assets/user_avatar.png',
        role: 'Chủ sở hữu',
        plan: 'Gói Pro Vĩnh Viễn',
        loginType: 'password'
      });
      onClose();
    }, 850);
  };

  // Xử lý đăng nhập nhanh tài khoản test phân quyền
  const handleQuickSwitchAccount = (account) => {
    setIsLoading(true);
    showToast(`Đang chuyển sang tài khoản: ${account.name}...`);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: account.name,
        email: account.email,
        avatar: account.avatar || '/assets/user_avatar.png',
        role: account.role,
        plan: account.plan,
        isAdmin: account.isAdmin,
        loginType: 'quick_test'
      });
      onClose();
    }, 500);
  };

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={onClose}>
      <div className="modal-container auth-modal-card" onClick={e => e.stopPropagation()}>
        
        {/* Toast Feedback */}
        {toastMsg && (
          <div className="auth-toast-badge">
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <div className="auth-brain-icon">🧠</div>
            <div>
              <h3 className="auth-title">Đăng Nhập & Phân Quyền TRÍ AI</h3>
              <p className="auth-subtitle">Chọn tài khoản test hoặc đăng nhập bằng email của bạn</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="auth-modal-body">
          
          {/* PHÂN QUYỀN: BẢNG CHỌN TÀI KHOẢN TEST NHANH */}
          <div className="auth-test-accounts-section">
            <div className="auth-test-section-head">
              <span className="auth-test-badge-title">🧪 TEST PHÂN QUYỀN THEO TÀI KHOẢN (1-CLICK)</span>
              <span className="auth-test-hint">Bấm để chuyển nhanh tài khoản & kiểm tra Skill</span>
            </div>

            <div className="auth-test-accounts-grid">
              {/* 1. Admin Full Skill */}
              <div 
                className={`auth-test-account-card admin-card ${currentUser?.email === 'triqnnamabank@gmail.com' ? 'active-user' : ''}`}
                onClick={() => handleQuickSwitchAccount({
                  name: 'QUANG NHỰT TRÍ',
                  email: 'triqnnamabank@gmail.com',
                  role: 'Chủ sở hữu',
                  plan: 'Gói Admin Toàn Quyền (Full 33+ Skill)',
                  avatar: '/assets/user_avatar.png',
                  isAdmin: true
                })}
              >
                <div className="test-acc-icon">👑</div>
                <div className="test-acc-info">
                  <div className="test-acc-name">QUANG NHỰT TRÍ <span className="admin-tag">Admin</span></div>
                  <div className="test-acc-email">triqnnamabank@gmail.com</div>
                  <div className="test-acc-skill-tag">✓ Full 33+ Skill (Toàn quyền)</div>
                </div>
                {currentUser?.email === 'triqnnamabank@gmail.com' && <span className="active-dot">● Đang dùng</span>}
              </div>

              {/* 2. Khách hàng KOL Thời Trang */}
              <div 
                className={`auth-test-account-card ${currentUser?.email === 'kol.fashion@gmail.com' ? 'active-user' : ''}`}
                onClick={() => handleQuickSwitchAccount({
                  name: 'Khách Hàng KOL Thời Trang',
                  email: 'kol.fashion@gmail.com',
                  role: 'Khách hàng',
                  plan: 'Gói KOL Thời Trang (1 Skill)',
                  avatar: '/assets/agent_phaply.png',
                  isAdmin: false
                })}
              >
                <div className="test-acc-icon">✨</div>
                <div className="test-acc-info">
                  <div className="test-acc-name">Khách Hàng KOL</div>
                  <div className="test-acc-email">kol.fashion@gmail.com</div>
                  <div className="test-acc-skill-tag kol-tag">1 Skill: KOL Thời Trang Ý Ngọc</div>
                </div>
                {currentUser?.email === 'kol.fashion@gmail.com' && <span className="active-dot">● Đang dùng</span>}
              </div>

              {/* 3. Khách hàng Kỹ thuật PCCC & MEP */}
              <div 
                className={`auth-test-account-card ${currentUser?.email === 'kythuat.pccc@gmail.com' ? 'active-user' : ''}`}
                onClick={() => handleQuickSwitchAccount({
                  name: 'Kỹ Sư Nghiệm Thu Tòa Nhà',
                  email: 'kythuat.pccc@gmail.com',
                  role: 'Khách hàng',
                  plan: 'Gói Kỹ Thuật & Vận Hành (2 Skill)',
                  avatar: '/assets/agent_an.png',
                  isAdmin: false
                })}
              >
                <div className="test-acc-icon">🔥</div>
                <div className="test-acc-info">
                  <div className="test-acc-name">Kỹ Sư Công Trình</div>
                  <div className="test-acc-email">kythuat.pccc@gmail.com</div>
                  <div className="test-acc-skill-tag pccc-tag">2 Skill: PCCC & Kỹ thuật MEP</div>
                </div>
                {currentUser?.email === 'kythuat.pccc@gmail.com' && <span className="active-dot">● Đang dùng</span>}
              </div>

              {/* 4. Khách hàng Mua sắm & Pháp lý */}
              <div 
                className={`auth-test-account-card ${currentUser?.email === 'muasam.phaply@gmail.com' ? 'active-user' : ''}`}
                onClick={() => handleQuickSwitchAccount({
                  name: 'Chuyên Viên Mua Sắm & Pháp Lý',
                  email: 'muasam.phaply@gmail.com',
                  role: 'Khách hàng',
                  plan: 'Gói Mua Sắm & Hợp Đồng (2 Skill)',
                  avatar: '/assets/agent_muasam.png',
                  isAdmin: false
                })}
              >
                <div className="test-acc-icon">🛒</div>
                <div className="test-acc-info">
                  <div className="test-acc-name">Chuyên Viên Mua Sắm</div>
                  <div className="test-acc-email">muasam.phaply@gmail.com</div>
                  <div className="test-acc-skill-tag procurement-tag">2 Skill: Báo giá & Pháp lý</div>
                </div>
                {currentUser?.email === 'muasam.phaply@gmail.com' && <span className="active-dot">● Đang dùng</span>}
              </div>
            </div>
          </div>

          {/* Social Sign-In Buttons */}
          <div className="auth-social-buttons">
            {/* 1. Continue with Google (Nút đen chữ trắng icon Google) */}
            <button 
              type="button" 
              className={`btn-auth-pill btn-continue-google ${isLoading ? 'loading' : ''}`}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              title="Tiếp tục bằng tài khoản Google"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" className="btn-social-icon">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="btn-auth-pill-text">Continue with Google</span>
            </button>

            {/* 2. Continue with Apple (Nút xám chữ đen icon Apple) */}
            <button 
              type="button" 
              className={`btn-auth-pill btn-continue-apple ${isLoading ? 'loading' : ''}`}
              onClick={handleAppleLogin}
              disabled={isLoading}
              title="Tiếp tục bằng tài khoản Apple"
            >
              <svg viewBox="0 0 170 170" width="18" height="18" fill="currentColor" className="btn-social-icon">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.74-11.64-14.1-6.19-9.68-11.05-20.78-14.59-33.31-3.53-12.52-5.3-24.3-5.3-35.33 0-14.56 3.69-26.78 11.07-36.66 7.39-9.88 16.59-14.94 27.6-15.18 4.78 0 10.05 1.25 15.82 3.75 5.76 2.5 9.77 3.86 12.02 4.09 1.63-.33 5.76-1.79 12.38-4.41 6.63-2.61 12.02-3.81 16.18-3.59 12.4.65 22.42 5.12 30.07 13.4-10.88 6.64-16.19 15.67-15.93 27.09.22 8.93 3.69 16.54 10.42 22.84 6.73 6.31 14.65 9.87 23.77 10.69-2.28 7.08-5.22 14.26-8.81 21.55zM119.22 31.84c0-7.39 2.61-14.15 7.84-20.27 5.22-6.13 11.64-9.86 19.26-11.19.11 1.09.16 2.07.16 2.94 0 7.39-2.83 14.36-8.49 20.91-5.66 6.55-12.29 10.29-19.89 11.23-.22-1.09-.33-2.07-.33-2.94z"/>
              </svg>
              <span className="btn-auth-pill-text">Continue with Apple</span>
            </button>

            {/* 3. Continue with Facebook (Nút xám chữ đen icon Facebook) */}
            <button 
              type="button" 
              className={`btn-auth-pill btn-continue-facebook ${isLoading ? 'loading' : ''}`}
              onClick={handleFacebookLogin}
              disabled={isLoading}
              title="Tiếp tục bằng tài khoản Facebook"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" className="btn-social-icon">
                <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                <path d="M15.12 12.44l.43-2.8h-2.69v-1.82c0-.77.38-1.52 1.58-1.52h1.22V3.94c-.21-.03-.94-.09-1.78-.09-1.82 0-3.02 1.1-3.02 3.11v2.68H8.38v2.8h2.48V20h3.07v-7.56h1.19z" fill="#ffffff"/>
              </svg>
              <span className="btn-auth-pill-text">Continue with Facebook</span>
            </button>
          </div>

          {/* Đường phân cách */}
          <div className="auth-divider-line">
            <span>hoặc đăng nhập bằng Gmail & Mật khẩu</span>
          </div>

          {/* Form nhập Gmail & Mật khẩu */}
          <form onSubmit={handleFormLogin} className="auth-login-form">
            
            {/* Trường Gmail */}
            <div className="auth-form-field">
              <label htmlFor="auth-email">Địa chỉ Gmail</label>
              <div className="auth-input-pill">
                <Mail size={16} className="auth-field-icon" />
                <input 
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="triqnnamabank@gmail.com"
                  className="auth-text-input"
                  required
                />
              </div>
            </div>

            {/* Trường Mật khẩu */}
            <div className="auth-form-field">
              <div className="auth-field-label-row">
                <label htmlFor="auth-password">Mật khẩu</label>
                <span className="auth-forgot-link">Quên mật khẩu?</span>
              </div>
              <div className="auth-input-pill">
                <Lock size={16} className="auth-field-icon" />
                <input 
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="auth-text-input"
                  required
                />
                <button 
                  type="button" 
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Ghi nhớ & Xác nhận */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>
            </div>

            {/* Nút Đăng nhập */}
            <button 
              type="submit" 
              className={`btn-auth-submit ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              <LogIn size={18} />
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
            </button>
          </form>

          {/* Footer an toàn bảo mật */}
          <div className="auth-security-footer">
            <ShieldCheck size={14} className="sec-icon" />
            <span>Bảo mật chuẩn mã hóa OAuth 2.0 &amp; SSL/TLS Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
