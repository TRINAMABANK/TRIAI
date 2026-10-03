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
  Send,
  RefreshCw,
  Mail,
  FileCheck,
  TrendingUp,
  Calendar,
  CreditCard
} from 'lucide-react';
import api from '../api/client';

export default function AdminApprovalModal({ 
  isOpen, 
  onClose, 
  skills = [], 
  adminUser = {},
  onLicenseChanged 
}) {
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'pending' | 'licenses' | 'grant_direct' | 'emails'
  const [paymentsData, setPaymentsData] = useState({ payments: [], kpis: {}, providerInfo: {} });
  const [licenses, setLicenses] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reconciliation Dialog State
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actualAmount, setActualAmount] = useState('');
  const [bankTransactionRef, setBankTransactionRef] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [reconcileError, setReconcileError] = useState('');

  // Rejection Dialog State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Direct Grant State
  const [directEmail, setDirectEmail] = useState('');
  const [directSkillId, setDirectSkillId] = useState('kol-thoi-trang');
  const [directDuration, setDirectDuration] = useState('30');
  const [directNotes, setDirectNotes] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'payments' || activeTab === 'pending') {
        const res = await api.admin.getPayments({
          status: activeTab === 'pending' ? 'pending' : statusFilter
        }).catch(err => {
          console.warn('Failed to load payments:', err);
          return null;
        });
        if (res) {
          setPaymentsData({
            payments: res.payments || [],
            kpis: res.kpis || {},
            providerInfo: res.providerInfo || {}
          });
        }
      } else if (activeTab === 'licenses') {
        const res = await api.admin.getLicenses().catch(() => null);
        if (res && res.licenses) {
          setLicenses(res.licenses);
        }
      } else if (activeTab === 'emails') {
        const res = await api.admin.getEmailLogs().catch(() => null);
        if (res && res.logs) {
          setEmailLogs(res.logs);
        }
      }
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Reconciliation Modal
  const handleOpenReconcile = (payment) => {
    setSelectedPayment(payment);
    setActualAmount(payment.order_amount || payment.amount || '');
    setBankTransactionRef(payment.bank_transaction_ref || `FT${Date.now().toString().slice(-8)}`);
    setTransactionTime(new Date().toISOString().slice(0, 16));
    setReconciliationNotes('');
    setReconcileError('');
    setReconcileModalOpen(true);
  };

  // Submit Reconciliation & Verify
  const handleConfirmReconcile = async () => {
    if (!selectedPayment) return;
    const requiredAmount = selectedPayment.order_amount || selectedPayment.amount;
    const parsedActual = parseInt(actualAmount, 10);

    if (isNaN(parsedActual) || parsedActual <= 0) {
      setReconcileError('Vui lòng nhập số tiền thực nhận hợp lệ.');
      return;
    }

    if (parsedActual !== requiredAmount) {
      setReconcileError(`Số tiền thực nhận (${parsedActual.toLocaleString('vi-VN')} đ) không khớp với số tiền phải thu (${requiredAmount.toLocaleString('vi-VN')} đ). Không thể đối soát.`);
      return;
    }

    try {
      const res = await api.admin.verifyPayment(selectedPayment.order_id || selectedPayment.id, {
        actualAmount: parsedActual,
        bankTransactionRef: bankTransactionRef.trim(),
        transactionTime: new Date(transactionTime).toISOString(),
        notes: reconciliationNotes
      });

      if (res && res.success) {
        showToast(res.message || 'Đối soát thành công & Đã kích hoạt bản quyền!');
        setReconcileModalOpen(false);
        if (onLicenseChanged) onLicenseChanged();
        loadData();
      }
    } catch (err) {
      setReconcileError(err.message || 'Lỗi đối soát đơn hàng.');
    }
  };

  // Open Reject Modal
  const handleOpenReject = (payment) => {
    setSelectedPayment(payment);
    setRejectReason('Chưa nhận được giao dịch khớp với số tiền hoặc nội dung chuyển khoản.');
    setRejectModalOpen(true);
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!selectedPayment) return;
    try {
      const res = await api.admin.rejectPayment(selectedPayment.order_id || selectedPayment.id, {
        reason: rejectReason
      });
      if (res && res.success) {
        showToast(res.message || 'Đã từ chối đơn hàng.');
        setRejectModalOpen(false);
        if (onLicenseChanged) onLicenseChanged();
        loadData();
      }
    } catch (err) {
      showToast('Lỗi khi từ chối: ' + err.message);
    }
  };

  // Retry Failed Email
  const handleRetryEmail = async (logId) => {
    try {
      const res = await api.admin.retryEmailLog(logId);
      if (res && res.success) {
        showToast(res.message || 'Đã gửi lại email thành công.');
        loadData();
      }
    } catch (err) {
      showToast('Gửi lại email thất bại: ' + err.message);
    }
  };

  // Direct License Grant
  const handleDirectGrant = async (e) => {
    e.preventDefault();
    if (!directEmail) {
      showToast('Vui lòng nhập email khách hàng.');
      return;
    }

    try {
      // Look up user id by email
      const usersRes = await api.admin.getUsers().catch(() => ({ users: [] }));
      const targetUser = usersRes.users?.find(u => u.email.toLowerCase() === directEmail.trim().toLowerCase());
      const targetUserId = targetUser ? targetUser.id : `usr_guest_${directEmail.replace(/[^a-zA-Z0-9]/g, '')}`;

      const res = await api.admin.grantLicense({
        userId: targetUserId,
        userEmail: directEmail.trim().toLowerCase(),
        skillId: directSkillId,
        durationDays: parseInt(directDuration, 10)
      });

      if (res && res.success) {
        showToast(`Đã cấp bản quyền cho ${directEmail}!`);
        setDirectEmail('');
        setDirectNotes('');
        if (onLicenseChanged) onLicenseChanged();
        loadData();
      }
    } catch (err) {
      showToast('Lỗi cấp quyền: ' + err.message);
    }
  };

  // Revoke License
  const handleRevokeLicense = async (licenseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi bản quyền này?')) return;
    try {
      const res = await api.admin.revokeLicense(licenseId);
      if (res && res.success) {
        showToast('Đã thu hồi bản quyền.');
        if (onLicenseChanged) onLicenseChanged();
        loadData();
      }
    } catch (err) {
      showToast('Lỗi thu hồi: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const kpis = paymentsData.kpis || {};
  const providerInfo = paymentsData.providerInfo || {};

  // Filter payments list
  const filteredPayments = (paymentsData.payments || []).filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = 
      (p.order_code || '').toLowerCase().includes(q) ||
      (p.customer_email || '').toLowerCase().includes(q) ||
      (p.customer_name || '').toLowerCase().includes(q) ||
      (p.bank_transaction_ref || '').toLowerCase().includes(q) ||
      (p.productSummary || '').toLowerCase().includes(q);
    return matchSearch;
  });

  return (
    <div className="modal-backdrop-wrap" onClick={onClose}>
      <div 
        className="modal-box-card" 
        style={{ maxWidth: '1100px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-box-head" style={{ borderBottom: '1px solid #1f2937', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#1e3a8a', padding: '8px', borderRadius: '8px', color: '#60a5fa' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  TRÍ AI — ADMIN CENTER & QUẢN LÝ THU TIỀN
                </h3>
                <span style={{ fontSize: '11px', background: '#065f46', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  PRODUCTION
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                Master Admin: <strong style={{ color: '#60a5fa' }}>{adminUser?.email || 'triqnnamabank@gmail.com'}</strong> • OCB 0982441446
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs & Bank Provider Status */}
        <div style={{ background: '#0f172a', padding: '8px 24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              style={{
                background: activeTab === 'payments' ? '#1e293b' : 'transparent',
                border: 'none',
                color: activeTab === 'payments' ? '#38bdf8' : '#94a3b8',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: activeTab === 'payments' ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <DollarSign size={15} /> Quản Lý Thu Tiền
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              style={{
                background: activeTab === 'pending' ? '#1e293b' : 'transparent',
                border: 'none',
                color: activeTab === 'pending' ? '#f59e0b' : '#94a3b8',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <Clock size={15} /> Chờ Đối Soát ({kpis.pendingCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('licenses')}
              style={{
                background: activeTab === 'licenses' ? '#1e293b' : 'transparent',
                border: 'none',
                color: activeTab === 'licenses' ? '#34d399' : '#94a3b8',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: activeTab === 'licenses' ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <KeyRound size={15} /> Bản Quyền Đã Cấp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grant_direct')}
              style={{
                background: activeTab === 'grant_direct' ? '#1e293b' : 'transparent',
                border: 'none',
                color: activeTab === 'grant_direct' ? '#a78bfa' : '#94a3b8',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: activeTab === 'grant_direct' ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <Plus size={15} /> Cấp Trực Tiếp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              style={{
                background: activeTab === 'emails' ? '#1e293b' : 'transparent',
                border: 'none',
                color: activeTab === 'emails' ? '#ec4899' : '#94a3b8',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: activeTab === 'emails' ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <Mail size={15} /> Nhật Ký Email
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: providerInfo.configured ? '#34d399' : '#f59e0b' }}></span>
              {providerInfo.statusText || 'Đối soát thủ công — chưa kết nối ngân hàng tự động'}
            </span>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              style={{ background: '#334155', border: 'none', color: '#f3f4f6', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div style={{ background: '#1e3a8a', color: '#93c5fd', padding: '8px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1e40af' }}>
            <CheckCircle2 size={16} /> {toastMsg}
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#0b0f19' }}>
          
          {/* TAB 1 & 2: REVENUE & PAYMENTS RECONCILIATION */}
          {(activeTab === 'payments' || activeTab === 'pending') && (
            <div>
              {/* Revenue KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={14} color="#38bdf8" /> Doanh Thu Hôm Nay
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', marginTop: '6px' }}>
                    {(kpis.todayRevenue || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#34d399" /> Doanh Thu Tháng Này
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399', marginTop: '6px' }}>
                    {(kpis.thisMonthRevenue || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#a78bfa" /> Tổng Đã Thu Thực Tế
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa', marginTop: '6px' }}>
                    {(kpis.totalRevenue || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#f59e0b" /> Chờ Đối Soát
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b', marginTop: '6px' }}>
                    {kpis.pendingCount || 0} đơn
                  </div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={14} color="#f87171" /> Đã Từ Chối
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171', marginTop: '6px' }}>
                    {kpis.rejectedCount || 0} đơn
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }} />
                    <input 
                      type="text" 
                      placeholder="Tìm theo Mã Đơn (TRIAI-...), Email, Khách Hàng, Mã Giao Dịch..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '6px', padding: '8px 12px 8px 32px', color: '#f3f4f6', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {activeTab === 'payments' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['all', 'pending', 'verified', 'rejected'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        style={{
                          background: statusFilter === st ? '#2563eb' : '#1e293b',
                          border: 'none',
                          color: statusFilter === st ? '#ffffff' : '#94a3b8',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: statusFilter === st ? 'bold' : 'normal'
                        }}
                      >
                        {st === 'all' ? 'Tất cả' : st === 'pending' ? 'Chờ đối soát' : st === 'verified' ? 'Đã thu' : 'Từ chối'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Table */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '12px 14px' }}>Mã Đơn Hàng</th>
                      <th style={{ padding: '12px 14px' }}>Khách Hàng</th>
                      <th style={{ padding: '12px 14px' }}>Sản Phẩm</th>
                      <th style={{ padding: '12px 14px' }}>Số Tiền Phải Thu</th>
                      <th style={{ padding: '12px 14px' }}>Thực Nhận</th>
                      <th style={{ padding: '12px 14px' }}>Mã GD Ngân Hàng</th>
                      <th style={{ padding: '12px 14px' }}>Trạng Thái</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '32px 14px', textAlign: 'center', color: '#6b7280' }}>
                          Không có giao dịch nào phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <strong style={{ color: '#38bdf8' }}>{p.order_code}</strong>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{new Date(p.created_at).toLocaleString('vi-VN')}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div>{p.customer_name || 'Khách hàng'}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.customer_email}</div>
                          </td>
                          <td style={{ padding: '12px 14px', maxWidth: '220px' }}>
                            <span style={{ color: '#cbd5e1' }}>{p.productSummary || 'Gói Skill'}</span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 'bold' }}>
                            {(p.order_amount || p.amount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ padding: '12px 14px', color: p.verified_amount ? '#34d399' : '#9ca3af' }}>
                            {p.verified_amount ? `${p.verified_amount.toLocaleString('vi-VN')} đ` : '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {p.bank_transaction_ref ? (
                              <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#f59e0b', fontSize: '12px' }}>
                                {p.bank_transaction_ref}
                              </code>
                            ) : (
                              <span style={{ color: '#6b7280' }}>Chờ nhập</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              background: p.payment_status === 'verified' ? '#065f46' : p.payment_status === 'rejected' ? '#7f1d1d' : '#854d0e',
                              color: p.payment_status === 'verified' ? '#34d399' : p.payment_status === 'rejected' ? '#f87171' : '#fde047'
                            }}>
                              {p.payment_status === 'verified' ? 'ĐÃ THU' : p.payment_status === 'rejected' ? 'TỪ CHỐI' : 'CHỜ ĐỐI SOÁT'}
                            </span>
                            {p.verified_by && (
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                                Duyệt: {p.verified_by.split('@')[0]}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {p.payment_status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReconcile(p)}
                                  style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <FileCheck size={13} /> Đối Soát
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(p)}
                                  style={{ background: '#dc2626', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : p.payment_status === 'verified' ? (
                              <span style={{ color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                <CheckCircle2 size={14} /> Hoàn tất
                              </span>
                            ) : (
                              <span style={{ color: '#f87171', fontSize: '12px' }}>Đã từ chối</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LICENSES LIST */}
          {activeTab === 'licenses' && (
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px 14px' }}>Khách Hàng / Email</th>
                    <th style={{ padding: '12px 14px' }}>Skill Bản Quyền</th>
                    <th style={{ padding: '12px 14px' }}>Loại Gói</th>
                    <th style={{ padding: '12px 14px' }}>Trạng Thái</th>
                    <th style={{ padding: '12px 14px' }}>Thời Hạn</th>
                    <th style={{ padding: '12px 14px' }}>Người Cấp</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: '#6b7280' }}>
                        Chưa có bản quyền nào được kích hoạt.
                      </td>
                    </tr>
                  ) : (
                    licenses.map(lic => (
                      <tr key={lic.id} style={{ borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#f3f4f6' }}>{lic.user_name || lic.user_email?.split('@')[0]}</strong>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{lic.user_email}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#38bdf8' }}>
                          {lic.skill_name || lic.skill_id}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ textTransform: 'uppercase', fontSize: '11px', background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>
                            {lic.license_type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', background: lic.status === 'active' ? '#065f46' : '#7f1d1d', color: lic.status === 'active' ? '#34d399' : '#f87171' }}>
                            {lic.status === 'active' ? 'HOẠT ĐỘNG' : 'HẾT HẠN'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#9ca3af' }}>
                          {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '11px', color: '#6b7280' }}>
                          {lic.granted_by || 'system'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {lic.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleRevokeLicense(lic.id)}
                              style={{ background: '#7f1d1d', border: 'none', color: '#f87171', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Thu hồi
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: DIRECT LICENSE GRANT */}
          {activeTab === 'grant_direct' && (
            <div style={{ maxWidth: '580px', margin: '0 auto', background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#f3f4f6', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#38bdf8" /> Cấp Bản Quyền Trực Tiếp Cho Khách Hàng
              </h4>
              <form onSubmit={handleDirectGrant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Email Khách Hàng (*):</label>
                  <input
                    type="email"
                    required
                    placeholder="ví dụ: khachhang@gmail.com"
                    value={directEmail}
                    onChange={e => setDirectEmail(e.target.value)}
                    style={{ width: '100%', background: '#0b0f19', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f3f4f6', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Chọn Skill Cần Cấp:</label>
                  <select
                    value={directSkillId}
                    onChange={e => setDirectSkillId(e.target.value)}
                    style={{ width: '100%', background: '#0b0f19', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f3f4f6', fontSize: '13px' }}
                  >
                    <option value="kol-thoi-trang">KOL Thời Trang AI (Ý Ngọc Lookbook)</option>
                    <option value="pccc">Chuyên Gia PCCC & Thẩm Duyệt QCVN 06</option>
                    <option value="mep">Kỹ Sư Cơ Điện MEP</option>
                    <option value="hop-dong">Pháp Lý & Hợp Đồng Kinh Tế</option>
                    <option value="combo-5">Gói Combo 5 Trợ Lý Chuyên Sâu</option>
                    <option value="master-33">Gói Master 33 Trợ Lý Toàn Năng</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Thời Hạn Bản Quyền:</label>
                  <select
                    value={directDuration}
                    onChange={e => setDirectDuration(e.target.value)}
                    style={{ width: '100%', background: '#0b0f19', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f3f4f6', fontSize: '13px' }}
                  >
                    <option value="30">1 Tháng (30 Ngày)</option>
                    <option value="365">1 Năm (365 Ngày)</option>
                    <option value="3650">Vĩnh Viễn (10 Năm)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={16} /> Xác Nhận Cấp Bản Quyền
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: EMAIL LOGS */}
          {activeTab === 'emails' && (
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px 14px' }}>Người Nhận</th>
                    <th style={{ padding: '12px 14px' }}>Tiêu Đề</th>
                    <th style={{ padding: '12px 14px' }}>Loại Email</th>
                    <th style={{ padding: '12px 14px' }}>Trạng Thái</th>
                    <th style={{ padding: '12px 14px' }}>Thời Gian</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 14px', textAlign: 'center', color: '#6b7280' }}>
                        Chưa có lịch sử gửi email nào.
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <strong>{log.recipient}</strong>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                          {log.subject}
                          {log.error_message && (
                            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>
                              Lỗi: {log.error_message}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <code style={{ fontSize: '11px', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                            {log.type}
                          </code>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', background: log.status === 'sent' ? '#065f46' : '#7f1d1d', color: log.status === 'sent' ? '#34d399' : '#f87171' }}>
                            {log.status === 'sent' ? 'ĐÃ GỬI' : log.status === 'failed' ? 'THẤT BẠI' : 'CHỜ'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: '#9ca3af' }}>
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {log.status !== 'sent' && (
                            <button
                              type="button"
                              onClick={() => handleRetryEmail(log.id)}
                              style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Thử lại
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ background: '#111827', borderTop: '1px solid #1f2937', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>
            Đóng Admin Center
          </button>
        </div>
      </div>

      {/* RECONCILIATION MODAL */}
      {reconcileModalOpen && selectedPayment && (
        <div className="modal-backdrop-wrap" style={{ zIndex: 9999 }} onClick={() => setReconcileModalOpen(false)}>
          <div className="modal-box-card" style={{ maxWidth: '520px', width: '90vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-box-head">
              <h3>Đối Soát Thực Tế & Kích Hoạt Bản Quyền</h3>
              <button className="btn-close-modal" onClick={() => setReconcileModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-box-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Mã đơn hàng:</span>
                  <strong style={{ color: '#38bdf8' }}>{selectedPayment.order_code}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Khách hàng:</span>
                  <span>{selectedPayment.customer_email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Số tiền phải thu:</span>
                  <strong style={{ color: '#f59e0b' }}>{(selectedPayment.order_amount || selectedPayment.amount || 0).toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>

              {reconcileError && (
                <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {reconcileError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Số tiền thực nhận trên tài khoản ngân hàng (*):
                </label>
                <input
                  type="number"
                  value={actualAmount}
                  onChange={e => setActualAmount(e.target.value)}
                  style={{ width: '100%', background: '#111827', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#34d399', fontSize: '15px', fontWeight: 'bold' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Mã giao dịch ngân hàng / Ref ID (*):
                </label>
                <input
                  type="text"
                  placeholder="ví dụ: FT26090123456"
                  value={bankTransactionRef}
                  onChange={e => setBankTransactionRef(e.target.value)}
                  style={{ width: '100%', background: '#111827', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f3f4f6', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Thời gian giao dịch:
                </label>
                <input
                  type="datetime-local"
                  value={transactionTime}
                  onChange={e => setTransactionTime(e.target.value)}
                  style={{ width: '100%', background: '#111827', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f3f4f6', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Ghi chú đối soát:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú xác nhận từ sao kê ngân hàng..."
                  value={reconciliationNotes}
                  onChange={e => setReconciliationNotes(e.target.value)}
                  style={{ width: '100%', background: '#111827', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f3f4f6', fontSize: '13px' }}
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <button className="btn-secondary" onClick={() => setReconcileModalOpen(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleConfirmReconcile}>
                <CheckCircle2 size={14} /> Xác Nhận Thu Tiền & Kích Hoạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && selectedPayment && (
        <div className="modal-backdrop-wrap" style={{ zIndex: 9999 }} onClick={() => setRejectModalOpen(false)}>
          <div className="modal-box-card" style={{ maxWidth: '460px', width: '90vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-box-head">
              <h3>Từ Chối Đơn Hàng {selectedPayment.order_code}</h3>
              <button className="btn-close-modal" onClick={() => setRejectModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-box-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                Hệ thống sẽ cập nhật trạng thái đơn thành <strong>TỪ CHỐI</strong> và gửi email thông báo lý do cho khách hàng.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Lý do từ chối:</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  style={{ width: '100%', background: '#111827', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#f3f4f6', fontSize: '13px' }}
                />
              </div>
            </div>
            <div className="modal-actions-row">
              <button className="btn-secondary" onClick={() => setRejectModalOpen(false)}>Hủy</button>
              <button 
                type="button"
                style={{ background: '#dc2626', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={handleConfirmReject}
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
