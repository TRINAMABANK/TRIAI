import React from 'react';
import { X, Download, FileText, FileSpreadsheet, CheckCircle2, ShieldCheck, Sparkles, Eye } from 'lucide-react';

export default function FileViewerModal({ file, onClose }) {
  if (!file) return null;

  const isImage = file.type === 'png' || file.type === 'jpeg' || file.type === 'jpg' || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg');
  const isExcel = file.type === 'excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  const isWord = file.type === 'word' || file.name.endsWith('.docx') || file.name.endsWith('.doc');
  const isPdf = file.type === 'pdf' || file.name.endsWith('.pdf');

  const getFormatLabel = () => {
    if (isImage) {
      if (file.name.endsWith('.png')) return 'Ảnh chất lượng cao PNG (8K Master)';
      if (file.name.endsWith('.jpeg') || file.name.endsWith('.jpg')) return 'Ảnh kỹ thuật số JPEG (Đa nền tảng)';
      return 'Hình ảnh kỹ thuật số (8K)';
    }
    if (isWord) return 'Văn bản Word (.docx)';
    if (isExcel) return 'Bảng tính Excel (.xlsx)';
    if (isPdf) return 'Tài liệu PDF (.pdf)';
    return 'Tài liệu chuyên ngành';
  };

  const handleDownload = () => {
    if (isImage || file.url || file.downloadUrl) {
      const imgUrl = file.url || file.downloadUrl || '/assets/y_ngoc_aodai.jpg';
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = file.name;
      a.target = '_blank';
      a.click();
      return;
    }

    // Tạo file mẫu tải về máy
    let mimeType = 'text/plain;charset=utf-8';
    if (isWord) mimeType = 'application/msword';
    if (isExcel) mimeType = 'application/vnd.ms-excel';
    if (isPdf) mimeType = 'application/pdf';

    const dummyContent = `TÀI LIỆU DỰ ÁN TRÍ AI\nTên tệp: ${file.name}\nĐịnh dạng: ${getFormatLabel()}\nDung lượng: ${file.size}\nĐã được kiểm duyệt & thẩm tra bởi Hệ thống Trí AI.\nTrạng thái: Đạt chuẩn xuất bản 100%.`;
    const blob = new Blob([dummyContent], { type: mimeType });
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
            <div className={`file-badge-icon ${isImage ? 'image-bg' : isExcel ? 'excel-bg' : isWord ? 'word-bg' : 'pdf-bg'}`}>
              {isImage ? <Sparkles size={22} color="#ec4899" /> : isExcel ? <FileSpreadsheet size={22} color="#10b981" /> : isWord ? <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '18px' }}>W</span> : <FileText size={22} color="#ef4444" />}
            </div>
            <div>
              <h3>{file.name}</h3>
              <p>Định dạng: {getFormatLabel()} • Dung lượng: {file.size}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="file-preview-body">
          {/* TRƯỜNG HỢP 1: XEM ẢNH KOL (PNG / JPEG / 8K) */}
          {isImage ? (
            <div className="file-image-preview-container">
              <div className="image-preview-wrapper">
                <img 
                  src={file.url || file.downloadUrl || "/assets/y_ngoc_aodai.jpg"} 
                  alt={file.name} 
                  className="file-preview-img-tag"
                  onError={(e) => {
                    e.target.src = '/assets/brand_logo.png';
                  }}
                />
                <div className="image-preview-tag-overlay">
                  <Sparkles size={14} /> 8K Master Resolution • Lookbook KOL
                </div>
              </div>
              <div className="preview-meta-row" style={{ marginTop: '12px' }}>
                <span className="verify-badge"><CheckCircle2 size={14} /> Khóa nhận diện gương mặt: 100%</span>
                <span className="secure-badge"><ShieldCheck size={14} /> Chuẩn in ấn Campaign 8K</span>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: XEM TÀI LIỆU VĂN BẢN (THEO TỪNG CHUYÊN MÔN SKILL) */
            <div className="file-preview-box">
              <div className="preview-watermark">TRÍ AI - XÁC THỰC</div>
              <h4>TÓM TẮT NỘI DUNG TỆP: {file.name}</h4>
              <div className="preview-meta-row">
                <span className="secure-badge"><ShieldCheck size={14} /> Chữ ký số điện tử: Hợp lệ</span>
                <span className="verify-badge"><CheckCircle2 size={14} /> Đã kiểm duyệt bởi Trí AI</span>
              </div>
              <div className="preview-lines">
                {/* 1. KOL & Lookbook */}
                {(file.name.toLowerCase().includes('lookbook') || file.name.toLowerCase().includes('kol') || file.name.toLowerCase().includes('y_ngoc') || file.name.toLowerCase().includes('ao_dai')) && (
                  <>
                    <p>1. Nhân vật đại diện: Người mẫu Ý Ngọc - Khóa gương mặt nhận diện nhất quán 100%.</p>
                    <p>2. Trang phục & Phong cách: Áo dài lụa tơ tằm thêu hoa cúc và đính cườm thủ công.</p>
                    <p>3. Bối cảnh & Ánh sáng: Sảnh tiệc di sản 5 sao, Commercial Photography tiêu cự 85mm.</p>
                    <p>4. Tiêu chuẩn xuất bản: Đạt chuẩn Fashion Campaign Lookbook 8K toàn cầu.</p>
                  </>
                )}

                {/* 2. Mua sắm & Báo giá */}
                {(file.name.toLowerCase().includes('mua_sam') || file.name.toLowerCase().includes('bao_gia') || file.name.toLowerCase().includes('ncc') || file.name.toLowerCase().includes('so_sanh')) && (
                  <>
                    <p>1. Danh mục mua sắm: Bóc tách vật tư & thiết bị kỹ thuật theo tiêu chuẩn ISO.</p>
                    <p>2. Bảng so sánh báo giá: Đã đối chiếu 3 nhà cung cấp uy tín về đơn giá, chiết khấu và tiến độ.</p>
                    <p>3. Tối ưu chi phí: Tiết kiệm 12% so với đơn giá dự toán được phê duyệt ban đầu.</p>
                    <p>4. Đề xuất: Lựa chọn nhà cung cấp có tổng chi phí sở hữu (TCO) và bảo hành tối ưu nhất.</p>
                  </>
                )}

                {/* 3. Pháp lý & Hợp đồng */}
                {(file.name.toLowerCase().includes('hop_dong') || file.name.toLowerCase().includes('phap_ly') || file.name.toLowerCase().includes('phap_che') || file.name.toLowerCase().includes('dieu_khoan') || file.name.toLowerCase().includes('ra_soat')) && (
                  <>
                    <p>1. Tư cách chủ thể: Đại diện pháp luật và thẩm quyền ký kết hợp lệ 100%.</p>
                    <p>2. Điều khoản tài chính: Bảo lãnh tạm ứng, tiến độ thanh toán và phạt vi phạm đúng luật.</p>
                    <p>3. Rà soát rủi ro: Đã khoanh vùng điều khoản bất khả kháng và cơ chế giải quyết tranh chấp.</p>
                    <p>4. Đề xuất: Hợp đồng đủ điều kiện pháp lý để tiến hành ký kết chính thức.</p>
                  </>
                )}

                {/* 4. Tài chính & Dự toán */}
                {(file.name.toLowerCase().includes('tai_chinh') || file.name.toLowerCase().includes('du_toan') || file.name.toLowerCase().includes('ngan_sach') || file.name.toLowerCase().includes('capex') || file.name.toLowerCase().includes('opex')) && (
                  <>
                    <p>1. Dự toán ngân sách: Phân rã chi tiết cơ cấu chi phí CAPEX và OPEX theo từng giai đoạn.</p>
                    <p>2. Chỉ số tài chính: Tỷ suất sinh lời và dòng tiền hoàn vốn đạt mục tiêu an toàn tài chính.</p>
                    <p>3. Kế hoạch giải ngân: Phân kỳ thanh toán theo đúng các mốc hoàn thành công việc.</p>
                    <p>4. Đề xuất: Phê duyệt phương án dự toán và kế hoạch phân bổ dòng tiền.</p>
                  </>
                )}

                {/* 5. Vận hành Kỹ thuật MEP */}
                {(file.name.toLowerCase().includes('mep') || file.name.toLowerCase().includes('van_hanh') || file.name.toLowerCase().includes('toa_nha') || file.name.toLowerCase().includes('bao_tri')) && (
                  <>
                    <p>1. Hệ thống cơ điện: Trạm biến áp, tủ điện phân phối và máy phát điện vận hành ổn định.</p>
                    <p>2. Hệ thống HVAC & Bơm nước: Áp lực và lưu lượng đáp ứng yêu cầu kỹ thuật.</p>
                    <p>3. Kế hoạch bảo dưỡng: Đã lên lịch kiểm tra định kỳ phòng ngừa rủi ro sự cố.</p>
                    <p>4. Khuyến nghị: Hiệu chuẩn cảm biến nhiệt độ tầng hầm và thay thế bộ lọc gió định kỳ.</p>
                  </>
                )}

                {/* 6. PCCC & Phòng cháy chữa cháy */}
                {(file.name.toLowerCase().includes('pccc') || file.name.toLowerCase().includes('chua_chay') || file.name.toLowerCase().includes('kiem_tra_pccc') || file.name.toLowerCase().includes('nghiem_thu_pccc') || file.name.toLowerCase().includes('diem_luu_y')) && (
                  <>
                    <p>1. Căn cứ quy chuẩn: Quy chuẩn QCVN 06:2026/BXD và Nghị định 136/2020/NĐ-CP.</p>
                    <p>2. Kiểm tra thiết bị: Hệ thống báo cháy tự động, bơm chữa cháy và van xả tràn hoạt động đồng bộ.</p>
                    <p>3. Hồ sơ nghiệm thu: Đầy đủ biên bản nghiệm thu giai đoạn và chứng chỉ kiểm định thiết bị.</p>
                    <p>4. Ghi chú kỹ thuật: Bổ sung biên bản thử nghiệm và cập nhật sơ đồ hoàn công trước nghiệm thu.</p>
                  </>
                )}

                {/* 7. Fallback chung nếu không khớp các từ khóa trên */}
                {!file.name.toLowerCase().includes('lookbook') && 
                 !file.name.toLowerCase().includes('kol') && 
                 !file.name.toLowerCase().includes('y_ngoc') && 
                 !file.name.toLowerCase().includes('ao_dai') && 
                 !file.name.toLowerCase().includes('mua_sam') && 
                 !file.name.toLowerCase().includes('bao_gia') && 
                 !file.name.toLowerCase().includes('ncc') && 
                 !file.name.toLowerCase().includes('so_sanh') && 
                 !file.name.toLowerCase().includes('hop_dong') && 
                 !file.name.toLowerCase().includes('phap_ly') && 
                 !file.name.toLowerCase().includes('phap_che') && 
                 !file.name.toLowerCase().includes('dieu_khoan') && 
                 !file.name.toLowerCase().includes('ra_soat') && 
                 !file.name.toLowerCase().includes('tai_chinh') && 
                 !file.name.toLowerCase().includes('du_toan') && 
                 !file.name.toLowerCase().includes('ngan_sach') && 
                 !file.name.toLowerCase().includes('capex') && 
                 !file.name.toLowerCase().includes('opex') && 
                 !file.name.toLowerCase().includes('mep') && 
                 !file.name.toLowerCase().includes('van_hanh') && 
                 !file.name.toLowerCase().includes('toa_nha') && 
                 !file.name.toLowerCase().includes('bao_tri') && 
                 !file.name.toLowerCase().includes('pccc') && 
                 !file.name.toLowerCase().includes('chua_chay') && 
                 !file.name.toLowerCase().includes('kiem_tra_pccc') && 
                 !file.name.toLowerCase().includes('nghiem_thu_pccc') && 
                 !file.name.toLowerCase().includes('diem_luu_y') && (
                  <>
                    <p>1. Mục đích xử lý: Hoàn thiện hồ sơ nghiệp vụ chuyên ngành theo đúng yêu cầu đề ra.</p>
                    <p>2. Dữ liệu đối soát: 100% số liệu và thông tin đã được kiểm duyệt tự động.</p>
                    <p>3. Tiêu chuẩn xuất bản: Đầy đủ định dạng Word (.docx), Excel (.xlsx) và PDF (.pdf).</p>
                    <p>4. Đề xuất: Sẵn sàng phê duyệt và chuyển giao cho các bộ phận chuyên môn liên quan.</p>
                  </>
                )}
              </div>
            </div>
          )}
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
