import React from 'react';
import { X, Download, FileText, FileSpreadsheet, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function FileViewerModal({ file, onClose }) {
  if (!file) return null;

  const isExcel = file.type === 'excel' || file.name.endsWith('.xlsx');

  const handleDownload = () => {
    // Tạo file mẫu giả lập để tải về thực tế
    const dummyContent = `TÀI LIỆU DỰ ÁN TRÍ AI\nTên tệp: ${file.name}\nDung lượng: ${file.size}\nĐã được thẩm tra bởi Hệ thống Trí AI.\nTrạng thái: Hợp chuẩn 100%.`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container file-viewer-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className={`file-badge-icon ${isExcel ? 'excel-bg' : 'pdf-bg'}`}>
              {isExcel ? <FileSpreadsheet size={22} /> : <FileText size={22} />}
            </div>
            <div>
              <h3>{file.name}</h3>
              <p>Định dạng: {isExcel ? 'Bảng tính Excel (.xlsx)' : 'Tài liệu PDF (.pdf)'} • Dung lượng: {file.size}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="file-preview-body">
          <div className="file-preview-box">
            <div className="preview-watermark">TRÍ AI - XÁC THỰC</div>
            <h4>TÓM TẮT NỘI DUNG TỆP: {file.name}</h4>
            <div className="preview-meta-row">
              <span className="secure-badge"><ShieldCheck size={14} /> Chữ ký số điện tử: Hợp lệ</span>
              <span className="verify-badge"><CheckCircle2 size={14} /> Đã kiểm duyệt bởi Trí AI</span>
            </div>
            <div className="preview-lines">
              <p>1. Căn cứ kiểm định: Quy chuẩn QCVN 06:2022/BXD và TCVN 3890:2023.</p>
              <p>2. Kết quả kiểm tra thiết bị: 100% đầu báo khói, van báo động, họng nước vách tường đã qua thử áp lực.</p>
              <p>3. Hồ sơ nghiệm thu: Đầy đủ biên bản nghiệm thu giai đoạn của Tư vấn giám sát.</p>
              <p>4. Ghi chú kỹ thuật: 2 vị trí tủ điều khiển tầng hầm đã hiệu chỉnh tiếp địa theo đúng sơ đồ.</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Đóng</button>
          <button className="btn-download-file" onClick={handleDownload}>
            <Download size={16} /> Tải file về máy ({file.size})
          </button>
        </div>
      </div>
    </div>
  );
}
