import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Volume2, 
  HardDrive, 
  RefreshCw, 
  Download, 
  Upload,
  CheckCircle2,
  Key,
  Globe,
  Sliders
} from 'lucide-react';

export default function SettingsView() {
  const [brandName, setBrandName] = useState('TRÍ AI');
  const [ownerName, setOwnerName] = useState('Anh Trí');
  const [brandSlogan, setBrandSlogan] = useState('Thư viện năng lực AI của anh Trí');
  const [licenseKey, setLicenseKey] = useState('TRIAI-PRO-2026-ENTERPRISE-8899');
  
  // AI Model settings
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('AIzaSyD98...******************');
  const [temperature, setTemperature] = useState('0.2');

  // Voice settings
  const [voiceGender, setVoiceGender] = useState('female_north');
  const [speechRate, setSpeechRate] = useState('0.95');
  const [autoSpeak, setAutoSpeak] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('tri_ai_brand_name', brandName);
    localStorage.setItem('tri_ai_owner_name', ownerName);
    localStorage.setItem('tri_ai_brand_slogan', brandSlogan);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportFullBackup = () => {
    const backupData = {
      brand: { brandName, ownerName, brandSlogan, licenseKey },
      aiConfig: { selectedProvider, temperature },
      voice: { voiceGender, speechRate, autoSpeak },
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `Tri_AI_Full_Backup_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="view-page-container">
      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">Cấu hình hệ thống & Thương mại</div>
          <h1 className="view-title">Cài Đặt Hệ Thống</h1>
          <p className="view-desc">Tùy biến thương hiệu để bán lại cho khách hàng (White-Label), cấu hình API trí tuệ nhân tạo và quản trị dữ liệu.</p>
        </div>
        <div className="view-actions-row">
          {savedSuccess && (
            <div className="save-success-badge">
              <CheckCircle2 size={16} /> Đã lưu thành công!
            </div>
          )}
          <button className="btn-primary" onClick={handleSave}>
            <Save size={16} /> Lưu cài đặt
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-form-layout">
        {/* Section 1: White-label Resale */}
        <div className="settings-card-section">
          <div className="section-head">
            <div className="section-icon-badge gold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="section-title">Thương Hiệu & Bản Quyền Bán Lại (White-Label)</h3>
              <p className="section-sub">Đổi tên và nhận diện thương hiệu để chuyển giao phần mềm cho đối tác doanh nghiệp.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="form-group">
              <label>Tên ứng dụng / Thương hiệu hiển thị:</label>
              <input 
                type="text" 
                value={brandName} 
                onChange={e => setBrandName(e.target.value)} 
                placeholder="Ví dụ: TRÍ AI hoặc Tên Công Ty Khách Hàng"
              />
            </div>
            <div className="form-group">
              <label>Tên chủ sở hữu tài khoản:</label>
              <input 
                type="text" 
                value={ownerName} 
                onChange={e => setOwnerName(e.target.value)} 
                placeholder="Ví dụ: Anh Trí"
              />
            </div>
            <div className="form-group full-width">
              <label>Khẩu hiệu thương hiệu (Slogan):</label>
              <input 
                type="text" 
                value={brandSlogan} 
                onChange={e => setBrandSlogan(e.target.value)} 
                placeholder="Thư viện năng lực AI của bạn"
              />
            </div>
            <div className="form-group full-width">
              <label>Mã bản quyền thương mại (Commercial License):</label>
              <div className="input-with-badge">
                <input 
                  type="text" 
                  value={licenseKey} 
                  onChange={e => setLicenseKey(e.target.value)} 
                />
                <span className="valid-key-tag">Hợp lệ • Gói Enterprise B2B</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: AI Engine Settings */}
        <div className="settings-card-section">
          <div className="section-head">
            <div className="section-icon-badge blue">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="section-title">Mô Hình Trí Tuệ Nhân Tạo (AI Engine)</h3>
              <p className="section-sub">Lựa chọn nhà cung cấp mô hình ngôn ngữ lớn (LLM) và cấu hình tham số suy luận.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="form-group">
              <label>Nhà cung cấp Mô hình:</label>
              <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>
                <option value="gemini">Google Gemini 2.5 / 3.0 Pro (Tối ưu nghiệp vụ)</option>
                <option value="openai">OpenAI GPT-4o / GPT-4 Turbo</option>
                <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                <option value="local">Local Ollama / Private Server (Bảo mật 100%)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Độ chính xác / Nhiệt độ (Temperature):</label>
              <select value={temperature} onChange={e => setTemperature(e.target.value)}>
                <option value="0.1">0.1 - Nghiệm thu kỹ thuật & Pháp lý (Chính xác tuyệt đối)</option>
                <option value="0.2">0.2 - Chuẩn hóa quy trình & Mua sắm (Khuyên dùng)</option>
                <option value="0.7">0.7 - Sáng tạo ý tưởng & Lookbook KOL Thời Trang</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Khóa API kết nối (API Key):</label>
              <div className="input-with-icon">
                <Key size={16} className="key-icon" />
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)} 
                  placeholder="Nhập API Key bảo mật..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Voice & Speech */}
        <div className="settings-card-section">
          <div className="section-head">
            <div className="section-icon-badge purple">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="section-title">Giọng Đọc & Tương Tác Âm Thanh</h3>
              <p className="section-sub">Tùy chỉnh giọng nói tiếng Việt cho trợ lý Trí AI khi đọc tóm tắt báo cáo.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="form-group">
              <label>Giọng đọc tiếng Việt:</label>
              <select value={voiceGender} onChange={e => setVoiceGender(e.target.value)}>
                <option value="female_north">Nữ miền Bắc (Truyền cảm, chuẩn tin tức)</option>
                <option value="male_north">Nam miền Bắc (Uy nghiêm, kỹ thuật chuyên nghiệp)</option>
                <option value="female_south">Nữ miền Nam (Nhẹ nhàng, thân thiện)</option>
                <option value="male_south">Nam miền Nam (Ấm áp, chắc chắn)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tốc độ phát giọng nói:</label>
              <select value={speechRate} onChange={e => setSpeechRate(e.target.value)}>
                <option value="0.85">0.85x - Chậm rãi, rõ ràng từng điều khoản</option>
                <option value="0.95">0.95x - Tự nhiên, dễ nghe (Khuyên dùng)</option>
                <option value="1.1">1.1x - Nhanh, tiết kiệm thời gian</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Backup & Data */}
        <div className="settings-card-section">
          <div className="section-head">
            <div className="section-icon-badge green">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="section-title">Sao Lưu & Dữ Liệu Khách Hàng</h3>
              <p className="section-sub">Xuất toàn bộ cấu hình, lịch sử và gói kỹ năng sang tệp tin để chuyển giao hoặc lưu trữ dự phòng.</p>
            </div>
          </div>

          <div className="backup-actions-row">
            <button type="button" className="btn-backup" onClick={handleExportFullBackup}>
              <Download size={16} /> Xuất toàn bộ dữ liệu hệ thống (Full Backup .JSON)
            </button>
            <button type="button" className="btn-restore" onClick={() => alert('Vui lòng chọn tệp .json sao lưu để khôi phục.')}>
              <Upload size={16} /> Khôi phục từ tệp sao lưu
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
