// ==============================================================================
// TRÍ AI SAAS PLATFORM — BACKEND PRICING CONFIGURATION & RESOLVER
// SOURCE OF TRUTH FOR ORDER TOTALS & INCLUDED SKILLS
// ==============================================================================

export const PRICING_CATALOG = {
  skills: [
    {
      id: 'skill-mua-sam',
      skillId: 'mua-sam',
      name: 'Skill Mua Sắm & Báo Giá',
      monthlyPrice: 199000,
      yearlyPrice: 1990000
    },
    {
      id: 'skill-pccc',
      skillId: 'pccc',
      name: 'Skill PCCC & Thẩm Duyệt',
      monthlyPrice: 249000,
      yearlyPrice: 2490000
    },
    {
      id: 'skill-mep',
      skillId: 'mep-mepf',
      name: 'Skill MEP & Vận Hành Tòa Nhà',
      monthlyPrice: 299000,
      yearlyPrice: 2990000
    },
    {
      id: 'skill-phap-ly',
      skillId: 'phap-ly-tuan-thu',
      name: 'Skill Pháp Lý & Hợp Đồng',
      monthlyPrice: 299000,
      yearlyPrice: 2990000
    },
    {
      id: 'skill-kol',
      skillId: 'kol-thoi-trang',
      name: 'Skill KOL & Visual AI',
      monthlyPrice: 399000,
      yearlyPrice: 3990000
    }
  ],

  defaultSkillPrice: {
    monthlyPrice: 149000,
    yearlyPrice: 1490000
  },

  combos: [
    {
      id: 'combo-5',
      name: 'Combo 5 Skill Cốt Lõi',
      monthlyPrice: 699000,
      yearlyPrice: 6990000,
      includedSkills: ['mua-sam', 'phan-tich-chi-phi', 'soan-thao-qa', 'kiem-tra-can-cu', 'khung-hanh-dong']
    }
  ],

  enterprise: {
    id: 'enterprise',
    name: 'Gói Doanh Nghiệp (Enterprise)',
    monthlyPrice: 999000,
    yearlyPrice: 9990000,
    includedSkills: [
      'mua-sam',
      'pccc',
      'mep-mepf',
      'phap-ly-tuan-thu',
      'phan-tich-chi-phi',
      'van-hanh-toa-nha',
      'kol-thoi-trang',
      'khung-hanh-dong'
    ]
  },

  master: {
    id: 'master-33',
    name: 'TRÍ AI Master — Trọn Bộ 33 Skill',
    monthlyPrice: 1490000,
    yearlyPrice: 14900000,
    includedSkills: 'all_33'
  }
};

/**
 * Resolve product details, prices, and included skill IDs
 */
export function resolveOrderProduct(productId, period = 'monthly') {
  const normId = (productId || '').toLowerCase().trim();

  // 1. Check Master 33
  if (normId === 'master-33' || normId === 'store-master-33' || normId === 'all_33') {
    const isYearly = period === 'yearly';
    const price = isYearly ? PRICING_CATALOG.master.yearlyPrice : PRICING_CATALOG.master.monthlyPrice;
    return {
      productId: 'master-33',
      productName: PRICING_CATALOG.master.name,
      type: 'master',
      period: isYearly ? 'yearly' : 'monthly',
      price,
      unitPrice: price,
      includedSkills: 'all_33'
    };
  }

  // 2. Check Enterprise
  if (normId === 'enterprise' || normId === 'store-enterprise') {
    const isYearly = period === 'yearly';
    const price = isYearly ? PRICING_CATALOG.enterprise.yearlyPrice : PRICING_CATALOG.enterprise.monthlyPrice;
    return {
      productId: 'enterprise',
      productName: PRICING_CATALOG.enterprise.name,
      type: 'enterprise',
      period: isYearly ? 'yearly' : 'monthly',
      price,
      unitPrice: price,
      includedSkills: PRICING_CATALOG.enterprise.includedSkills
    };
  }

  // 3. Check Combo 5
  if (normId === 'combo-5' || normId === 'store-combo-5' || normId.includes('combo')) {
    const combo = PRICING_CATALOG.combos[0];
    const isYearly = period === 'yearly';
    const price = isYearly ? combo.yearlyPrice : combo.monthlyPrice;
    return {
      productId: 'combo-5',
      productName: combo.name,
      type: 'combo',
      period: isYearly ? 'yearly' : 'monthly',
      price,
      unitPrice: price,
      includedSkills: combo.includedSkills
    };
  }

  // 4. Check Single Skills
  const mappedSkill = PRICING_CATALOG.skills.find(
    s => s.id === normId || s.skillId === normId || `store-${s.skillId}` === normId || `skill-${s.skillId}` === normId ||
         (s.skillId === 'mep-mepf' && (normId === 'mep' || normId === 'skill-mep')) ||
         (s.skillId === 'phap-ly-tuan-thu' && (normId === 'phap-ly' || normId === 'skill-phap-ly'))
  );

  const isYearly = period === 'yearly';
  if (mappedSkill) {
    const price = isYearly ? mappedSkill.yearlyPrice : mappedSkill.monthlyPrice;
    return {
      productId: mappedSkill.skillId,
      productName: mappedSkill.name,
      type: 'skill',
      period: isYearly ? 'yearly' : 'monthly',
      price,
      unitPrice: price,
      includedSkills: [mappedSkill.skillId]
    };
  }

  // 5. Default single skill price (149.000đ / tháng, 1.490.000đ / năm)
  const price = isYearly ? PRICING_CATALOG.defaultSkillPrice.yearlyPrice : PRICING_CATALOG.defaultSkillPrice.monthlyPrice;
  return {
    productId: normId,
    productName: `Skill ${normId}`,
    type: 'skill',
    period: isYearly ? 'yearly' : 'monthly',
    price,
    unitPrice: price,
    includedSkills: [normId]
  };
}

export default PRICING_CATALOG;
