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
  AlertTriangle
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
  skills, 
  activeSkill, 
  onSelectSkill, 
  onOpenSkillManager,
  onSwitchToChat
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  // Trích xuất tự động danh mục từ toàn bộ 33 Skill
  const categories = ['Tất cả', ...Array.from(new Set(skills.map(s => s.category).filter(Boolean)))];

  const filteredSkills = skills.filter(skill => {
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
    showToast(`✅ Đã xuất thành công gói Skill [${skill.name}] (.json) về máy của anh Trí!`);
  };

  const handleUseInChat = (skill) => {
    onSelectSkill(skill);
    onSwitchToChat(skill.samplePrompt || `Kích hoạt năng lực chuyên môn từ Skill: ${skill.name}`);
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
          <div className="view-badge">Thư viện năng lực chuyên sâu</div>
          <h1 className="view-title">Kho Skill Chuyên Ngành</h1>
          <p className="view-desc">Quản lý, kích hoạt và tải các bộ kỹ năng trí tuệ nhân tạo chuyên biệt để bán hoặc áp dụng cho doanh nghiệp.</p>
        </div>
        <div className="view-actions-row">
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
          <button className="btn-secondary" onClick={() => onOpenSkillManager()}>
            <Upload size={16} /> Nạp Skill từ File (.JSON)
          </button>
          <button className="btn-primary" onClick={() => onOpenSkillManager()}>
            <Plus size={16} /> Tạo Skill mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="view-controls-card">
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

          return (
            <div key={skill.id} className={`skill-master-card ${isActive ? 'is-active-skill' : ''}`}>
              <div className="skill-card-top">
                <div className={`skill-icon-bubble ${skill.color || 'blue'}`}>
                  <IconComponent size={22} />
                </div>
                <div className="skill-status-tag">
                  {isActive ? (
                    <span className="badge-active"><CheckCircle size={13} /> Đang chạy trong Chat</span>
                  ) : (
                    <span className="badge-installed">Đã sẵn sàng</span>
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
                <button 
                  className={`btn-use-skill ${isActive ? 'active-btn' : ''}`}
                  onClick={() => handleUseInChat(skill)}
                >
                  <Play size={15} /> {isActive ? 'Đang dùng (Vào Chat)' : 'Kích hoạt & Chat ngay'}
                </button>
                <button 
                  className="btn-export-skill"
                  onClick={() => handleExportSkillJson(skill)}
                  title="Xuất gói Skill JSON để chia sẻ hoặc bán thương mại"
                >
                  <Download size={15} /> Xuất gói
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
