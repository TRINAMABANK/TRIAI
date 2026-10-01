import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Sparkles, 
  CheckCircle, 
  CheckCircle2,
  Play, 
  Layers, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Flame,
  ShoppingCart,
  Package,
  Building2,
  Cpu,
  Scale,
  FileText,
  FileCheck,
  BarChart3,
  DollarSign,
  Clock,
  Bot,
  TrendingUp,
  Leaf,
  MessageSquare,
  Code2,
  Palette,
  Video,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';

const ICON_MAP = {
  Sparkles,
  ShoppingCart,
  Package,
  Building2,
  Cpu,
  Flame,
  Scale,
  FileText,
  FileCheck,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  Clock,
  Bot,
  Layers,
  TrendingUp,
  Leaf,
  MessageSquare,
  Code2,
  Palette,
  Video,
  AlertTriangle
};

export default function SkillsView({ 
  skills = [], 
  ownedSkills = [],
  isAdmin = false,
  user = { isLoggedIn: false },
  activeSkill = {}, 
  onSelectSkill, 
  onOpenSkillManager,
  onSwitchToChat,
  onOpenStore
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all' | 'owned'
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const effectiveOwnedSkills = isAdmin ? skills : ownedSkills;
  const ownedCount = effectiveOwnedSkills.length;

  // Trích xuất tự động danh mục từ toàn bộ Skill
  const categories = ['Tất cả', ...Array.from(new Set(skills.map(s => s.category).filter(Boolean)))];

  const filteredSkills = skills.filter(skill => {
    const isOwned = isAdmin || ownedSkills.some(os => os.id === skill.id);
    if (ownershipFilter === 'owned' && !isOwned) return false;

    const matchesSearch = skill.name.toLowerCase().includes(search.toLowerCase()) || 
                          skill.desc.toLowerCase().includes(search.toLowerCase()) ||
                          (skill.category && skill.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'Tất cả' || skill.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleExportSkillJson = (skill) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(skill, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Skill_${skill.id}_TriAI.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`✅ Đã xuất thành công gói Skill [${skill.name}] (.json) về máy!`);
  };

  const handleUseInChat = (skill) => {
    if (onSelectSkill) onSelectSkill(skill);
    if (onSwitchToChat) onSwitchToChat(skill.samplePrompt || `Kích hoạt năng lực chuyên môn từ Skill: ${skill.name}`);
  };

  return (
    <div className="view-page-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="status-notification-banner success" style={{ marginBottom: '16px' }}>
          <div className="notif-banner-left">
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
          <button type="button" className="notif-banner-close" onClick={() => setToastMsg('')}>
            ✕
          </button>
        </div>
      )}

      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">
            {isAdmin ? '👑 Quản trị viên Toàn Quyền' : `👤 Khách hàng sở hữu ${ownedCount}/${skills.length} Skill`}
          </div>
          <h1 className="view-title">Kho Skill Chuyên Ngành</h1>
          <p className="view-desc">
            {isAdmin 
              ? 'Toàn bộ 33+ bộ kỹ năng trí tuệ nhân tạo chuyên sâu đã được mở khóa với đầy đủ mã nguồn & prompt độc quyền.'
              : `Tài khoản ${user.email || 'của bạn'} đang sở hữu ${ownedCount} Skill. Các Skill khác có thể mở khóa tại Cửa Hàng.`
            }
          </p>
        </div>
        
        <div className="view-actions-row">
          {isAdmin ? (
            <>
              <a 
                href="/data/TRI-AI-SKILLS-V1.zip" 
                download="TRI-AI-SKILLS-V1.zip"
                className="btn-secondary" 
                onClick={() => showToast('✅ Bắt đầu tải trọn bộ 33 Skill (.ZIP) về máy của anh Trí!')}
                title="Tải trọn bộ 33 Skill độc quyền (file ZIP)"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={16} /> Tải Trọn Bộ 33 Skill (.ZIP)
              </a>
              {onOpenSkillManager && (
                <>
                  <button className="btn-secondary" onClick={() => onOpenSkillManager()}>
                    <Upload size={16} /> Nạp Skill (.JSON)
                  </button>
                  <button className="btn-primary" onClick={() => onOpenSkillManager()}>
                    <Plus size={16} /> Tạo Skill mới
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {onOpenStore && (
                <button className="btn-primary" onClick={() => onOpenStore()}>
                  <ShoppingCart size={16} /> Cửa Hàng Mở Khóa Skill
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="view-controls-card">
        {/* Ownership Toggle for non-admin */}
        {!isAdmin && (
          <div className="skills-view-ownership-tabs" style={{ marginBottom: '14px', display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className={`cat-pill ${ownershipFilter === 'owned' ? 'active' : ''}`}
              onClick={() => setOwnershipFilter('owned')}
              style={{ fontWeight: 600 }}
            >
              <Unlock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Skill của tôi ({ownedCount})
            </button>
            <button 
              type="button" 
              className={`cat-pill ${ownershipFilter === 'all' ? 'active' : ''}`}
              onClick={() => setOwnershipFilter('all')}
              style={{ fontWeight: 600 }}
            >
              <Layers size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Tất cả Skill ({skills.length})
            </button>
          </div>
        )}

        <div className="view-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên skill, từ khóa chuyên ngành, mã quy chuẩn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div className="view-categories-scroll">
          {categories.map((cat) => (
            <button 
              key={cat} 
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="skills-cards-grid">
        {filteredSkills.map((skill) => {
          const IconComponent = ICON_MAP[skill.iconName] || Sparkles;
          const isActive = activeSkill?.id === skill.id;
          const isOwned = isAdmin || ownedSkills.some(os => os.id === skill.id);

          return (
            <div 
              key={skill.id} 
              className={`skill-master-card ${isActive ? 'is-active-skill' : ''} ${!isOwned ? 'is-unowned-skill-card' : ''}`}
            >
              <div className="skill-card-top">
                <div className={`skill-icon-bubble ${skill.color || 'blue'} ${!isOwned ? 'unowned-bubble' : ''}`}>
                  <IconComponent size={22} />
                </div>
                <div className="skill-status-tag">
                  {isActive ? (
                    <span className="badge-active"><CheckCircle size={13} /> Đang chạy trong Chat</span>
                  ) : isOwned ? (
                    <span className="badge-installed">✓ Đã sở hữu</span>
                  ) : (
                    <span className="badge-locked" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={12} /> Chưa mở khóa
                    </span>
                  )}
                </div>
              </div>

              <div className="skill-card-content">
                <div className="skill-cat-label">{skill.category || 'Chuyên ngành'}</div>
                <h3 className="skill-card-title">{skill.name}</h3>
                <p className="skill-card-desc">{skill.desc}</p>

                {skill.systemRole && (
                  <div className="skill-role-pill">
                    <ShieldCheck size={13} /> <span>{skill.systemRole}</span>
                  </div>
                )}

                {skill.samplePrompt && (
                  <div className="skill-prompt-preview">
                    <b>Prompt mẫu:</b>
                    <p>"{skill.samplePrompt}"</p>
                  </div>
                )}
              </div>

              <div className="skill-card-actions">
                {isOwned ? (
                  <>
                    <button 
                      className={`btn-use-skill ${isActive ? 'active-btn' : ''}`}
                      onClick={() => handleUseInChat(skill)}
                    >
                      <Play size={15} /> {isActive ? 'Đang dùng (Vào Chat)' : 'Kích hoạt & Chat ngay'}
                    </button>
                    <button 
                      className="btn-export-skill"
                      onClick={() => handleExportSkillJson(skill)}
                      title="Xuất gói Skill JSON để chia sẻ hoặc lưu trữ"
                    >
                      <Download size={15} /> Xuất gói
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => onOpenStore && onOpenStore()}
                  >
                    <ShoppingCart size={15} /> Mở khóa tại Store
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
