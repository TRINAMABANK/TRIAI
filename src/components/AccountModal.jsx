import React, { useState, useEffect } from 'react';
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
  LogIn,
  Package,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

export default function AccountModal({ isOpen, onClose, user, onOpenAuthModal, onLogout }) {
  const [activeTab, setActiveTab] = useState('quota'); // 'quota' | 'orders'
  const [quota, setQuota] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.isLoggedIn) {
      loadUserData();
    }
  }, [isOpen, user?.isLoggedIn]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // 1. Load real quota from backend
      const meRes = await api.auth.getMe().catch(() => null);
      if (meRes && meRes.quota) {
        setQuota(meRes.quota);
      }

      // 2. Load customer orders from backend
      const ordersRes = await api.orders.getAll().catch(() => null);
      if (ordersRes && Array.isArray(ordersRes.orders)) {
        setMyOrders(ordersRes.orders);
      }
    } catch (err) {
      console.warn('Error loading account data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-wrap" onClick={onClose}>
      <div className="modal-box-card account-modal-box" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-box-head">
          <div className="head-with-badge">
            <h3>Thông Tin Tài Khoản & Bản Quyền</h3>
            <span className="pro-pill-badge">{quota?.planName || user?.plan || 'Gói Khách Hàng'}</span>
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
                alt={user?.name || "Khách hàng"} 
                className="user-photo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = (user?.name || 'QT').slice(0, 2).toUpperCase();
                }}
              />
            </div>
            <div className="account-user-details">
              <h4>{user?.name || user?.fullName || "QUANG NHỰT TRÍ"}</h4>
              <p>{user?.role === 'owner' ? "Chủ sở hữu bản quyền • Quản trị viên tối cao" : "Khách hàng Doanh nghiệp"}</p>
              <span className="account-email">{user?.email || "triqnnamabank@gmail.com"}</span>
            </div>
            <div className="account-status-active">
              <CheckCircle2 size={16} /> {user?.isLoggedIn ? 'Đang hoạt động' : 'Chưa đăng nhập'}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1f2937', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('quota')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 16px',
                color: activeTab === 'quota' ? '#38bdf8' : '#9ca3af',
                borderBottom: activeTab === 'quota' ? '2px solid #38bdf8' : '2px solid transparent',
                fontWeight: activeTab === 'quota' ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={15} /> Tài Nguyên Thực Tế
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 16px',
                color: activeTab === 'orders' ? '#38bdf8' : '#9ca3af',
                borderBottom: activeTab === 'orders' ? '2px solid #38bdf8' : '2px solid transparent',
                fontWeight: activeTab === 'orders' ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Package size={15} /> Lịch Sử Đơn Hàng ({myOrders.length})
            </button>
          </div>

          {/* TAB 1: REAL RESOURCE QUOTA */}
          {activeTab === 'quota' && (
            <div className="account-usage-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h5 className="section-small-title" style={{ margin: 0 }}>Hạn Mức Sử Dụng Tháng {quota?.periodMonth || 'Hiện Tại'}</h5>
                <button 
                  type="button" 
                  onClick={loadUserData} 
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                >
                  <RefreshCw size={12} className={loading ? 'spin-icon' : ''} /> Làm mới
                </button>
              </div>

              {quota ? (
                <>
                  <div className="usage-meter-item">
                    <div className="meter-label-row">
                      <span className="meter-name"><Zap size={15} /> Lượt gọi phân tích AI:</span>
                      <b>{quota.aiRequests.used.toLocaleString('vi-VN')} / {quota.aiRequests.limit >= 100000 ? 'Không giới hạn' : quota.aiRequests.limit.toLocaleString('vi-VN') + ' lượt'} ({quota.aiRequests.percentage}%)</b>
                    </div>
                    <div className="meter-track">
                      <div className="meter-bar" style={{ width: `${quota.aiRequests.percentage}%`, background: '#2465e9' }}></div>
                    </div>
                  </div>

                  <div className="usage-meter-item">
                    <div className="meter-label-row">
                      <span className="meter-name"><ImageIcon size={15} /> Tạo ảnh Lookbook & Đồ họa AI:</span>
                      <b>{quota.imageGenerations.used.toLocaleString('vi-VN')} / {quota.imageGenerations.limit >= 10000 ? 'Không giới hạn' : quota.imageGenerations.limit.toLocaleString('vi-VN') + ' ảnh'} ({quota.imageGenerations.percentage}%)</b>
                    </div>
                    <div className="meter-track">
                      <div className="meter-bar" style={{ width: `${quota.imageGenerations.percentage}%`, background: '#e03177' }}></div>
                    </div>
                  </div>

                  <div className="usage-meter-item">
                    <div className="meter-label-row">
                      <span className="meter-name"><HardDrive size={15} /> Dung lượng lưu trữ tài liệu:</span>
                      <b>{quota.storage.usedFormatted} / {quota.storage.limitFormatted} ({quota.storage.percentage}%)</b>
                    </div>
                    <div className="meter-track">
                      <div className="meter-bar" style={{ width: `${quota.storage.percentage}%`, background: '#10b981' }}></div>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Đang kết nối số liệu sử dụng thực tế từ máy chủ...</p>
              )}

              {/* Plan details */}
              <div className="account-plan-box" style={{ marginTop: '16px' }}>
                <div className="plan-icon-circ">
                  <ShieldCheck size={24} />
                </div>
                <div className="plan-info-text">
                  <b>{quota?.planName || 'Gói Dịch Vụ TRÍ AI'}</b>
                  <p>Hệ thống tự động kiểm soát hạn mức và bảo vệ tài nguyên tính toán theo thời gian thực.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REAL CUSTOMER ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {myOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                  <Package size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p>Bạn chưa có đơn hàng nào trên hệ thống.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {myOrders.map(order => (
                    <div key={order.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#38bdf8', fontSize: '14px' }}>{order.order_code}</strong>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', background: (order.status === 'paid' || order.status === 'completed') ? '#065f46' : order.status === 'cancelled' ? '#7f1d1d' : '#854d0e', color: (order.status === 'paid' || order.status === 'completed') ? '#34d399' : order.status === 'cancelled' ? '#f87171' : '#fde047' }}>
                            {(order.status === 'paid' || order.status === 'completed') ? 'ĐÃ XÁC NHẬN' : order.status === 'cancelled' ? 'TỪ CHỐI' : 'CHỜ ĐỐI SOÁT'}
                          </span>
                        </div>
                        <div style={{ color: '#d1d5db', fontSize: '13px', marginTop: '4px' }}>
                          {order.productName || 'Gói Bản Quyền TRÍ AI'}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                          {new Date(order.created_at).toLocaleString('vi-VN')} {order.bank_transaction_ref ? `• GD: ${order.bank_transaction_ref}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#f3f4f6', fontSize: '14px' }}>
                          {(order.total_amount || 0).toLocaleString('vi-VN')} đ
                        </div>
                        <div style={{ fontSize: '11px', color: order.licenseStatus === 'active' ? '#34d399' : '#9ca3af', marginTop: '4px' }}>
                          Bản quyền: {order.licenseStatus === 'active' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                <CheckCircle2 size={14} /> Đóng
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
                <LogIn size={14} /> Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
