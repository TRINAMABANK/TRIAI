// =============================================================================
// HỆ THỐNG 33 BỘ SKILL ĐỘC QUYỀN TRÍ AI (V1.0.0) - DYNAMIC SKILL ENGINE
// =============================================================================

import masterSkills from './masterSkills.json';

// Danh sách 33 Skill chuẩn thương mại được nạp mặc định
export const DEFAULT_SKILLS = masterSkills.map(skill => {
  // Bổ sung dữ liệu giàu thông tin cho KOL Thời Trang
  if (skill.id === 'kol-thoi-trang') {
    return {
      ...skill,
      imagePreview: '/assets/y_ngoc_aodai.jpg',
      samplePrompt: 'Ý Ngọc + Áo dài trắng + Khách sạn cao cấp + Fashion Campaign + Commercial Photography + Giữ nhận diện nhân vật',
      checklist: [
        { label: 'Nhận diện nhân vật Ý Ngọc: Khóa gương mặt nhất quán 100%', status: 'pass' },
        { label: 'Trang phục Áo dài trắng: Lụa tơ tằm thêu hoa cúc và cườm thủ công', status: 'pass' },
        { label: 'Bối cảnh Khách sạn cao cấp: Sảnh tiệc di sản 5 sao, đèn chùm pha lê rực rỡ', status: 'pass' },
        { label: 'Ánh sáng & Nhiếp ảnh: Commercial Photography, tiêu cự vàng 85mm', status: 'pass' },
        { label: 'Chất lượng xuất bản: Đạt chuẩn Fashion Campaign Lookbook 8K', status: 'pass' }
      ],
      sampleFiles: [
        { name: 'Lookbook_Y_Ngoc_Ao_Dai_Trang.pdf', size: '4.8 MB', type: 'pdf' },
        { name: 'Prompt_Sheet_KOL_Thoi_Trang.docx', size: '380 KB', type: 'word' },
        { name: 'Bo_anh_quang_cao_Luxury_Hotel.zip', size: '18.5 MB', type: 'excel' }
      ]
    };
  }

  // Bổ sung dữ liệu giàu thông tin cho PCCC
  if (skill.id === 'pccc') {
    return {
      ...skill,
      samplePrompt: 'Anh kiểm tra giúp tôi hồ sơ nghiệm thu hệ thống PCCC này được không?',
      checklist: [
        { label: 'Thành phần hồ sơ: Đầy đủ theo quy định', status: 'pass' },
        { label: 'Biểu mẫu: Đúng theo Nghị định 136/2020/NĐ-CP & QCVN 06:2026/BXD', status: 'pass' },
        { label: 'Nội dung kỹ thuật: Phù hợp thiết kế được duyệt', status: 'pass' },
        { label: 'Các hạng mục cần lưu ý: 2 điểm (Van xả tràn & Sơ đồ hoàn công)', status: 'pass' },
        { label: 'Đề xuất: Bổ sung biên bản thử nghiệm hệ thống báo cháy tự động và cập nhật sơ đồ hoàn công.', status: 'pass' }
      ],
      sampleFiles: [
        { name: 'Bao_cao_kiem_tra_PCCC.pdf', size: '2.4 MB', type: 'pdf' },
        { name: 'Danh_sach_diem_luu_y.xlsx', size: '324 KB', type: 'excel' },
        { name: 'So_do_hoan_cong.pdf', size: '1.1 MB', type: 'pdf' }
      ]
    };
  }

  // Bổ sung dữ liệu giàu thông tin cho Pháp lý & Soạn thảo hợp đồng (File Word .docx chuẩn Times New Roman)
  if (skill.id === 'soan-thao-van-ban' || skill.id === 'phap-ly' || skill.id === 'ra-soat-hop-dong') {
    return {
      ...skill,
      samplePrompt: 'Hãy soạn thảo mẫu hợp đồng kinh tế và rà soát các điều khoản pháp lý trọng yếu giúp tôi.',
      checklist: [
        { label: 'Tư cách chủ thể & thẩm quyền ký: Đạt chuẩn 100%', status: 'pass' },
        { label: 'Điều khoản thanh toán & bảo lãnh: Đúng quy định pháp luật', status: 'pass' },
        { label: 'Phạt vi phạm & bồi thường thiệt hại: Tối ưu 8% theo Luật Thương mại', status: 'pass' },
        { label: 'Cơ chế giải quyết tranh chấp: Trọng tài thương mại VIAC', status: 'pass' },
        { label: 'Định dạng xuất bản: File Word (.docx) chuẩn Times New Roman Nghị định 30/2020/NĐ-CP', status: 'pass' }
      ],
      sampleFiles: [
        { name: 'Mau_hop_dong_kinh_te_chuan.docx', size: '1.4 MB', type: 'word' },
        { name: 'Bien_ban_thoa_thuan_phap_ly.docx', size: '850 KB', type: 'word' },
        { name: 'Bao_cao_ra_soat_dieu_khoan.pdf', size: '2.1 MB', type: 'pdf' }
      ]
    };
  }

  return skill;
});

// Helper nạp / lưu trữ Skill động vào LocalStorage
const STORAGE_KEY = 'TRI_AI_CUSTOM_SKILLS_V2';

export function getLoadedSkills() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SKILLS;
    const customList = JSON.parse(raw);
    if (!Array.isArray(customList) || customList.length === 0) return DEFAULT_SKILLS;
    
    // Ghép danh sách mặc định (33 Skill) với danh sách nạp thêm
    const merged = [...DEFAULT_SKILLS];
    customList.forEach(c => {
      const idx = merged.findIndex(m => m.id === c.id);
      if (idx >= 0) {
        merged[idx] = c;
      } else {
        merged.push(c);
      }
    });
    return merged;
  } catch (e) {
    console.error('Error loading custom skills:', e);
    return DEFAULT_SKILLS;
  }
}

export function saveLoadedSkills(skills) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch (e) {
    console.error('Error saving skills:', e);
  }
}

export function addOrUpdateSkill(newSkill) {
  const current = getLoadedSkills();
  const index = current.findIndex(s => s.id === newSkill.id);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = newSkill;
  } else {
    updated = [newSkill, ...current];
  }
  saveLoadedSkills(updated);
  return updated;
}

export function deleteSkill(id) {
  const current = getLoadedSkills();
  const updated = current.filter(s => s.id !== id);
  saveLoadedSkills(updated);
  return updated;
}

// Khôi phục về toàn bộ 33 Skill gốc
export function resetToDefaultSkills() {
  saveLoadedSkills(DEFAULT_SKILLS);
  return DEFAULT_SKILLS;
}

// Xuất file cấu hình Skill Pack dạng JSON
export function exportSkillPack(skills) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(skills, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Goi_33_Skill_Tri_AI_Master_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// =============================================================================
// PHÂN QUYỀN SỞ HỮU SKILL THEO TỪNG TÀI KHOẢN (MULTI-USER SKILL ACCESS)
// =============================================================================

// Danh sách cấu hình mẫu cho các tài khoản test
export const USER_TEST_ACCOUNTS = [
  {
    name: 'QUANG NHỰT TRÍ',
    email: 'triqnnamabank@gmail.com',
    role: 'Chủ sở hữu',
    plan: 'Gói Admin Toàn Quyền (Full 33+ Skill)',
    avatar: '/assets/user_avatar.png',
    isAdmin: true,
    skillIds: null, // null nghĩa là ALL 33+ Skills
    desc: 'Tài khoản Quản trị viên cao cấp nhất: Sở hữu 100% tất cả 33+ Skill, nạp/sửa/xóa Skill và full quyền tính năng.'
  },
  {
    name: 'Khách Hàng KOL Thời Trang',
    email: 'kol.fashion@gmail.com',
    role: 'Khách hàng',
    plan: 'Gói KOL Thời Trang (1 Skill)',
    avatar: '/assets/agent_phaply.png',
    isAdmin: false,
    skillIds: ['kol-thoi-trang'],
    desc: 'Tài khoản khách hàng chỉ mua 1 Skill chuyên biệt: KOL Thời Trang Siêu Thực (Ý Ngọc). Các Skill khác đều bị khóa.'
  },
  {
    name: 'Kỹ Sư Nghiệm Thu Tòa Nhà',
    email: 'kythuat.pccc@gmail.com',
    role: 'Khách hàng',
    plan: 'Gói Kỹ Thuật & Vận Hành (2 Skill)',
    avatar: '/assets/agent_an.png',
    isAdmin: false,
    skillIds: ['pccc', 'mep'],
    desc: 'Tài khoản khách hàng chỉ mua 2 Skill: Nghiệm thu PCCC Tòa nhà và Vận hành Kỹ thuật MEP.'
  },
  {
    name: 'Chuyên Viên Mua Sắm & Pháp Lý',
    email: 'muasam.phaply@gmail.com',
    role: 'Khách hàng',
    plan: 'Gói Mua Sắm & Hợp Đồng (2 Skill)',
    avatar: '/assets/agent_muasam.png',
    isAdmin: false,
    skillIds: ['mua-sam', 'phap-ly'],
    desc: 'Tài khoản khách hàng chỉ mua 2 Skill: Bóc tách so sánh Đa báo giá và Rà soát Hợp đồng Pháp lý.'
  },
  {
    name: 'Khách Hàng Mới (Chưa Mua Gói)',
    email: 'khachhang.moi@gmail.com',
    role: 'Khách hàng',
    plan: 'Chưa kích hoạt (Dùng thử 15 phút)',
    avatar: '/assets/user_avatar.png',
    isAdmin: false,
    skillIds: [],
    desc: 'Tài khoản khách hàng mới đăng nhập: Chưa sở hữu Skill nào, chọn Cửa Hàng để dùng thử 15 phút bất kỳ Skill nào.'
  }
];

export function getUserOwnedSkillIds(userEmail, userRole) {
  if (!userEmail) return [];
  const emailLower = userEmail.toLowerCase().trim();

  // Chỉ khi role được backend xác nhận là owner hoặc admin mới có full quyền tất cả Skill
  if (userRole === 'owner' || userRole === 'admin' || userRole === 'Chủ sở hữu' || userRole === 'Admin') {
    return null; // Full all skills
  }

  // Đọc từ LocalStorage theo Email
  const storageKey = `tri_ai_user_skills_${emailLower}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  return [];
}

export function saveUserOwnedSkill(userEmail, skillId) {
  if (!userEmail) return;
  const emailLower = userEmail.toLowerCase().trim();
  const current = getUserOwnedSkillIds(userEmail, '') || [];
  if (!current.includes(skillId)) {
    const updated = [...current, skillId];
    try {
      localStorage.setItem(`tri_ai_user_skills_${emailLower}`, JSON.stringify(updated));
    } catch (e) {}
    return updated;
  }
  return current;
}

// =============================================================================
// QUẢN LÝ DÙNG THỬ 15 PHÚT (15-MINUTE TRIAL MANAGEMENT)
// =============================================================================

export function startSkillTrial(userEmail, skillId, durationMinutes = 15) {
  if (!userEmail || !skillId) return null;
  const emailLower = userEmail.toLowerCase().trim();
  const trialEndTime = Date.now() + durationMinutes * 60 * 1000;
  try {
    localStorage.setItem(`tri_ai_trial_${emailLower}_${skillId}`, trialEndTime.toString());
    localStorage.setItem(`tri_ai_active_trial_${emailLower}`, skillId);
  } catch (e) {}
  return trialEndTime;
}

export function getSkillTrialStatus(userEmail, skillId) {
  if (!userEmail || !skillId) return { hasTrial: false, remainingSeconds: 0, isExpired: false };
  const emailLower = userEmail.toLowerCase().trim();
  try {
    const raw = localStorage.getItem(`tri_ai_trial_${emailLower}_${skillId}`);
    if (!raw) return { hasTrial: false, remainingSeconds: 0, isExpired: false };
    const trialEndTime = parseInt(raw, 10);
    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((trialEndTime - now) / 1000));
    return {
      hasTrial: true,
      remainingSeconds,
      isExpired: remainingSeconds <= 0,
      trialEndTime
    };
  } catch (e) {
    return { hasTrial: false, remainingSeconds: 0, isExpired: false };
  }
}

export function getActiveTrial(userEmail) {
  if (!userEmail) return null;
  const emailLower = userEmail.toLowerCase().trim();
  try {
    const skillId = localStorage.getItem(`tri_ai_active_trial_${emailLower}`);
    if (!skillId) return null;
    const status = getSkillTrialStatus(userEmail, skillId);
    if (!status.hasTrial) return null;
    return {
      skillId,
      ...status
    };
  } catch (e) {
    return null;
  }
}

// =============================================================================
// HỆ THỐNG PHÊ DUYỆT & CẤP BẢN QUYỀN DUY NHẤT BỞI ADMIN (triqnnamabank@gmail.com)
// =============================================================================

export const MASTER_ADMIN_EMAIL = 'triqnnamabank@gmail.com';

const REQUESTS_STORAGE_KEY = 'tri_ai_license_requests_v1';

const DEFAULT_SAMPLE_REQUESTS = [
  {
    id: 'REQ-2026-001',
    email: 'khachhang.moi@gmail.com',
    userName: 'Tập Đoàn Xây Dựng Nam Á',
    skillId: 'mep',
    skillName: 'Gói Kỹ Sư Cơ Điện MEP',
    type: 'purchase',
    price: '299.000đ/tháng',
    time: '29/09/2026 20:45',
    status: 'pending', // Chờ Admin duyệt
    phone: '0908.123.456',
    notes: 'Đã chuyển khoản ngân hàng, chờ Admin kiểm tra và duyệt mở khóa'
  },
  {
    id: 'REQ-2026-002',
    email: 'doitac.bds@gmail.com',
    userName: 'Công Ty Quản Lý Tòa Nhà Sunrise',
    skillId: 'pccc',
    skillName: 'Gói Chuyên Gia PCCC & Thẩm Duyệt',
    type: 'trial',
    price: 'Dùng thử 15 phút',
    time: '29/09/2026 20:10',
    status: 'pending',
    phone: '0912.888.999',
    notes: 'Đăng ký dùng thử tính năng rà soát QCVN 06:2026/BXD'
  },
  {
    id: 'REQ-2026-003',
    email: 'kol.fashion@gmail.com',
    userName: 'Khách Hàng KOL Thời Trang',
    skillId: 'kol-thoi-trang',
    skillName: 'Gói KOL Thời Trang AI (Ý Ngọc Lookbook)',
    type: 'purchase',
    price: '399.000đ/tháng',
    time: '29/09/2026 18:30',
    status: 'approved',
    approvedBy: MASTER_ADMIN_EMAIL,
    approvedAt: '29/09/2026 18:32',
    phone: '0988.777.666',
    notes: 'Đã phê duyệt và cấp quyền sử dụng'
  },
  {
    id: 'REQ-2026-004',
    email: 'kythuat.pccc@gmail.com',
    userName: 'Kỹ Sư Công Trình',
    skillId: 'pccc',
    skillName: 'Gói Chuyên Gia PCCC',
    type: 'purchase',
    price: '199.000đ/tháng',
    time: '29/09/2026 17:15',
    status: 'approved',
    approvedBy: MASTER_ADMIN_EMAIL,
    approvedAt: '29/09/2026 17:20',
    phone: '0933.222.111',
    notes: 'Đã phê duyệt và cấp quyền sử dụng'
  }
];

export function getLicenseRequests() {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_REQUESTS));
      return DEFAULT_SAMPLE_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SAMPLE_REQUESTS;
    return parsed;
  } catch (e) {
    return DEFAULT_SAMPLE_REQUESTS;
  }
}

export function saveLicenseRequests(requests) {
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {}
}

export function createLicenseRequest({ email, userName, skillId, skillName, type = 'purchase', price = '99.000đ', phone = '', notes = '' }) {
  if (!email || !skillId) return null;
  const requests = getLicenseRequests();
  const newReq = {
    id: `REQ-${Date.now().toString().slice(-6)}`,
    email: email.toLowerCase().trim(),
    userName: userName || email.split('@')[0],
    skillId,
    skillName: skillName || skillId,
    type,
    price,
    phone: phone || '',
    notes: notes || 'Yêu cầu kích hoạt chờ Admin triqnnamabank@gmail.com phê duyệt',
    time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
    status: 'pending'
  };

  const updated = [newReq, ...requests];
  saveLicenseRequests(updated);
  return newReq;
}

export function approveLicenseRequest(requestId, adminEmail) {
  if (!adminEmail || adminEmail.toLowerCase().trim() !== MASTER_ADMIN_EMAIL) {
    console.error('Chỉ có Admin triqnnamabank@gmail.com mới có quyền phê duyệt cấp bán Skill/Agent.');
    return { success: false, message: 'Chỉ Admin triqnnamabank@gmail.com mới có quyền phê duyệt.' };
  }

  const requests = getLicenseRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index < 0) return { success: false, message: 'Không tìm thấy yêu cầu này.' };

  const req = requests[index];
  req.status = 'approved';
  req.approvedBy = MASTER_ADMIN_EMAIL;
  req.approvedAt = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  requests[index] = req;
  saveLicenseRequests(requests);

  // Tự động cấp quyền sở hữu Skill cho email khách hàng
  saveUserOwnedSkill(req.email, req.skillId);

  return { success: true, message: `Đã phê duyệt và cấp quyền Skill [${req.skillName}] cho tài khoản ${req.email}!`, request: req };
}

export function rejectLicenseRequest(requestId, adminEmail, reason = 'Chưa thanh toán hoặc không hợp lệ') {
  if (!adminEmail || adminEmail.toLowerCase().trim() !== MASTER_ADMIN_EMAIL) {
    return { success: false, message: 'Chỉ Admin triqnnamabank@gmail.com mới có quyền từ chối.' };
  }

  const requests = getLicenseRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index < 0) return { success: false, message: 'Không tìm thấy yêu cầu này.' };

  const req = requests[index];
  req.status = 'rejected';
  req.rejectedBy = MASTER_ADMIN_EMAIL;
  req.rejectedReason = reason;
  req.rejectedAt = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  requests[index] = req;
  saveLicenseRequests(requests);

  return { success: true, message: `Đã từ chối yêu cầu của tài khoản ${req.email}.`, request: req };
}

export function grantDirectLicense(customerEmail, skillId, skillName, adminEmail) {
  if (!adminEmail || adminEmail.toLowerCase().trim() !== MASTER_ADMIN_EMAIL) {
    return { success: false, message: 'Chỉ Admin triqnnamabank@gmail.com mới có quyền cấp bản quyền.' };
  }

  const emailLower = customerEmail.toLowerCase().trim();
  saveUserOwnedSkill(emailLower, skillId);

  // Tạo một bản ghi log đã cấp
  const requests = getLicenseRequests();
  const logReq = {
    id: `REQ-DIRECT-${Date.now().toString().slice(-5)}`,
    email: emailLower,
    userName: emailLower.split('@')[0].toUpperCase(),
    skillId,
    skillName: skillName || skillId,
    type: 'direct_grant',
    price: 'Admin cấp trực tiếp',
    time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
    status: 'approved',
    approvedBy: MASTER_ADMIN_EMAIL,
    approvedAt: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
    notes: 'Quản trị viên cấp quyền trực tiếp'
  };
  saveLicenseRequests([logReq, ...requests]);

  return { success: true, message: `Đã cấp trực tiếp quyền Skill [${skillName || skillId}] cho ${customerEmail}!` };
}

export function revokeCustomerLicense(customerEmail, skillId, adminEmail) {
  if (!adminEmail || adminEmail.toLowerCase().trim() !== MASTER_ADMIN_EMAIL) {
    return { success: false, message: 'Chỉ Admin triqnnamabank@gmail.com mới có quyền thu hồi bản quyền.' };
  }

  const emailLower = customerEmail.toLowerCase().trim();
  const current = getUserOwnedSkillIds(emailLower, '') || [];
  const updated = current.filter(id => id !== skillId);
  try {
    localStorage.setItem(`tri_ai_user_skills_${emailLower}`, JSON.stringify(updated));
  } catch (e) {}

  return { success: true, message: `Đã thu hồi quyền Skill [${skillId}] của tài khoản ${customerEmail}.` };
}

export function deleteCustomerLicenseRequest(requestId, customerEmail, skillId, adminEmail) {
  // 1. Xóa quyền trong kho skill của khách hàng
  if (customerEmail) {
    const emailLower = customerEmail.toLowerCase().trim();
    const current = getUserOwnedSkillIds(emailLower, '') || [];
    const updated = current.filter(id => id !== skillId && id !== 'master-33');
    try {
      localStorage.setItem(`tri_ai_user_skills_${emailLower}`, JSON.stringify(updated));
    } catch (e) {}
  }

  // 2. Xóa bản ghi trong danh sách yêu cầu
  const requests = getLicenseRequests();
  const updatedRequests = requests.filter(r => r.id !== requestId);
  saveLicenseRequests(updatedRequests);

  return { 
    success: true, 
    message: `Đã xóa vĩnh viễn quyền và bản ghi của tài khoản ${customerEmail || 'này'}.` 
  };
}

