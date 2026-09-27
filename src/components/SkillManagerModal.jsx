import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  X, 
  Plus, 
  Upload, 
  Download, 
  Sparkles, 
  Trash2, 
  Check, 
  FileCode, 
  Layers, 
  Copy, 
  Flame, 
  ShoppingCart, 
  Package, 
  Building2, 
  Cpu, 
  Scale, 
  FileText, 
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { exportSkillPack, addOrUpdateSkill, deleteSkill, resetToDefaultSkills } from '../data/skillsData';

export default function SkillManagerModal({ 
  isOpen, 
  onClose, 
  skills, 
  setSkills, 
  activeSkill, 
  setActiveSkill 
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'import_export'
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [notice, setNotice] = useState({ text: '', type: 'success', visible: false });

  // Helper hiển thị thông báo toast/banner chuyên nghiệp
  const showNotice = (text, type = 'success', duration = 5500) => {
    setNotice({ text, type, visible: true });
    if (duration > 0) {
      setTimeout(() => {
        setNotice(prev => ({ ...prev, visible: false }));
      }, duration);
    }
  };

  // Form thêm skill mới
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Kỹ thuật & Quản lý');
  const [formColor, setFormColor] = useState('blue');
  const [formIcon, setFormIcon] = useState('Building2');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('199.000đ/tháng');
  const [formRole, setFormRole] = useState('');
  const [formSamplePrompt, setFormSamplePrompt] = useState('');
  const [formChecklist, setFormChecklist] = useState('Kiểm tra hồ sơ pháp lý\nĐối chiếu tiêu chuẩn quy phạm\nĐánh giá rủi ro tiềm ẩn');

  if (!isOpen) return null;

  // Xử lý nạp skill từ Form
  const handleCreateSkill = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formDesc.trim()) {
      showNotice('⚠️ Vui lòng nhập Tên Skill và Mô tả năng lực!', 'warning');
      return;
    }

    const id = 'skill-' + Date.now();
    const checklistItems = formChecklist
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(item => ({ label: item, status: 'pass' }));

    const newSkill = {
      id,
      name: formName.trim(),
      category: formCategory,
      color: formColor,
      iconName: formIcon,
      desc: formDesc.trim(),
      price: formPrice,
      systemRole: formRole || `Chuyên gia ${formName}`,
      samplePrompt: formSamplePrompt || `Kiểm tra và tư vấn chuyên sâu về ${formName}`,
      checklist: checklistItems.length > 0 ? checklistItems : [{ label: 'Tiêu chuẩn đạt yêu cầu', status: 'pass' }],
      sampleFiles: [
        { name: `Bao_cao_${id}.pdf`, size: '1.8 MB', type: 'pdf' }
      ]
    };

    const updated = addOrUpdateSkill(newSkill);
    setSkills(updated);
    setActiveSkill(newSkill);
    showNotice(`🎉 Đã tạo & nạp thành công Skill mới: "${newSkill.name}" và kích hoạt ngay!`, 'success');
    setActiveTab('list');

    // Reset form
    setFormName('');
    setFormDesc('');
    setFormRole('');
  };

  // Nạp từ chuỗi JSON (Khắc phục triệt để lỗi unexpected end of data)
  const handleImportJson = () => {
    if (!jsonInput || !jsonInput.trim()) {
      showNotice('⚠️ Vui lòng nhập hoặc dán nội dung mã JSON vào ô bên dưới trước khi bấm Nạp!', 'warning');
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      let toAdd = Array.isArray(parsed) ? parsed : [parsed];
      let current = [...skills];
      let addedCount = 0;
      toAdd.forEach(item => {
        if (item && typeof item === 'object' && item.name) {
          if (!item.id) item.id = 'skill-imported-' + Math.random().toString(36).substr(2, 6);
          current = addOrUpdateSkill(item);
          addedCount++;
        }
      });
      if (addedCount === 0) {
        showNotice('⚠️ Không tìm thấy đối tượng Skill hợp lệ (cần có thuộc tính "name").', 'warning');
        return;
      }
      setSkills(current);
      showNotice(`🎉 Đã nạp thành công ${addedCount} Skill mới vào hệ sinh thái TRÍ AI!`, 'success');
      setJsonInput('');
    } catch (err) {
      showNotice('⚠️ Lỗi cú pháp JSON: ' + err.message + '. Vui lòng kiểm tra lại cấu trúc mã.', 'error');
    }
  };

  // Nạp từ file JSON hoặc ZIP (HỖ TRỢ UPLOAD ALL TẤT CẢ FILE CÙNG LÚC)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let totalParsedSkills = [];
    let failedFiles = [];

    for (const file of files) {
      try {
        const nameLower = file.name.toLowerCase();
        if (nameLower.endsWith('.json')) {
          const text = await file.text();
          if (!text || !text.trim()) continue;
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          totalParsedSkills.push(...arr);
        } else if (nameLower.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const filePromises = [];
          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
              const entryName = zipEntry.name.toLowerCase();
              if (entryName.endsWith('.json')) {
                filePromises.push(
                  zipEntry.async('string').then(content => {
                    try {
                      const p = JSON.parse(content);
                      return Array.isArray(p) ? p : [p];
                    } catch { return []; }
                  })
                );
              } else if (entryName.endsWith('.md')) {
                filePromises.push(
                  zipEntry.async('string').then(mdContent => {
                    const titleMatch = mdContent.match(/^#\s+(?:Skill\s+)?(.+)$/m);
                    const name = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.zip$/i, '');
                    const lines = mdContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));
                    const desc = lines.slice(0, 3).join(' ') || `Bộ kỹ năng chuyên môn ${name}`;
                    const id = 'skill-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    return [{
                      id,
                      name,
                      category: 'Kỹ thuật & Quản lý',
                      desc: desc.slice(0, 200),
                      color: 'blue',
                      systemRole: `Chuyên gia ${name}`,
                      samplePrompt: `Thực thi quy trình chuyên môn ${name}`,
                      checklist: [{ label: 'Tiêu chuẩn quy trình đạt chuẩn', status: 'pass' }]
                    }];
                  })
                );
              }
            }
          });
          const zipResults = await Promise.all(filePromises);
          zipResults.forEach(r => totalParsedSkills.push(...r));
        }
      } catch (err) {
        failedFiles.push(file.name);
      }
    }

    if (totalParsedSkills.length === 0) {
      showNotice('⚠️ Không tìm thấy dữ liệu Skill hợp lệ trong tệp đã chọn. Vui lòng chọn tệp .json hoặc .zip chuẩn.', 'warning');
      if (e.target) e.target.value = '';
      return;
    }

    let current = [...skills];
    let addedCount = 0;
    totalParsedSkills.forEach(item => {
      if (item && typeof item === 'object' && item.name) {
        if (!item.id) item.id = 'skill-imported-' + Math.random().toString(36).substr(2, 6);
        current = addOrUpdateSkill(item);
        addedCount++;
      }
    });

    setSkills(current);
    showNotice(`🎉 Nạp thành công toàn bộ ${addedCount} Skill từ ${files.length} tệp (Upload All hoàn tất)!`, 'success');
    if (e.target) e.target.value = '';
  };

  // Nạp toàn bộ 33 Skill Master chuẩn thương mại (1-Click Upload All)
  const handleLoadMasterAll = () => {
    const resetSkills = resetToDefaultSkills();
    setSkills(resetSkills);
    const pccc = resetSkills.find(s => s.id === 'pccc') || resetSkills[0];
    setActiveSkill(pccc);
    showNotice(`🎉 Đã nạp & khôi phục thành công trọn bộ 33 Skill thương mại Master vào hệ thống!`, 'success');
  };

  // Xuất file cấu hình Skill Pack kèm thông báo thành công
  const handleExportAllPack = () => {
    exportSkillPack(skills);
    showNotice(`✅ Đã xuất thành công gói ${skills.length} Skill (.json) về máy của anh Trí! Tệp đã sẵn sàng để chuyển giao cho khách hàng hoặc lưu trữ.`, 'success');
  };

  // Nạp gói Skill thương mại mẫu (Demo cho khách hàng xem)
  const handleLoadDemoPacks = () => {
    const demoSkills = [
      {
        id: 'skill-ke-toan-thue',
        name: 'Kế toán & Thuế DN',
        category: 'Tài chính & Thuế',
        color: 'gold',
        iconName: 'Scale',
        desc: 'Quyết toán thuế TNDN, TNCN, rà soát hóa đơn điện tử và chi phí hợp lý hợp lệ.',
        price: '349.000đ/tháng',
        systemRole: 'Kế toán trưởng & Chuyên gia Thuế cao cấp',
        samplePrompt: 'Rà soát các hóa đơn đầu vào trên 20 triệu đồng và kiểm tra điều kiện khấu trừ thuế GTGT.',
        checklist: [
          { label: 'Hóa đơn điện tử: Tra cứu hợp lệ trên cổng Tổng cục Thuế', status: 'pass' },
          { label: 'Chứng từ thanh toán không dùng tiền mặt: Đầy đủ UNC', status: 'pass' },
          { label: 'Hợp đồng kinh tế và biên bản giao nhận: Khớp ngày tháng', status: 'pass' }
        ],
        sampleFiles: [
          { name: 'Bang_ra_soat_hoa_don_Q3.xlsx', size: '620 KB', type: 'excel' },
          { name: 'Tu_van_toi_uu_thue_TNDN.pdf', size: '1.9 MB', type: 'pdf' }
        ]
      },
      {
        id: 'skill-an-toan-lao-dong',
        name: 'An toàn Lao động',
        category: 'An toàn & Pháp quy',
        color: 'green',
        iconName: 'Cpu',
        desc: 'Biện pháp an toàn thi công, kiểm định thiết bị áp lực, giàn giáo và bảo hộ lao động.',
        price: '199.000đ/tháng',
        systemRole: 'Kỹ sư Trưởng Ban An toàn (HSE)',
        samplePrompt: 'Lập checklist kiểm tra an toàn giàn giáo bao che và thiết bị nâng hạ trước ca thi công.',
        checklist: [
          { label: 'Chứng chỉ vận hành cẩu tháp: Còn hiệu lực kiểm định', status: 'pass' },
          { label: 'Bảo hộ lao động cá nhân (PPE): 100% công nhân trang bị đầy đủ', status: 'pass' },
          { label: 'Hệ thống rào chắn & Lưới an toàn: Đúng quy định', status: 'pass' }
        ],
        sampleFiles: [
          { name: 'Checklist_an_toan_HSE.pdf', size: '1.2 MB', type: 'pdf' }
        ]
      }
    ];

    let current = [...skills];
    demoSkills.forEach(s => {
      current = addOrUpdateSkill(s);
    });
    setSkills(current);
    alert('Đã nạp 2 Skill thương mại mới: "Kế toán & Thuế DN" và "An toàn Lao động"!');
  };

  // Xóa skill
  const handleDelete = (id, name) => {
    if (confirm(`Anh có chắc chắn muốn xóa Skill "${name}"?`)) {
      const updated = deleteSkill(id);
      setSkills(updated);
      if (activeSkill.id === id && updated.length > 0) {
        setActiveSkill(updated[0]);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container skill-manager-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Sparkles className="modal-title-icon" size={24} />
            <div>
              <h3>Quản lý & Nạp Skill Mới vào Webapp</h3>
              <p>Thư viện năng lực mở — Dễ dàng đóng gói, bán lại và nạp thêm các Skill chuyên môn</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📋 Danh sách Skill hiện có ({skills.length})
          </button>
          <button 
            className={`modal-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            ➕ Thêm Skill Mới (Nhập Form)
          </button>
          <button 
            className={`modal-tab ${activeTab === 'import_export' ? 'active' : ''}`}
            onClick={() => setActiveTab('import_export')}
          >
            📦 Nạp / Xuất Gói Skill (JSON)
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scrollable">
          {/* Thông báo trạng thái chuyên nghiệp khi Nạp / Xuất Skill */}
          {notice.visible && (
            <div className={`status-notification-banner ${notice.type}`}>
              <div className="notif-banner-left">
                {notice.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{notice.text}</span>
              </div>
              <button 
                type="button" 
                className="notif-banner-close" 
                onClick={() => setNotice(prev => ({ ...prev, visible: false }))}
                title="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* TAB 1: Danh sách Skill */}
          {activeTab === 'list' && (
            <div className="skills-manager-list">
              <div className="list-banner-promo">
                <div>
                  <b>Đang dùng: <span className="highlight-pill">{activeSkill.name}</span></b>
                  <p>Mỗi khi chọn một Skill, AI trong khung chat sẽ tự động nhập vai chuyên gia của lĩnh vực đó.</p>
                </div>
                <button className="btn-quick-demo" onClick={handleLoadDemoPacks}>
                  ⚡ Nạp 2 Skill Mẫu Doanh Nghiệp
                </button>
              </div>

              <div className="skills-table-wrap">
                {skills.map(s => {
                  const isActive = activeSkill.id === s.id;
                  return (
                    <div key={s.id} className={`skill-manager-row ${isActive ? 'is-active-row' : ''}`}>
                      <div className={`skill-color-tag ${s.color || 'blue'}`}></div>
                      
                      <div className="skill-row-info">
                        <div className="skill-row-title">
                          <b>{s.name}</b>
                          <span className="skill-category-pill">{s.category || 'Chuyên môn'}</span>
                          {isActive && <span className="badge-using">Đang sử dụng</span>}
                        </div>
                        <div className="skill-row-desc">{s.desc}</div>
                        <div className="skill-row-extra">
                          <span>💰 Giá niêm yết: {s.price || 'Liên hệ'}</span> • 
                          <span>Vai trò: {s.systemRole || 'Chuyên gia'}</span>
                        </div>
                      </div>

                      <div className="skill-row-actions">
                        {!isActive ? (
                          <button 
                            className="btn-activate-skill"
                            onClick={() => {
                              setActiveSkill(s);
                              alert(`Đã chuyển sang Skill "${s.name}".`);
                            }}
                          >
                            Kích hoạt
                          </button>
                        ) : (
                          <span className="current-active-tag">✓ Đang dùng</span>
                        )}

                        <button 
                          className="btn-delete-skill"
                          onClick={() => handleDelete(s.id, s.name)}
                          title="Xóa skill"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Form Thêm Skill Mới */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateSkill} className="add-skill-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Tên Skill *</label>
                  <input 
                    type="text" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ví dụ: Kế toán Thuế Doanh nghiệp, Giám sát Cơ điện..." 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Danh mục</label>
                  <input 
                    type="text" 
                    value={formCategory} 
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="Xây dựng, Pháp lý, Tài chính, Y tế..." 
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Màu sắc giao diện</label>
                  <select value={formColor} onChange={e => setFormColor(e.target.value)}>
                    <option value="blue">Xanh dương (Blue)</option>
                    <option value="red">Đỏ (Red)</option>
                    <option value="green">Xanh lá (Green)</option>
                    <option value="orange">Cam (Orange)</option>
                    <option value="purple">Tím (Purple)</option>
                    <option value="gold">Vàng kim (Gold)</option>
                    <option value="cyan">Xanh ngọc (Cyan)</option>
                    <option value="pink">Hồng (Pink)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Biểu tượng (Icon)</label>
                  <select value={formIcon} onChange={e => setFormIcon(e.target.value)}>
                    <option value="Flame">Ngọn lửa (PCCC/Nhiệt huyết)</option>
                    <option value="Building2">Tòa nhà (Bất động sản/Xây dựng)</option>
                    <option value="Scale">Cán cân (Pháp lý/Công lý)</option>
                    <option value="Cpu">Vi mạch (Kỹ thuật/MEP)</option>
                    <option value="ShoppingCart">Xe đẩy (Mua sắm/Vật tư)</option>
                    <option value="Package">Gói hàng (Tài sản/Kho bãi)</option>
                    <option value="BarChart3">Biểu đồ (Tài chính/Chi phí)</option>
                    <option value="FileText">Tài liệu (Hồ sơ/Biên bản)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Giá bán cho khách hàng</label>
                  <input 
                    type="text" 
                    value={formPrice} 
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="Ví dụ: 199.000đ/tháng" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả ngắn gọn về năng lực Skill *</label>
                <textarea 
                  rows={2}
                  value={formDesc} 
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Mô tả chức năng mà AI sẽ thực hiện (ví dụ: Rà soát hợp đồng, cảnh báo rủi ro, phân tích báo giá...)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Vai trò chuyên môn của AI (System Role)</label>
                <input 
                  type="text" 
                  value={formRole} 
                  onChange={e => setFormRole(e.target.value)}
                  placeholder="Ví dụ: Kỹ sư trưởng Thẩm định dự án / Cố vấn Pháp chế cao cấp"
                />
              </div>

              <div className="form-group">
                <label>Tiêu chuẩn Checklist nghiệm thu (Mỗi dòng một tiêu chí)</label>
                <textarea 
                  rows={3}
                  value={formChecklist} 
                  onChange={e => setFormChecklist(e.target.value)}
                  placeholder="Thành phần hồ sơ: Đầy đủ&#10;Biểu mẫu: Đúng quy định&#10;Nội dung kỹ thuật: Phù hợp tiêu chuẩn"
                />
              </div>

              <div className="form-actions-bar">
                <button type="button" className="btn-cancel" onClick={() => setActiveTab('list')}>
                  Hủy
                </button>
                <button type="submit" className="btn-save-skill">
                  <Sparkles size={16} /> Lưu & Kích hoạt Skill này
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Nạp / Xuất Gói Skill (Import & Export JSON) */}
          {activeTab === 'import_export' && (
            <div className="import-export-section">
              {/* Quick Action: Master Pack 33 Skills One-Click Upload All */}
              <div className="master-pack-card">
                <div className="master-pack-info">
                  <h4><Sparkles size={18} color="#2563eb" /> Nạp Nhanh Trọn Bộ 33 Skill Master (Upload All)</h4>
                  <p>Khôi phục và nạp đầy đủ 33 Skill chuyên ngành chuẩn thương mại vào hệ sinh thái TRÍ AI chỉ với 1 click.</p>
                </div>
                <button type="button" className="btn-master-all" onClick={handleLoadMasterAll}>
                  <Sparkles size={16} /> Nạp Toàn Bộ 33 Skill Master
                </button>
              </div>

              <div className="io-two-columns">
                {/* Cột 1: Nạp từ file JSON / ZIP (Hỗ trợ Upload All) */}
                <div className="io-card">
                  <h4>📂 1. Nạp Skill từ Tệp (.JSON, .ZIP)</h4>
                  <p>Chọn một hoặc nhiều tệp cấu hình Skill Pack (.json, .zip). Hỗ trợ nạp hàng loạt tất cả tệp cùng lúc.</p>
                  
                  <label className="upload-file-label">
                    <Upload size={24} />
                    <span>Chọn hoặc kéo thả tệp .JSON, .ZIP vào đây</span>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      (Giữ Ctrl / Shift để chọn nhiều tệp cùng lúc — Upload All)
                    </span>
                    <input 
                      type="file" 
                      accept=".json,.zip" 
                      multiple
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div className="io-subtext">Hệ thống sẽ tự động giải mã các tệp và nạp vào Kho Skill ngay lập tức.</div>
                </div>

                {/* Cột 2: Xuất Skill Pack để bán cho khách hàng */}
                <div className="io-card">
                  <h4>📦 2. Đóng gói & Xuất File JSON để bán</h4>
                  <p>Xuất toàn bộ {skills.length} Skill hiện có thành tệp dữ liệu Master để chuyển giao cho người mua.</p>
                  
                  <button type="button" className="btn-export-pack" onClick={handleExportAllPack}>
                    <Download size={18} /> Tải về Gói {skills.length} SkillPack.json
                  </button>

                  <div className="io-subtext">Khách hàng mua chỉ cần bấm "Nạp Skill" rồi chọn file này là xong!</div>
                </div>
              </div>

              {/* Dán mã JSON trực tiếp */}
              <div className="paste-json-box">
                <h4>Hoặc dán trực tiếp mã JSON vào đây:</h4>
                <textarea 
                  rows={4}
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder='[{"name": "Skill Mới", "desc": "Mô tả năng lực...", "color": "blue", "checklist": [...]}]'
                />
                <button type="button" className="btn-apply-json" onClick={handleImportJson}>
                  <Sparkles size={16} /> Nạp dữ liệu JSON này vào Webapp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
