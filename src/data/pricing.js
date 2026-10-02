// ==============================================================================
// TRÍ AI SAAS PLATFORM — COMMERCIAL PRICING & PRODUCT CATALOG
// SINGLE SOURCE OF TRUTH (FRONTEND & BACKEND)
// ==============================================================================

export const PRICING_CATALOG = {
  // 1. SKILL ĐƠN LẺ
  skills: [
    {
      id: 'skill-mua-sam',
      skillId: 'mua-sam',
      type: 'skill',
      name: 'Skill Mua Sắm & Báo Giá',
      category: 'Doanh nghiệp & Đấu thầu',
      description: 'Bóc tách báo giá, so sánh nhà cung cấp và lập tờ trình mua sắm chuẩn ISO.',
      monthlyPrice: 199000,
      yearlyPrice: 1990000,
      savingsBadge: 'Tiết kiệm 2 tháng',
      badge: 'Phổ biến nhất',
      color: 'orange',
      iconName: 'ShoppingCart',
      features: [
        'Bóc tách dự toán & so sánh đa báo giá tự động',
        'Lập tờ trình mua sắm chuẩn quy trình ISO',
        'Đánh giá năng lực nhà cung cấp & kiểm tra CO/CQ',
        'Đàm phán tối ưu 10-15% tổng chi phí đơn hàng'
      ],
      capabilities: [
        'Xuất báo cáo định dạng Word, Excel, PDF',
        'Gắn trực tiếp vào Trợ lý Mua sắm AI'
      ]
    },
    {
      id: 'skill-pccc',
      skillId: 'pccc',
      type: 'skill',
      name: 'Skill PCCC & Thẩm Duyệt',
      category: 'Kỹ thuật & Pháp quy',
      description: 'Rà soát hồ sơ, checklist an toàn và điểm cần kiểm tra theo QCVN 06:2026/BXD.',
      monthlyPrice: 249000,
      yearlyPrice: 2490000,
      savingsBadge: 'Tiết kiệm 2 tháng',
      badge: 'Bán chạy nhất',
      color: 'red',
      iconName: 'Flame',
      features: [
        'Đối chiếu quy chuẩn PCCC QCVN 06:2026/BXD mới nhất',
        'Rà soát biên bản nghiệm thu & thử nghiệm hệ thống',
        'Khoanh vùng điểm checklist an toàn cần khắc phục',
        'Xuất báo cáo kỹ thuật nghiệm thu PCCC chuyên sâu'
      ],
      capabilities: [
        'Xuất báo cáo định dạng Word, Excel, PDF',
        'Gắn trực tiếp vào Trợ lý Kỹ sư M&E / PCCC'
      ]
    },
    {
      id: 'skill-mep',
      skillId: 'mep',
      type: 'skill',
      name: 'Skill MEP & Vận Hành Tòa Nhà',
      category: 'Vận hành kỹ thuật',
      description: 'Phân tích sự cố, nhật ký bảo trì và xây dựng quy trình vận hành kỹ thuật.',
      monthlyPrice: 299000,
      yearlyPrice: 2990000,
      savingsBadge: 'Tiết kiệm 2 tháng',
      color: 'blue',
      iconName: 'Building2',
      features: [
        'Sơ đồ vận hành MEPF & điều hòa thông gió HVAC',
        'Nhật ký kiểm tra thiết bị định kỳ hàng tuần/tháng',
        'Quy trình ứng phó khẩn cấp sự cố cơ điện tòa nhà',
        'Kế hoạch bảo trì phòng ngừa rủi ro hư hỏng thiết bị'
      ],
      capabilities: [
        'Xuất báo cáo định dạng Word, Excel, PDF',
        'Gắn trực tiếp vào Trợ lý Kỹ sư M&E'
      ]
    },
    {
      id: 'skill-phap-ly',
      skillId: 'phap-ly',
      type: 'skill',
      name: 'Skill Pháp Lý & Hợp Đồng',
      category: 'Pháp chế & Hợp đồng',
      description: 'Rà soát điều khoản hợp đồng, cảnh báo rủi ro bồi thường và thẩm quyền pháp lý.',
      monthlyPrice: 299000,
      yearlyPrice: 2990000,
      savingsBadge: 'Tiết kiệm 2 tháng',
      color: 'purple',
      iconName: 'Scale',
      features: [
        'Rà soát điều khoản hợp đồng kinh tế & EPC',
        'Đối chiếu căn cứ pháp luật và thẩm quyền đại diện',
        'Cảnh báo rủi ro bồi thường & tạm ứng thanh toán',
        'Soạn thảo văn bản pháp lý & biên bản thỏa thuận'
      ],
      capabilities: [
        'Xuất báo cáo định dạng Word, Excel, PDF',
        'Gắn trực tiếp vào Trợ lý Pháp lý'
      ]
    },
    {
      id: 'skill-kol',
      skillId: 'kol-thoi-trang',
      type: 'skill',
      name: 'Skill KOL & Visual AI',
      category: 'Sáng tạo & Visual Marketing',
      description: 'Thiết kế concept, prompt hình ảnh, chiến dịch Visual AI và giữ nhận diện nhân vật.',
      monthlyPrice: 399000,
      yearlyPrice: 3990000,
      savingsBadge: 'Tiết kiệm 2 tháng',
      badge: 'Công nghệ mới',
      color: 'pink',
      iconName: 'Sparkles',
      features: [
        'Khóa nhận diện gương mặt nhân vật nhất quán',
        'Tạo concept & prompt hình ảnh Lookbook chuyên nghiệp',
        'Xây dựng chiến dịch Visual Campaign đa phong cách',
        'Tích hợp quy trình Reference Image thông minh'
      ],
      capabilities: [
        'Tự động tích hợp vào Trợ lý KOL Studio',
        'Chi phí tạo ảnh / tool bên ngoài có thể tính riêng'
      ]
    }
  ],

  // Giá mặc định cho các Skill phổ thông khác trong 33 Skill
  defaultSkillPrice: {
    monthlyPrice: 149000,
    yearlyPrice: 1490000,
    savingsBadge: 'Tiết kiệm 2 tháng'
  },

  // 2. GÓI COMBO
  combos: [
    {
      id: 'combo-5',
      type: 'combo',
      name: 'Combo 5 Skill Cốt Lõi',
      category: 'Gói Kết Hợp',
      badge: 'Tiết kiệm 45%',
      description: 'Trọn bộ 5 Skill phổ biến nhất: Mua Sắm, Phân Tích Chi Phí, Pháp Lý, PCCC và MEP.',
      monthlyPrice: 699000,
      yearlyPrice: 6990000,
      savingsBadge: 'Tiết kiệm 2 tháng',
      includedSkills: ['mua-sam', 'tai-chinh', 'phap-ly', 'pccc', 'mep'],
      includedSkillNames: [
        'Skill Mua Sắm & Báo Giá',
        'Skill Phân Tích Chi Phí & Dự Toán',
        'Skill Pháp Lý & Hợp Đồng',
        'Skill PCCC & Thẩm Duyệt',
        'Skill MEP & Vận Hành Tòa Nhà'
      ],
      features: [
        'Mở khóa bản quyền cho 5 Skill cốt lõi phổ biến nhất',
        'Tương thích toàn bộ 5 Trợ lý Chuyên gia AI',
        'Tự động kích hoạt 5 License riêng biệt trên hệ thống',
        'Xuất báo cáo không giới hạn định dạng Word, Excel, PDF',
        'Hỗ trợ kỹ thuật ưu tiên từ đội ngũ TRÍ AI'
      ]
    }
  ],

  // 3. GÓI DOANH NGHIỆP (ENTERPRISE)
  enterprise: {
    id: 'enterprise',
    type: 'enterprise',
    name: 'Gói Doanh Nghiệp (Enterprise)',
    category: 'Doanh Nghiệp B2B',
    badge: 'Giải pháp Doanh nghiệp',
    description: '8 Skill cốt lõi, quyền quản trị đội nhóm, không gian làm việc tri thức riêng (Knowledge & Files) và AI Runtime chuyên sâu.',
    monthlyPrice: 999000,
    yearlyPrice: 9990000,
    savingsBadge: 'Tiết kiệm 2 tháng',
    includedSkills: [
      'mua-sam',
      'pccc',
      'mep',
      'phap-ly',
      'tai-chinh',
      'van-hanh-toa-nha',
      'kol-thoi-trang',
      'tham-dinh-du-an'
    ],
    includedSkillNames: [
      'Mua Sắm & Báo Giá',
      'PCCC & Thẩm Duyệt',
      'MEP & Cơ Điện',
      'Pháp Lý & Hợp Đồng',
      'Tài Chính & Dự Toán',
      'Vận Hành Tòa Nhà',
      'KOL & Visual AI',
      'Thẩm Định Dự Án'
    ],
    features: [
      'Mở khóa trọn bộ 8 Skill chuyên môn cốt lõi',
      'Sử dụng toàn bộ các Agent chuyên gia tương ứng',
      'Quản lý người dùng và phân quyền đội ngũ',
      'Kho tri thức riêng (Knowledge Base) cho doanh nghiệp',
      'Kho lưu trữ tệp riêng biệt và bảo mật cao',
      'Lưu trữ và tra cứu lịch sử hội thoại chuyên sâu',
      'Báo cáo và thống kê sử dụng hệ thống',
      'Hỗ trợ kỹ thuật ưu tiên 24/7'
    ]
  },

  // 4. GÓI MASTER 33 SKILL
  master: {
    id: 'master-33',
    type: 'master',
    name: 'TRÍ AI Master — Trọn Bộ 33 Skill',
    category: 'Toàn diện (All-in-One)',
    badge: 'Trọn Bộ Toàn Diện VIP',
    description: 'Toàn bộ 33 Skill chuyên nghiệp trong hệ sinh thái TRÍ AI, toàn bộ Agent hiện có và tải gói Skill Pack.',
    monthlyPrice: 1490000,
    yearlyPrice: 14900000,
    savingsBadge: 'Tiết kiệm 2 tháng',
    includedSkills: 'all_33',
    downloadUrl: '/data/TRI-AI-SKILLS-V1.zip',
    features: [
      'Sở hữu toàn bộ 33 Skill chuyên nghiệp hiện có',
      'Sử dụng toàn bộ các Trợ lý AI trong hệ thống',
      'Tải gói Skill Pack (TRI-AI-SKILLS-V1.zip)',
      'Tải file cấu hình JSON Master tương thích hệ sinh thái AI',
      'Không gian làm việc riêng biệt (Knowledge & Files)',
      'AI Runtime chuyên sâu với mô hình tối ưu',
      'Cập nhật các Skill mới theo chính sách hệ thống',
      'Hỗ trợ xuất hóa đơn và hướng dẫn triển khai cho doanh nghiệp'
    ]
  },

  // 5. CẤU HÌNH AGENT VÀ CÁC SKILL TƯƠNG ỨNG
  agents: [
    {
      id: 'tro-ly-mua-sam',
      name: 'Trợ lý Mua Sắm',
      role: 'Chuyên gia Procurement & Báo giá',
      avatar: '/assets/agent_muasam.png',
      requiredSkillIds: ['mua-sam', 'tai-chinh', 'phap-ly'],
      requiredSkillNames: ['Skill Mua Sắm', 'Skill Tài Chính', 'Skill Pháp Lý'],
      desc: 'Bóc tách báo giá, so sánh nhà cung cấp, đánh giá CO/CQ và soạn tờ trình phê duyệt.'
    },
    {
      id: 'anh-an',
      name: 'Trợ lý Kỹ Sư M&E / PCCC',
      role: 'Kỹ sư trưởng & Tham mưu kỹ thuật',
      avatar: '/assets/agent_an.png',
      requiredSkillIds: ['pccc', 'mep', 'van-hanh-toa-nha'],
      requiredSkillNames: ['Skill PCCC', 'Skill MEP', 'Skill Vận Hành Tòa Nhà'],
      desc: 'Rà soát hồ sơ nghiệm thu PCCC, thẩm tra bản vẽ hoàn công và quy trình vận hành MEP.'
    },
    {
      id: 'tro-ly-phap-ly',
      name: 'Trợ lý Pháp Lý',
      role: 'Cố vấn Pháp chế & Hợp đồng',
      avatar: '/assets/agent_phaply.png',
      requiredSkillIds: ['phap-ly', 'pccc'],
      requiredSkillNames: ['Skill Pháp Lý', 'Skill PCCC'],
      desc: 'Rà soát hợp đồng kinh tế/EPC, căn cứ luật xây dựng, cảnh báo rủi ro phạt vi phạm.'
    },
    {
      id: 'tro-ly-tai-chinh',
      name: 'Trợ lý Tài Chính',
      role: 'Chuyên gia Dự toán & Dòng tiền',
      avatar: '/assets/agent_taichinh.png',
      requiredSkillIds: ['tai-chinh', 'mua-sam'],
      requiredSkillNames: ['Skill Tài Chính', 'Skill Mua Sắm'],
      desc: 'Thẩm định dự toán ngân sách CAPEX/OPEX, dự báo dòng tiền và tối ưu chi phí dự án.'
    },
    {
      id: 'tro-ly-kol',
      name: 'Trợ lý KOL & Visual AI',
      role: 'Giám đốc Sáng tạo & Visual Campaign',
      avatar: '/assets/y_ngoc_aodai.jpg',
      requiredSkillIds: ['kol-thoi-trang'],
      requiredSkillNames: ['Skill KOL & Visual AI'],
      desc: 'Thiết kế concept hình ảnh, Lookbook thời trang cao cấp và giữ nhận diện gương mặt nhất quán.'
    }
  ]
};

/**
 * Format currency VND cleanly
 */
export function formatVND(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 đ';
  return amount.toLocaleString('vi-VN') + ' đ';
}

/**
 * Helper to resolve price by product ID and billing cycle
 */
export function resolveProductPrice(productId, billingCycle = 'monthly') {
  // Check skills
  const skill = PRICING_CATALOG.skills.find(
    s => s.id === productId || s.skillId === productId || s.id === `skill-${productId}`
  );
  if (skill) {
    return billingCycle === 'yearly' ? skill.yearlyPrice : skill.monthlyPrice;
  }

  // Check combos
  const combo = PRICING_CATALOG.combos.find(c => c.id === productId || c.id === `store-${productId}`);
  if (combo) {
    return billingCycle === 'yearly' ? combo.yearlyPrice : combo.monthlyPrice;
  }

  // Check enterprise
  if (productId === 'enterprise' || productId === 'store-enterprise') {
    return billingCycle === 'yearly'
      ? PRICING_CATALOG.enterprise.yearlyPrice
      : PRICING_CATALOG.enterprise.monthlyPrice;
  }

  // Check master
  if (productId === 'master-33' || productId === 'store-master-33') {
    return billingCycle === 'yearly'
      ? PRICING_CATALOG.master.yearlyPrice
      : PRICING_CATALOG.master.monthlyPrice;
  }

  // Default skill price
  return billingCycle === 'yearly'
    ? PRICING_CATALOG.defaultSkillPrice.yearlyPrice
    : PRICING_CATALOG.defaultSkillPrice.monthlyPrice;
}

export default PRICING_CATALOG;
