import React, { useState, useRef } from 'react';
import { 
  Files, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FileCode, 
  MessageSquare,
  Trash2,
  Calendar,
  HardDrive
} from 'lucide-react';

export default function FilesView({ onOpenFileViewer, onSwitchToChat }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const fileInputRef = useRef(null);

  const [fileList, setFileList] = useState([]);

  const filteredFiles = fileList.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                          f.category.toLowerCase().includes(search.toLowerCase()) ||
                          (f.desc && f.desc.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === 'all' || f.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleUploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let ext = file.name.split('.').pop().toLowerCase();
    let type = 'pdf';
    if (['xls', 'xlsx'].includes(ext)) type = 'excel';
    if (['doc', 'docx'].includes(ext)) type = 'word';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) type = 'image';

    const newF = {
      id: `f-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      type: type,
      category: 'Tài liệu tải lên',
      updatedAt: 'Vừa xong',
      desc: 'Tệp đính kèm mới tải lên bởi người dùng.'
    };

    setFileList([newF, ...fileList]);
  };

  const handleAnalyzeInChat = (file) => {
    onSwitchToChat(`Hãy phân tích nội dung tệp [${file.name}], bóc tách các điểm trọng yếu và lập bảng tổng hợp giúp tôi.`);
  };

  const handleDownload = (file) => {
    const content = `Nội dung tệp tài liệu: ${file.name}\nPhân loại: ${file.category}\nKích thước: ${file.size}\nMô tả: ${file.desc || ''}\nKhởi tạo bởi Hệ sinh thái Trí AI.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-page-container">
      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">Kho lưu trữ tri thức &amp; tài liệu</div>
          <h1 className="view-title">Tài Liệu &amp; Tệp Kỹ Thuật</h1>
          <p className="view-desc">Quản lý toàn bộ hồ sơ nghiệm thu, bản vẽ hoàn công, bảng tính báo giá Excel và ảnh quảng cáo độ nét cao.</p>
        </div>
        <div className="view-actions-row">
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleUploadFile}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Tải tệp mới lên
          </button>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="view-controls-card">
        <div className="view-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên file, định dạng (.pdf, .xlsx, .docx, .jpg), chuyên mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="view-categories-scroll">
          <button className={`cat-pill ${selectedType === 'all' ? 'active' : ''}`} onClick={() => setSelectedType('all')}>Tất cả tệp ({fileList.length})</button>
          <button className={`cat-pill ${selectedType === 'pdf' ? 'active' : ''}`} onClick={() => setSelectedType('pdf')}>Hồ sơ PDF</button>
          <button className={`cat-pill ${selectedType === 'excel' ? 'active' : ''}`} onClick={() => setSelectedType('excel')}>Bảng tính Excel</button>
          <button className={`cat-pill ${selectedType === 'word' ? 'active' : ''}`} onClick={() => setSelectedType('word')}>Văn bản Word</button>
          <button className={`cat-pill ${selectedType === 'image' ? 'active' : ''}`} onClick={() => setSelectedType('image')}>Ảnh Lookbook 8K</button>
        </div>
      </div>

      {/* Files Table / Empty State */}
      {filteredFiles.length > 0 ? (
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Tên tệp</th>
                <th>Chuyên mục</th>
                <th>Kích thước</th>
                <th>Ngày cập nhật</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id}>
                  <td>
                    <div className="file-name-cell">
                      <div className={`file-type-icon type-${file.type}`}>
                        {file.type === 'pdf' && <FileText size={18} />}
                        {file.type === 'excel' && <FileSpreadsheet size={18} />}
                        {file.type === 'word' && <FileText size={18} />}
                        {file.type === 'image' && <ImageIcon size={18} />}
                      </div>
                      <div>
                        <div className="file-name-txt">{file.name}</div>
                        <div className="file-sub-desc">{file.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="file-cat-pill">{file.category}</span>
                  </td>
                  <td className="file-size-txt">{file.size}</td>
                  <td className="file-date-txt">{file.updatedAt}</td>
                  <td>
                    <div className="file-actions-cell">
                      <button 
                        className="btn-icon-action" 
                        onClick={() => onOpenFileViewer(file)}
                        title="Xem nhanh tệp"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon-action" 
                        onClick={() => handleDownload(file)}
                        title="Tải tệp về máy"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className="btn-text-action" 
                        onClick={() => handleAnalyzeInChat(file)}
                        title="Yêu cầu Trí AI phân tích tệp này trong khung chat"
                      >
                        <MessageSquare size={14} /> Phân tích trong Chat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="view-empty-state-card">
          <div className="empty-icon-wrap">
            <Files size={40} />
          </div>
          <h3>Chưa Có Tệp Tài Liệu Nào</h3>
          <p>Hệ thống đã sẵn sàng từ đầu. Hãy bấm nút bên dưới để tải lên tệp hồ sơ PDF, bảng tính Excel hoặc bản vẽ hoàn công đầu tiên của anh.</p>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Tải tệp mới lên ngay
          </button>
        </div>
      )}
    </div>
  );
}
