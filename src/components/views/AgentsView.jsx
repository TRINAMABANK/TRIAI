import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  ShieldCheck, 
  Award, 
  CheckCircle, 
  ChevronRight, 
  Sparkles,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { AGENTS_DATA } from '../../data/agentsData';

export default function AgentsView({ onSelectAgent, onSwitchToChat }) {
  const [search, setSearch] = useState('');

  // Enhanced agent list with KOL Ý Ngọc
  const fullAgents = [
    ...AGENTS_DATA,
    {
      id: 'kol-y-ngoc',
      name: 'Ý Ngọc AI',
      role: 'KOL Thời Trang & Giám Đốc Hình Ảnh',
      avatar: '/assets/y_ngoc_aodai.jpg',
      status: 'Sẵn sàng hỗ trợ',
      specialties: ['Tạo ảnh Lookbook 8K', 'Quảng cáo Áo dài & Haute Couture', 'Khóa nhận diện nhân vật', 'Chiến dịch Commercial Photography'],
      bio: 'Người mẫu AI thế hệ mới với khả năng giữ nhất quán 100% tỷ lệ khuôn mặt và thần thái sang trọng, chuyên đại diện hình ảnh cho các thương hiệu thời trang cao cấp.',
      greeting: 'Dạ em chào anh Trí! Em là Ý Ngọc, đại diện hình ảnh KOL Thời Trang AI. Em đã sẵn sàng khởi tạo bộ ảnh lookbook mới cùng anh!'
    }
  ];

  const filteredAgents = fullAgents.filter(agent => 
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.role.toLowerCase().includes(search.toLowerCase()) ||
    agent.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStartChatWithAgent = (agent, samplePrompt = '') => {
    onSwitchToChat(samplePrompt || `Xin chào ${agent.name}! Tôi muốn bạn tư vấn về lĩnh vực ${agent.role}.`, agent);
  };

  return (
    <div className="view-page-container">
      {/* View Header */}
      <div className="view-header-bar">
        <div>
          <div className="view-badge">Đội ngũ chuyên gia AI thực thụ</div>
          <h1 className="view-title">Agent Chuyên Ngành</h1>
          <p className="view-desc">Tương tác 1-1 với các trợ lý AI chuyên biệt được huấn luyện theo kiến thức nghiệp vụ sâu từng ngành nghề.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="view-controls-card">
        <div className="view-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên chuyên gia, chức danh (Kỹ sư, Mua sắm, Pháp lý, KOL, Tài chính)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Agents Roster Grid */}
      <div className="agents-cards-grid">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="agent-master-card">
            <div className="agent-card-header">
              <div className="agent-avatar-frame">
                <img 
                  src={agent.avatar} 
                  alt={agent.name} 
                  className="agent-avatar-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <span className="agent-online-dot" title="Đang trực tuyến"></span>
              </div>
              <div className="agent-header-info">
                <div className="agent-status-tag">
                  <UserCheck size={13} /> {agent.status}
                </div>
                <h3 className="agent-card-name">{agent.name}</h3>
                <div className="agent-card-role">{agent.role}</div>
              </div>
            </div>

            <div className="agent-card-body">
              <p className="agent-bio-text">{agent.bio}</p>

              <div className="agent-specialties-block">
                <div className="specialties-title">Nghiệp vụ cốt lõi:</div>
                <div className="specialties-chips">
                  {agent.specialties.map((spec, i) => (
                    <span key={i} className="spec-chip">{spec}</span>
                  ))}
                </div>
              </div>

              <div className="agent-greeting-preview">
                <b>Câu chào:</b>
                <p>"{agent.greeting}"</p>
              </div>
            </div>

            <div className="agent-card-footer">
              <button 
                className="btn-agent-chat"
                onClick={() => handleStartChatWithAgent(agent)}
              >
                <MessageSquare size={16} /> Bắt đầu trò chuyện
              </button>
              <button 
                className="btn-agent-profile"
                onClick={() => onSelectAgent(agent)}
              >
                Hồ sơ chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
