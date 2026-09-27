import React, { useState } from 'react';
import { 
  History, 
  Search, 
  MessageSquare, 
  Clock, 
  Calendar, 
  Download, 
  Trash2, 
  ArrowRight,
  Plus,
  Layers,
  FileText
} from 'lucide-react';

export default function HistoryView({ onSwitchToChat, setMessages }) {
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState([]);

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.skillName.toLowerCase().includes(search.toLowerCase()) ||
    s.preview.toLowerCase().includes(search.toLowerCase())
  );

  const handleResumeSession = (sess) => {
    if (sess.messages && sess.messages.length > 0) {
      setMessages(sess.messages);
    }
    onSwitchToChat();
  };

  const handleStartNewChat = () => {
    setMessages([]);
    onSwitchToChat();
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleExportDoc = (sess, e) => {
    e.stopPropagation();
    const content = `BIÊN BẢN TÓM TẮT HỘI THOẠI TRÍ AI\nChủ đề: ${sess.title}\nKỹ năng áp dụng: ${sess.skillName}\nThời gian: ${sess.date}\nNội dung: ${sess.preview}\nSố lượt trao đổi: ${sess.msgCount} tin nhắn.\nXuất bản tự động bởi Trí AI.`;
    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien_ban_${sess.id}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-page-container">
      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">Nhật ký làm việc &amp; Tham mưu</div>
          <h1 className="view-title">Lịch Sử Hội Thoại</h1>
          <p className="view-desc">Xem lại toàn bộ các phiên làm việc, kết quả phân tích hồ sơ và biên bản trao đổi với Trí AI.</p>
        </div>
        <div className="view-actions-row">
          <button className="btn-primary" onClick={handleStartNewChat}>
            <Plus size={16} /> Bắt đầu cuộc trò chuyện mới
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="view-controls-card">
        <div className="view-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nội dung hội thoại, tên hồ sơ, ngày tháng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* History Sessions List */}
      <div className="history-sessions-list">
        {filteredSessions.map((sess) => (
          <div 
            key={sess.id} 
            className="history-session-card"
            onClick={() => handleResumeSession(sess)}
          >
            <div className="session-card-main">
              <div className="session-head-row">
                <div className="session-skill-pill">
                  <Layers size={13} /> {sess.skillName}
                </div>
                <div className="session-date-txt">
                  <Clock size={13} /> {sess.date}
                </div>
              </div>

              <h3 className="session-title">{sess.title}</h3>
              <p className="session-preview-txt">{sess.preview}</p>

              <div className="session-stats-row">
                <span>{sess.msgCount} lượt trao đổi</span>
                <span>•</span>
                <span>{sess.filesCount} tệp đính kèm</span>
              </div>
            </div>

            <div className="session-actions-col">
              <button 
                className="btn-session-resume" 
                title="Tiếp tục phiên chat này"
                onClick={() => handleResumeSession(sess)}
              >
                <span>Vào Chat</span>
                <ArrowRight size={15} />
              </button>
              <div className="session-sub-actions">
                <button 
                  className="btn-icon-sub" 
                  onClick={(e) => handleExportDoc(sess, e)}
                  title="Xuất biên bản Word (.doc)"
                >
                  <Download size={15} />
                </button>
                <button 
                  className="btn-icon-sub delete-sub" 
                  onClick={(e) => handleDeleteSession(sess.id, e)}
                  title="Xóa phiên này"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="view-empty-state-card">
            <div className="empty-icon-wrap">
              <History size={40} />
            </div>
            <h3>Chưa Có Lịch Sử Hội Thoại</h3>
            <p>Hệ thống đã được làm mới sạch sẽ. Hãy bấm vào nút bên dưới hoặc nhập tin nhắn ở khung Chat để bắt đầu phiên làm việc đầu tiên cùng Trí AI.</p>
            <button className="btn-primary" onClick={handleStartNewChat}>
              <MessageSquare size={16} /> Bắt đầu cuộc trò chuyện ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
