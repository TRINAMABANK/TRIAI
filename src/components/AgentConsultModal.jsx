import React from 'react';
import { X, MessageSquare, PhoneCall, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function AgentConsultModal({ agent, onClose, onStartChatWithAgent }) {
  if (!agent) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container agent-consult-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Sparkles className="modal-title-icon" size={24} />
            <div>
              <h3>Hồ Sơ Chuyên Gia: {agent.name}</h3>
              <p>{agent.role}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="agent-detail-body">
          <div className="agent-hero-card">
            <div className="agent-big-avatar-wrap">
              <img src={agent.avatar} alt={agent.name} className="agent-big-img" />
              <div className="agent-live-badge">● Đang trực tuyến</div>
            </div>

            <div className="agent-bio-col">
              <h4>{agent.name}</h4>
              <div className="agent-badge-role">{agent.role}</div>
              <p className="agent-bio-text">{agent.bio}</p>

              <div className="agent-specialties-group">
                <b>Lĩnh vực tham mưu chủ chốt:</b>
                <div className="specialties-tags">
                  {agent.specialties.map((s, idx) => (
                    <span key={idx} className="spec-tag">
                      <CheckCircle2 size={13} /> {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="agent-greeting-quote">
            “{agent.greeting}”
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Đóng</button>
          <button 
            className="btn-call-consult"
            onClick={() => {
              alert(`Đang kết nối thoại trực tiếp với ${agent.name}...`);
            }}
          >
            <PhoneCall size={16} /> Kết nối giọng nói
          </button>
          <button 
            className="btn-chat-agent"
            onClick={() => onStartChatWithAgent(agent)}
          >
            <MessageSquare size={16} /> Nhắn tin với {agent.name}
          </button>
        </div>
      </div>
    </div>
  );
}
