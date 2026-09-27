import React, { useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Building,
  Sparkles,
  Layers,
  X
} from 'lucide-react';

export default function ProjectsView({ onSwitchToChat, onSelectSkill, skills = [] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectSkill, setNewProjectSkill] = useState(skills[0]?.id || 'pccc');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [projects, setProjects] = useState([]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.code.toLowerCase().includes(search.toLowerCase()) ||
                          p.skillName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const matchedSkill = skills.find(s => s.id === newProjectSkill) || skills[0] || { id: 'pccc', name: 'PCCC' };
    const newProj = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      code: `PRJ-AUTO-${Math.floor(100 + Math.random() * 900)}`,
      skillId: matchedSkill.id,
      skillName: matchedSkill.name,
      progress: 10,
      status: 'in_progress',
      statusText: 'Khởi tạo mới',
      docsCount: 1,
      updatedAt: 'Vừa xong',
      notes: newProjectDesc || 'Dự án vừa được khởi tạo bởi Anh Trí.',
      lead: 'Trí AI Assistant'
    };

    setProjects([newProj, ...projects]);
    setIsCreateModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handleOpenProjectInChat = (proj) => {
    const matchedSkill = skills.find(s => s.id === proj.skillId);
    if (matchedSkill && onSelectSkill) onSelectSkill(matchedSkill);
    onSwitchToChat(`Mở dự án [${proj.code}] ${proj.name}. Hãy tóm tắt hiện trạng và các công việc cần xử lý tiếp theo.`);
  };

  return (
    <div className="view-page-container">
      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">Không gian quản trị công việc</div>
          <h1 className="view-title">Dự Án Của Tôi</h1>
          <p className="view-desc">Quản lý hồ sơ công trình, chiến dịch hình ảnh KOL và tiến độ thẩm định kỹ thuật theo từng dự án độc lập.</p>
        </div>
        <div className="view-actions-row">
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Tạo dự án mới
          </button>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="view-controls-card">
        <div className="view-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên dự án, mã dự án, Skill áp dụng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="view-categories-scroll">
          <button className={`cat-pill ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Tất cả dự án ({projects.length})</button>
          <button className={`cat-pill ${filterStatus === 'in_progress' ? 'active' : ''}`} onClick={() => setFilterStatus('in_progress')}>Đang triển khai</button>
          <button className={`cat-pill ${filterStatus === 'review' ? 'active' : ''}`} onClick={() => setFilterStatus('review')}>Cần lưu ý</button>
          <button className={`cat-pill ${filterStatus === 'completed' ? 'active' : ''}`} onClick={() => setFilterStatus('completed')}>Đã hoàn thành</button>
        </div>
      </div>

      {/* Projects Cards List */}
      <div className="projects-cards-list">
        {filteredProjects.map((proj) => (
          <div key={proj.id} className="project-item-card">
            <div className="project-card-header">
              <div className="project-code-badge">{proj.code}</div>
              <div className="project-skill-tag">
                <Layers size={13} /> {proj.skillName}
              </div>
              <div className={`project-status-pill status-${proj.status}`}>
                {proj.status === 'completed' && <CheckCircle2 size={13} />}
                {proj.status === 'in_progress' && <Clock size={13} />}
                {proj.status === 'review' && <AlertCircle size={13} />}
                <span>{proj.statusText}</span>
              </div>
            </div>

            <div className="project-card-body">
              <h3 className="project-title">{proj.name}</h3>
              <p className="project-notes">{proj.notes}</p>

              {/* Progress Bar */}
              <div className="project-progress-wrap">
                <div className="progress-info-row">
                  <span>Tiến độ thẩm định</span>
                  <b>{proj.progress}%</b>
                </div>
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${proj.progress === 100 ? 'done' : ''}`} 
                    style={{ width: `${proj.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="project-meta-row">
                <div className="meta-item">
                  <FileText size={14} /> <span>{proj.docsCount} tài liệu</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} /> <span>Cập nhật: {proj.updatedAt}</span>
                </div>
                <div className="meta-item lead-item">
                  <span>Phụ trách: <b>{proj.lead}</b></span>
                </div>
              </div>
            </div>

            <div className="project-card-footer">
              <button 
                className="btn-open-project"
                onClick={() => handleOpenProjectInChat(proj)}
              >
                <span>Mở trong Chat với Trí AI</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="view-empty-state-card">
            <div className="empty-icon-wrap">
              <FolderKanban size={40} />
            </div>
            <h3>Chưa Có Dự Án Nào</h3>
            <p>Hệ thống đã sẵn sàng từ đầu. Hãy bấm nút bên dưới để tạo dự án đầu tiên của anh.</p>
            <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} /> Tạo dự án mới ngay
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop-wrap" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-box-card" onClick={e => e.stopPropagation()}>
            <div className="modal-box-head">
              <h3>Tạo Dự Án Mới</h3>
              <button className="btn-close-modal" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-group">
                <label>Tên dự án / Công trình:</label>
                <input 
                  type="text" 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  placeholder="Ví dụ: Thẩm duyệt PCCC Khách sạn Sheraton..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Skill chuyên ngành áp dụng:</label>
                <select value={newProjectSkill} onChange={e => setNewProjectSkill(e.target.value)}>
                  {skills.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả mục tiêu dự án:</label>
                <textarea 
                  rows={3} 
                  value={newProjectDesc} 
                  onChange={e => setNewProjectDesc(e.target.value)} 
                  placeholder="Ghi chú các yêu cầu kỹ thuật, thời hạn hoặc lưu ý..." 
                />
              </div>
              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Khởi tạo dự án</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
