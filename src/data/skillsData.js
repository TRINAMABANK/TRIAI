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
  }
];

export function getUserOwnedSkillIds(userEmail, userRole) {
  if (!userEmail) return ['pccc'];
  const emailLower = userEmail.toLowerCase().trim();

  // Admin hoặc Chủ sở hữu có full tất cả Skill
  if (emailLower === 'triqnnamabank@gmail.com' || userRole === 'Chủ sở hữu' || userRole === 'Admin') {
    return null; // Full all skills
  }

  // Đọc từ LocalStorage theo Email
  const storageKey = `tri_ai_user_skills_${emailLower}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  // Kiểm tra tài khoản test mẫu
  const matchedTest = USER_TEST_ACCOUNTS.find(acc => acc.email.toLowerCase() === emailLower);
  if (matchedTest) {
    return matchedTest.skillIds;
  }

  // Khách hàng mới đăng ký email bất kỳ: Mặc định cấp 1 Skill dùng thử ban đầu
  return ['pccc'];
}

export function saveUserOwnedSkill(userEmail, skillId) {
  if (!userEmail) return;
  const emailLower = userEmail.toLowerCase().trim();
  const current = getUserOwnedSkillIds(userEmail, '') || ['pccc'];
  if (!current.includes(skillId)) {
    const updated = [...current, skillId];
    try {
      localStorage.setItem(`tri_ai_user_skills_${emailLower}`, JSON.stringify(updated));
    } catch (e) {}
    return updated;
  }
  return current;
}
