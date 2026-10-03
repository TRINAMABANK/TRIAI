import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  User, 
  UserPlus, 
  AlertCircle
} from 'lucide-react';
import { api, setAuthToken } from '../api/client';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  initialMode = 'login' 
}) {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const googleButtonContainerRef = useRef(null);
  const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode || 'login');
      setErrorMessage('');
      setSuccessMessage('');
      setIsLoading(false);
    }
  }, [isOpen, initialMode]);

  // Xử lý xác thực ID Token từ Google gửi về Backend
  const processGoogleCredential = async (credential) => {
    if (!credential) {
      setErrorMessage('Không nhận được thông tin xác thực từ Google.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await api.auth.googleLogin({ credential });
      if (res && res.success && res.token) {
        setAuthToken(res.token);
        const userData = {
          id: res.user.id,
          name: res.user.full_name || res.user.name || res.user.email.split('@')[0],
          email: res.user.email,
          role: res.user.role,
          plan: res.user.plan,
          avatar: res.user.avatar_url || '/assets/user_avatar.png',
          isLoggedIn: true,
          isAdmin: res.user.role === 'owner' || res.user.role === 'admin'
        };
        setSuccessMessage('Đăng nhập bằng Google thành công!');
        setTimeout(() => {
          if (onLogin) onLogin(userData, res.token, res.access);
          onClose();
        }, 350);
      } else {
        setErrorMessage(res?.error || 'Đăng nhập Google không thành công.');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setErrorMessage(err.message || 'Lỗi xác thực tài khoản Google với máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  // Khởi tạo Google Identity Services (GIS)
  useEffect(() => {
    if (!isOpen) return;

    let checkInterval = null;

    const initGsi = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response && response.credential) {
                processGoogleCredential(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin'
          });

          if (googleButtonContainerRef.current) {
            window.google.accounts.id.renderButton(
              googleButtonContainerRef.current,
              {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 380,
                locale: 'vi'
              }
            );
          }
        } catch (err) {
          console.warn('Google Identity Services setup notice:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGsi();
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, GOOGLE_CLIENT_ID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      let res;
      if (authMode === 'register') {
        if (!fullName.trim()) {
          setErrorMessage('Vui lòng nhập họ và tên của bạn.');
          setIsLoading(false);
          return;
        }
        res = await api.auth.register(cleanEmail, password, fullName.trim());
      } else {
        res = await api.auth.login(cleanEmail, password);
      }

      if (res && res.success && res.token) {
        setAuthToken(res.token);
        const userData = {
          id: res.user.id,
          name: res.user.full_name || res.user.name || cleanEmail.split('@')[0],
          email: res.user.email,
          role: res.user.role,
          plan: res.user.plan,
          avatar: res.user.avatar_url || '/assets/user_avatar.png',
          isLoggedIn: true,
          isAdmin: res.user.role === 'owner' || res.user.role === 'admin'
        };

        setSuccessMessage(authMode === 'register' ? 'Đăng ký thành công!' : 'Đăng nhập thành công!');
        setTimeout(() => {
          if (onLogin) onLogin(userData, res.token, res.access);
          onClose();
        }, 400);
      } else {
        setErrorMessage(res?.error || 'Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrorMessage('');
    if (!GOOGLE_CLIENT_ID) {
      setErrorMessage('GOOGLE_CLIENT_ID chưa được thiết lập trong biến môi trường (.env).');
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const renderedBtn = googleButtonContainerRef.current?.querySelector('div[role="button"]');
            if (renderedBtn) {
              renderedBtn.click();
            }
          }
        });
      } catch (e) {
        console.warn('Google prompt error:', e);
      }
    } else {
      setErrorMessage('Google Identity Services chưa sẵn sàng. Vui lòng tải lại trang.');
    }
  };

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={onClose}>
      <div className="modal-container auth-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <div className="auth-brain-icon">🧠</div>
            <div>
              <h3 className="auth-title">
                {authMode === 'login' ? 'Đăng Nhập TRÍ AI' : 'Đăng Ký Tài Khoản TRÍ AI'}
              </h3>
              <p className="auth-subtitle">Hệ sinh thái Siêu Trợ lý Chuyên gia Doanh nghiệp</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher: Đăng Nhập / Đăng Ký */}
        <div className="auth-tabs-toggle" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            className={`auth-mode-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: authMode === 'login' ? '#ffffff' : 'transparent',
              color: authMode === 'login' ? '#2563eb' : '#64748b',
              fontWeight: authMode === 'login' ? '700' : '600',
              borderBottom: authMode === 'login' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={16} /> Đăng Nhập
          </button>
          <button
            type="button"
            className={`auth-mode-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: authMode === 'register' ? '#ffffff' : 'transparent',
              color: authMode === 'register' ? '#2563eb' : '#64748b',
              fontWeight: authMode === 'register' ? '700' : '600',
              borderBottom: authMode === 'register' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} /> Đăng Ký
          </button>
        </div>

        {/* Body */}
        <div className="auth-modal-body" style={{ padding: '20px' }}>
          
          {/* Error Message */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#16a34a',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-login-form">
            
            {/* Trường Họ tên (Chỉ hiển thị khi Đăng ký) */}
            {authMode === 'register' && (
              <div className="auth-form-field" style={{ marginBottom: '14px' }}>
                <label htmlFor="auth-fullname" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>Họ và tên</label>
                <div className="auth-input-pill">
                  <User size={16} className="auth-field-icon" />
                  <input 
                    id="auth-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="auth-text-input"
                    required={authMode === 'register'}
                  />
                </div>
              </div>
            )}

            {/* Trường Email */}
            <div className="auth-form-field" style={{ marginBottom: '14px' }}>
              <label htmlFor="auth-email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>Email</label>
              <div className="auth-input-pill">
                <Mail size={16} className="auth-field-icon" />
                <input 
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="auth-text-input"
                  required
                />
              </div>
            </div>

            {/* Trường Mật khẩu */}
            <div className="auth-form-field" style={{ marginBottom: '16px' }}>
              <div className="auth-field-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label htmlFor="auth-password" style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Mật khẩu</label>
                {authMode === 'login' && (
                  <span className="auth-forgot-link" style={{ fontSize: '12px', color: '#2563eb', cursor: 'pointer' }}>Quên mật khẩu?</span>
                )}
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

            {/* Nút Submit */}
            <button 
              type="submit" 
              className={`btn-auth-submit ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {authMode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              <span>
                {isLoading 
                  ? 'Đang xử lý...' 
                  : (authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản')}
              </span>
            </button>
          </form>

          {/* Đường phân cách */}
          <div className="auth-divider-line" style={{ margin: '18px 0', textAlign: 'center', position: 'relative' }}>
            <span style={{ background: '#ffffff', padding: '0 10px', color: '#94a3b8', fontSize: '12px' }}>hoặc</span>
          </div>

          {/* NÚT GOOGLE SIGN-IN */}
          <div className="auth-social-buttons" style={{ position: 'relative', minHeight: '44px' }}>
            {/* Vùng gắn Google Identity Services iframe */}
            <div 
              ref={googleButtonContainerRef} 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.001,
                zIndex: 2,
                cursor: 'pointer',
                overflow: 'hidden'
              }}
            />

            <button 
              type="button" 
              className={`btn-auth-pill btn-continue-google ${isLoading ? 'loading' : ''}`}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              title="Đăng nhập bằng tài khoản Google"
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isLoading ? 'Đang xác thực Google...' : 'Tiếp tục với Google'}</span>
            </button>
          </div>

          {/* Footer an toàn bảo mật */}
          <div className="auth-security-footer" style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <ShieldCheck size={13} />
            <span>Xác thực an toàn được bảo vệ bởi máy chủ Backend TRÍ AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
