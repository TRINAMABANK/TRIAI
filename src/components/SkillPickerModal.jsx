import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Check, 
  ShoppingCart, 
  Flame, 
  Building2, 
  Scale, 
  Cpu, 
  Package, 
  BarChart3, 
  FileText,
  Zap,
  ArrowRight,
  ShieldCheck,
  Lock,
  Unlock
} from 'lucide-react';

export default function SkillPickerModal({ 
  isOpen, 
  onClose, 
  skills = [], 
  ownedSkills = [],
  isAdmin = false,
  user = { isLoggedIn: false },
  activeSkill = {}, 
  onSelectSkill,
  onOpenStore,
  onOpenSkillManager
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all' | 'owned'

  if (!isOpen) return null;

  // Categories list
  const categories = [
    { id: 'all', label: 'Tất cả lĩnh vực' },
    { id: 'kythuat', label: 'Kỹ thuật & MEP/PCCC' },
    { id: 'quanly', label: 'Quản lý & Vận hành' },
    { id: 'marketing', label: 'KOL & Marketing' },
    { id: 'phaply', label: 'Pháp lý & Tài chính' }
  ];

  const effectiveOwnedSkills = isAdmin ? skills : ownedSkills;
  const ownedCount = effectiveOwnedSkills.length;

  // Filter skills
  const filteredSkills = skills.filter(skill => {
    const isOwned = isAdmin || ownedSkills.some(os => os.id === skill.id);
    
    if (ownershipFilter === 'owned' && !isOwned) return false;

    const matchesSearch = !searchTerm || 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (skill.desc && skill.desc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (skill.category && skill.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    
    const cat = (skill.category || '').toLowerCase();
    const name = (skill.name || '').toLowerCase();
    
    if (selectedCategory === 'kythuat') {
      return cat.includes('kỹ thuật') || name.includes('pccc') || name.includes('mep') || name.includes('nghiệm thu');
    }
    if (selectedCategory === 'quanly') {
      return cat.includes('quản lý') || cat.includes('vận hành') || name.includes('tòa nhà') || name.includes('tài sản') || name.includes('mua sắm');
    }
    if (selectedCategory === 'marketing') {
      return cat.includes('marketing') || cat.includes('kol') || name.includes('kol') || name.includes('thời trang') || name.includes('ý ngọc');
    }
    if (selectedCategory === 'phaply') {
      return cat.includes('pháp') || cat.includes('tài chính') || cat.includes('thuế') || name.includes('pháp lý') || name.includes('chi phí') || name.includes('kế toán');
    }
    return true;
  });

  const getSkillIcon = (skill) => {
    const name = (skill.name || '').toLowerCase();
    if (name.includes('pccc') || name.includes('chữa cháy')) return Flame;
    if (name.includes('kol') || name.includes('thời trang')) return Sparkles;
    if (name.includes('mep') || name.includes('kỹ sư')) return Cpu;
    if (name.includes('tòa nhà') || name.includes('vận hành')) return Building2;
    if (name.includes('mua sắm') || name.includes('đấu thầu')) return ShoppingCart;
    if (name.includes('pháp lý') || name.includes('hợp đồng')) return Scale;
    if (name.includes('tài sản') || name.includes('kho')) return Package;
    if (name.includes('chi phí') || name.includes('kế toán')) return BarChart3;
    return FileText;
  };

  const handlePick = (skill, isOwned) => {
    if (!isOwned) {
      if (onOpenStore) {
        onClose();
        onOpenStore();
      }
      return;
    }
    if (onSelectSkill) {
      onSelectSkill(skill);
    }
    onClose();
  };

  return (
    <div className="modal-overlay skill-picker-modal-overlay" onClick={onClose}>
      <div className="modal-container skill-picker-card" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="skill-picker-header">
          <div className="picker-title-group">
            <div className="picker-icon-box">
              <Layers size={22} className="picker-header-icon" />
            </div>
            <div>
              <h3 className="picker-title">Chọn Bộ Kỹ Năng (Skill) Thực Thi</h3>
              <p className="picker-sub">
                {isAdmin ? (
                  <>👑 Tài khoản <b>Quản trị viên</b>: Toàn quyền sở hữu trọn bộ <b>{skills.length} Skill</b></>
                ) : (
                  <>👤 Đang sở hữu <b>{ownedCount} / {skills.length} Skill</b> của hệ sinh thái Trí AI</>
                )}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Đóng (CLOSE)">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="skill-picker-body">
          {/* Top Filter Tabs: Owned vs All */}
          {!isAdmin && (
            <div className="picker-ownership-toggle-row">
              <button 
                type="button" 
                className={`ownership-pill ${ownershipFilter === 'owned' ? 'active' : ''}`}
                onClick={() => setOwnershipFilter('owned')}
              >
                <Unlock size={14} /> Skill đã mua ({ownedCount})
              </button>
              <button 
                type="button" 
                className={`ownership-pill ${ownershipFilter === 'all' ? 'active' : ''}`}
                onClick={() => setOwnershipFilter('all')}
              >
                <Layers size={14} /> Tất cả Skill ({skills.length})
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="picker-search-bar">
            <Search size={16} className="picker-search-icon" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhanh Skill theo tên hoặc chuyên ngành..."
              className="picker-search-input"
              autoFocus
            />
            {searchTerm && (
              <button className="picker-clear-btn" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="picker-category-row">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`picker-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Skills Grid */}
          <div className="picker-skills-grid">
            {filteredSkills.map(skill => {
              const isSelected = activeSkill.id === skill.id;
              const isOwned = isAdmin || ownedSkills.some(os => os.id === skill.id);
              const IconComponent = getSkillIcon(skill);

              return (
                <div 
                  key={skill.id}
                  className={`picker-skill-tile ${isSelected ? 'is-active' : ''} ${!isOwned ? 'is-locked-tile' : ''} ${skill.color || 'blue'}`}
                  onClick={() => handlePick(skill, isOwned)}
                  title={isOwned ? `Chọn Skill ${skill.name}` : `Skill chưa mở khóa. Bấm để mua tại Store.`}
                >
                  <div className="tile-top-row">
                    <div className={`tile-icon-wrap ${skill.color || 'blue'} ${!isOwned ? 'locked-icon-wrap' : ''}`}>
                      <IconComponent size={20} />
                    </div>
                    {isSelected ? (
                      <span className="tile-active-badge">
                        <Check size={12} /> Đang dùng
                      </span>
                    ) : isOwned ? (
                      <span className="tile-ready-badge">
                        <ShieldCheck size={12} /> Đã mở khóa
                      </span>
                    ) : (
                      <span className="tile-locked-badge">
                        <Lock size={12} /> Chưa mở khóa
                      </span>
                    )}
                  </div>

                  <div className="tile-info-block">
                    <h4 className="tile-name">{skill.name}</h4>
                    <p className="tile-desc">{skill.desc || 'Tự động hóa phân tích & xử lý quy trình chuyên môn.'}</p>
                  </div>

                  <div className="tile-footer-row">
                    <span className="tile-cat-tag">{skill.category || 'Chuyên môn'}</span>
                    {isOwned ? (
                      <button type="button" className={`tile-select-btn ${isSelected ? 'is-curr' : ''}`}>
                        {isSelected ? 'Đang chọn' : 'Áp dụng'}
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="tile-buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePick(skill, false);
                        }}
                      >
                        <ShoppingCart size={12} /> Mua ngay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredSkills.length === 0 && (
              <div className="picker-empty-state">
                <Layers size={36} className="empty-icon" />
                <h4>Không tìm thấy Skill phù hợp với "{searchTerm}"</h4>
                <p>Anh có thể nạp thêm Skill mới hoặc ghé Cửa Hàng Skill để mở khóa thêm năng lực AI.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="skill-picker-footer">
          <div className="picker-footer-left">
            <span className="footer-tip">
              💡 <b>Mẹo:</b> Khi kích hoạt Skill, Trí AI sẽ áp dụng đúng kiến thức nghiệp vụ chuyên biệt của lĩnh vực đó.
            </span>
          </div>
          <div className="picker-footer-actions">
            {onOpenStore && (
              <button 
                type="button" 
                className="btn-picker-store"
                onClick={() => {
                  onClose();
                  onOpenStore();
                }}
              >
                <ShoppingCart size={15} />
                <span>Mua thêm gói Skill</span>
              </button>
            )}
            {isAdmin && onOpenSkillManager && (
              <button 
                type="button" 
                className="btn-picker-manage"
                onClick={() => {
                  onClose();
                  onOpenSkillManager();
                }}
              >
                <span>+ Nạp Skill mới</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
