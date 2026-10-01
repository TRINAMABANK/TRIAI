import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Plus, 
  Search, 
  Sparkles, 
  Flame, 
  Building2, 
  ShoppingCart, 
  Scale, 
  Cpu, 
  Package, 
  Trash2, 
  AlertCircle,
  KeyRound,
  DollarSign,
  UserX,
  Send
} from 'lucide-react';
import { 
  getLicenseRequests, 
  approveLicenseRequest, 
  rejectLicenseRequest, 
  grantDirectLicense, 
  revokeCustomerLicense,
  MASTER_ADMIN_EMAIL 
} from '../data/skillsData';

export default function AdminApprovalModal({ 
  isOpen, 
  onClose, 
  skills = [], 
  adminUser = {},
  onLicenseChanged 
}) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'licensed' | 'grant_direct'
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Form cấp quyền trực tiếp
  const [directEmail, setDirectEmail] = useState('');
  const [directSkillId, setDirectSkillId] = useState('kol-thoi-trang');
  const [directNotes, setDirectNotes] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadData = () => {
    const data = getLicenseRequests();
    setRequests(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = adminUser.role === 'owner' || adminUser.role === 'admin' || adminUser.isAdmin || adminUser.role === 'Chủ sở hữu';

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');

  // Xử lý phê duyệt
  const handleApprove = (requestId) => {
    const res = approveLicenseRequest(requestId, adminUser.email);
    if (res.success) {
      showToast(`✅ ${res.message}`);
      loadData();
      if (onLicenseChanged) onLicenseChanged();
    } else {
      showToast(`❌ ${res.message}`);
    }
  };

  // Xử lý từ chối
  const handleReject = (requestId) => {
    const res = rejectLicenseRequest(requestId, adminUser.email);
    if (res.success) {
      showToast(`⚠️ ${res.message}`);
      loadData();
      if (onLicenseChanged) onLicenseChanged();
    } else {
      showToast(`❌ ${res.message}`);
    }
  };

  // Xử lý cấp quyền thủ công
  const handleDirectGrant = (e) => {
    e.preventDefault();
    if (!directEmail.trim()) {
      showToast('❌ Vui lòng nhập email khách hàng!');
      return;
    }
    const matchedSkill = skills.find(s => s.id === directSkillId);
    const res = grantDirectLicense(directEmail, directSkillId, matchedSkill?.name, adminUser.email);
    if (res.success) {
      showToast(`✅ ${res.message}`);
      setDirectEmail('');
      setDirectNotes('');
      loadData();
      setActiveTab('licensed');
      if (onLicenseChanged) onLicenseChanged();
    } else {
      showToast(`❌ ${res.message}`);
    }
  };

  // Xử lý thu hồi quyền
  const handleRevoke = (customerEmail, skillId) => {
    if (window.confirm(`Anh có chắc chắn muốn thu hồi quyền Skill [${skillId}] của tài khoản ${customerEmail}?`)) {
      const res = revokeCustomerLicense(customerEmail, skillId, adminUser.email);
      if (res.success) {
        showToast(`🔒 ${res.message}`);
        loadData();
        if (onLicenseChanged) onLicenseChanged();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-container admin-approval-modal" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '880px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Toast Feedback */}
        {toastMsg && (
          <div className="auth-toast-badge" style={{ zIndex: 10000 }}>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#ffffff', borderRadius: '16px 16px 0 0', padding: '18px 24px' }}>
          <div className="modal-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' }}>
              👑
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Trung Tâm Phê Duyệt &amp; Cấp Bản Quyền Khách Hàng
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Quản trị viên tối cao: <b style={{ color: '#38bdf8' }}>{MASTER_ADMIN_EMAIL}</b> — Toàn quyền kiểm soát và bán các gói Skill/Agent
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Đóng (CLOSE)" style={{ color: '#ffffff' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
          
          {/* Admin Verification Banner */}
          {!isAdmin && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c' }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Cảnh báo: Bạn đang không đăng nhập bằng tài khoản Quản trị viên (<b>{MASTER_ADMIN_EMAIL}</b>). Chỉ có Admin mới có quyền phê duyệt cấp bán Skill.
              </span>
            </div>
          )}

          {/* KPI Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#f59e0b" /> Yêu Cầu Chờ Duyệt
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
                {pendingRequests.length} <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>khách hàng</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} color="#16a34a" /> Đã Cấp Bản Quyền
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
                {approvedRequests.length} <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>tài khoản active</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={15} color="#2563eb" /> Tổng Số Skill Sẵn Sàng
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1d4ed8', marginTop: '6px' }}>
                {skills.length} <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>bộ Skill thương mại</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <button
              type="button"
              className={`cat-pill ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Clock size={15} /> 
              Yêu Cầu Chờ Duyệt ({pendingRequests.length})
            </button>

            <button
              type="button"
              className={`cat-pill ${activeTab === 'licensed' ? 'active' : ''}`}
              onClick={() => setActiveTab('licensed')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <UserCheck size={15} /> 
              Khách Hàng Đã Cấp Quyền ({approvedRequests.length})
            </button>

            <button
              type="button"
              className={`cat-pill ${activeTab === 'grant_direct' ? 'active' : ''}`}
              onClick={() => setActiveTab('grant_direct')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Plus size={15} /> 
              + Cấp Quyền Trực Tiếp
            </button>
          </div>

          {/* TAB 1: YÊU CẦU CHỜ DUYỆT */}
          {activeTab === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ margin: '0 0 6px', color: '#0f172a' }}>Không có yêu cầu nào đang chờ duyệt</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Tất cả các yêu cầu mua và dùng thử từ khách hàng đã được xử lý xong.</p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div 
                    key={req.id} 
                    style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.06)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: req.skillId?.includes('kol') ? '#fce7f3' : '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        {req.skillId?.includes('kol') ? '✨' : req.skillId?.includes('pccc') ? '🔥' : '⚙️'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <b style={{ fontSize: '14px', color: '#0f172a' }}>{req.userName}</b>
                          <span style={{ fontSize: '11px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {req.type === 'trial' ? '🎁 Xin Dùng thử 15p' : '💳 Mua Bản Quyền'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#2563eb', fontFamily: 'monospace', marginTop: '2px' }}>
                          📧 {req.email} {req.phone && `• 📞 ${req.phone}`}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                          Gói yêu cầu: <span style={{ color: '#0284c7' }}>{req.skillName}</span> ({req.price})
                        </div>
                        {req.notes && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                            Ghi chú: {req.notes} • Gửi lúc: {req.time}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleApprove(req.id)}
                        disabled={!isAdmin}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: isAdmin ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                        }}
                      >
                        <CheckCircle2 size={16} /> Duyệt &amp; Cấp Quyền
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        disabled={!isAdmin}
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: isAdmin ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <XCircle size={15} /> Từ chối
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: KHÁCH HÀNG ĐÃ CẤP QUYỀN */}
          {activeTab === 'licensed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {approvedRequests.map(req => (
                <div 
                  key={req.id} 
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <b style={{ fontSize: '14px', color: '#0f172a' }}>{req.userName}</b>
                      <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        ✓ Đang hoạt động
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', fontFamily: 'monospace', marginTop: '2px' }}>
                      📧 {req.email}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                      Skill đã cấp: <b>{req.skillName}</b> (Duyệt bởi: {req.approvedBy || MASTER_ADMIN_EMAIL})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevoke(req.email, req.skillId)}
                    disabled={!isAdmin}
                    title="Thu hồi / Khóa bản quyền Skill này của khách hàng"
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isAdmin ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <UserX size={14} /> Thu hồi quyền
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CẤP QUYỀN TRỰC TIẾP */}
          {activeTab === 'grant_direct' && (
            <form onSubmit={handleDirectGrant} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: '15px' }}>
                ⚡ Cấp Quyền Sử Dụng Trực Tiếp Theo Email Khách Hàng
              </h4>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Địa chỉ Gmail của Khách hàng:
                </label>
                <input 
                  type="email" 
                  value={directEmail} 
                  onChange={e => setDirectEmail(e.target.value)}
                  placeholder="vi_du_khachhang@gmail.com"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Chọn Bộ Kỹ Năng (Skill / Agent) cần cấp quyền:
                </label>
                <select 
                  value={directSkillId} 
                  onChange={e => setDirectSkillId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#ffffff', boxSizing: 'border-box' }}
                >
                  {skills.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.category || 'Chuyên ngành'}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Ghi chú cấp quyền (tùy chọn):
                </label>
                <input 
                  type="text" 
                  value={directNotes} 
                  onChange={e => setDirectNotes(e.target.value)}
                  placeholder="Ví dụ: Đã nhận thanh toán hợp đồng 12 tháng qua Vietcombank"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                disabled={!isAdmin}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: isAdmin ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <KeyRound size={16} /> Cấp Quyền &amp; Kích Hoạt Ngay
              </button>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            🔒 <b>Bảo mật:</b> Mọi thao tác cấp bản quyền đều được ghi nhận trực tiếp bởi Admin <b>{MASTER_ADMIN_EMAIL}</b>.
          </span>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
