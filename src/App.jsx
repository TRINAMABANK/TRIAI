import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HeroBanner from './components/HeroBanner';
import ChatSection from './components/ChatSection';

// Views for Column 1 navigation tabs
import SkillsView from './components/views/SkillsView';
import AgentsView from './components/views/AgentsView';
import StoreView from './components/views/StoreView';
import ProjectsView from './components/views/ProjectsView';
import FilesView from './components/views/FilesView';
import HistoryView from './components/views/HistoryView';
import SettingsView from './components/views/SettingsView';

// Modals
import SkillManagerModal from './components/SkillManagerModal';
import SkillPickerModal from './components/SkillPickerModal';
import FileViewerModal from './components/FileViewerModal';
import AgentConsultModal from './components/AgentConsultModal';
import StoreModal from './components/StoreModal';
import AccountModal from './components/AccountModal';
import AuthModal from './components/AuthModal';

import { 
  getLoadedSkills, 
  addOrUpdateSkill, 
  getUserOwnedSkillIds, 
  saveUserOwnedSkill,
  startSkillTrial,
  getActiveTrial
} from './data/skillsData';

export default function App() {
  const [currentTab, setTab] = useState('chat');
  const [bannerMode, setBannerMode] = useState('chat');
  const [skills, setSkills] = useState([]);
  const [activeSkill, setActiveSkill] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // User Authentication State (QUANG NHỰT TRÍ - Admin Mặc định)
  const DEFAULT_USER = {
    name: 'QUANG NHỰT TRÍ',
    email: 'triqnnamabank@gmail.com',
    avatar: '/assets/user_avatar.png',
    role: 'Chủ sở hữu',
    plan: 'Gói Admin Toàn Quyền (Full 33+ Skill)',
    isLoggedIn: true,
    isAdmin: true
  };

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tri_ai_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'quangnhuttri@gmail.com') {
          parsed.email = 'triqnnamabank@gmail.com';
          localStorage.setItem('tri_ai_user_session', JSON.stringify(parsed));
        }
        return parsed;
      }
      return DEFAULT_USER;
    } catch (e) {
      return DEFAULT_USER;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Xác định quyền Admin
  const isAdmin = user.isLoggedIn && (
    user.email?.toLowerCase() === 'triqnnamabank@gmail.com' ||
    user.role === 'Chủ sở hữu' ||
    user.role === 'Admin' ||
    user.isAdmin === true
  );

  // Trial 15 phút state & Live Countdown Timer (mỗi 1 giây)
  const [trialStatus, setTrialStatus] = useState(null);

  useEffect(() => {
    const checkTrial = () => {
      if (user?.email && !isAdmin) {
        const active = getActiveTrial(user.email);
        setTrialStatus(active);
      } else {
        setTrialStatus(null);
      }
    };
    checkTrial();
    const timer = setInterval(checkTrial, 1000);
    return () => clearInterval(timer);
  }, [user?.email, isAdmin]);

  // Danh sách Skill thuộc sở hữu của tài khoản hiện tại (kèm Skill đang dùng thử nếu còn hạn)
  const baseOwnedSkillIds = getUserOwnedSkillIds(user.email, user.role);
  const userOwnedSkillIds = React.useMemo(() => {
    if (isAdmin || baseOwnedSkillIds === null) return null;
    const list = [...baseOwnedSkillIds];
    if (trialStatus && trialStatus.hasTrial && !trialStatus.isExpired && trialStatus.skillId) {
      if (!list.includes(trialStatus.skillId)) {
        list.push(trialStatus.skillId);
      }
    }
    return list;
  }, [isAdmin, baseOwnedSkillIds, trialStatus]);

  const ownedSkills = (isAdmin || !userOwnedSkillIds) 
    ? skills 
    : skills.filter(s => userOwnedSkillIds.includes(s.id));

  const handleLogin = (userData) => {
    const updated = {
      ...DEFAULT_USER,
      ...userData,
      isLoggedIn: true
    };
    setUser(updated);
    try {
      localStorage.setItem('tri_ai_user_session', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleLogout = () => {
    const loggedOut = {
      ...user,
      isLoggedIn: false
    };
    setUser(loggedOut);
    try {
      localStorage.setItem('tri_ai_user_session', JSON.stringify(loggedOut));
    } catch (e) {}
  };

  // Modals state
  const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false);
  const [isSkillManagerOpen, setIsSkillManagerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Khởi tạo sạch để bắt đầu sử dụng từ đầu
  const [messages, setMessages] = useState([]);

  // Load skills from local storage on mount
  useEffect(() => {
    const loaded = getLoadedSkills();
    setSkills(loaded);
    const pccc = loaded.find(s => s.id === 'pccc') || loaded[0];
    setActiveSkill(pccc);
  }, []);

  // Tự động chuyển activeSkill sang Skill mà tài khoản sở hữu hoặc đang dùng thử
  useEffect(() => {
    if (ownedSkills.length > 0) {
      if (!activeSkill?.id || !ownedSkills.some(s => s.id === activeSkill.id)) {
        setActiveSkill(ownedSkills[0]);
      }
    }
  }, [user.email, skills, ownedSkills.length]);

  // Xử lý khi bắt đầu dùng thử 15 phút từ Cửa Hàng
  const handleStartTrial = (pkg) => {
    const packageToSkillMap = {
      'store-kol': 'kol-thoi-trang',
      'kol-thoi-trang': 'kol-thoi-trang',
      'store-pccc': 'pccc',
      'pccc': 'pccc',
      'store-muasam': 'mua-sam',
      'store-mua-sam': 'mua-sam',
      'mua-sam': 'mua-sam',
      'store-mep': 'mep',
      'mep': 'mep',
      'store-phap-ly': 'phap-ly',
      'phap-ly': 'phap-ly',
      'store-van-hanh': 'van-hanh-toa-nha',
      'van-hanh-toa-nha': 'van-hanh-toa-nha'
    };

    const targetSkillId = packageToSkillMap[pkg.id] || pkg.id;
    const matchedSkill = skills.find(s => s.id === targetSkillId || s.id === pkg.id || s.name.toLowerCase() === pkg.name.toLowerCase()) || skills[0];

    const currentEmail = user.email || 'khachhang.moi@gmail.com';
    startSkillTrial(currentEmail, matchedSkill.id, 15);
    setActiveSkill(matchedSkill);
    setTab('chat');
    setBannerMode('chat');

    const trialMsg = {
      id: Date.now(),
      role: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: `🎁 BẠN ĐÃ KÍCH HOẠT DÙNG THỬ 15 PHÚT SKILL [${matchedSkill.name.toUpperCase()}] MIỄN PHÍ!\n\nBạn có trọn vẹn 15 phút trải nghiệm toàn bộ tính năng & tài liệu mẫu của ${matchedSkill.name}. Đồng hồ đếm ngược trực tiếp đang hiển thị ở góc trên bên phải (cạnh biểu tượng Cửa hàng và Chuông thông báo).\n\nSau 15 phút, bạn có thể nộp tiền quét mã QR để mở khóa bản quyền chính thức!`,
      checklist: matchedSkill.checklist || [
        { label: `Kích hoạt dùng thử: ${matchedSkill.name}`, status: 'pass' },
        { label: 'Thời lượng: 15 phút miễn phí', status: 'pass' }
      ],
      files: matchedSkill.sampleFiles || []
    };
    setMessages(prev => [...prev, trialMsg]);
  };

  // Filter skills based on search
  const filteredSkills = searchTerm 
    ? skills.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.desc && s.desc.toLowerCase().includes(searchTerm.toLowerCase())))
    : skills;

  // Xử lý khi mua / kích hoạt gói Skill trong Store
  const handleActivatePurchasedSkill = (purchasedPkg) => {
    const packageToSkillMap = {
      'store-kol': 'kol-thoi-trang',
      'kol-thoi-trang': 'kol-thoi-trang',
      'store-pccc': 'pccc',
      'pccc': 'pccc',
      'store-muasam': 'mua-sam',
      'store-mua-sam': 'mua-sam',
      'mua-sam': 'mua-sam',
      'store-mep': 'mep',
      'mep': 'mep',
      'store-phap-ly': 'phap-ly',
      'phap-ly': 'phap-ly',
      'store-van-hanh': 'van-hanh-toa-nha',
      'van-hanh-toa-nha': 'van-hanh-toa-nha'
    };

    const targetSkillId = packageToSkillMap[purchasedPkg.id] || purchasedPkg.id;
    let matchedSkill = skills.find(s => s.id === targetSkillId || s.id === purchasedPkg.id || s.name.toLowerCase() === purchasedPkg.name.toLowerCase());
    
    if (!matchedSkill) {
      matchedSkill = {
        id: targetSkillId || 'skill-' + Date.now(),
        name: purchasedPkg.name,
        category: purchasedPkg.category || 'Gói đã mua',
        desc: purchasedPkg.desc || 'Bộ kỹ năng chuyên môn đã kích hoạt bản quyền.',
        color: purchasedPkg.color || 'blue',
        price: purchasedPkg.price || 'Đã mua',
        systemRole: `Chuyên gia ${purchasedPkg.name}`,
        samplePrompt: `Thực thi quy trình chuyên môn ${purchasedPkg.name}`,
        checklist: [
          { label: 'Kích hoạt bản quyền thương mại: Thành công', status: 'pass' },
          { label: 'Quy trình đối soát dữ liệu: Sẵn sàng 100%', status: 'pass' }
        ]
      };
      const updatedList = addOrUpdateSkill(matchedSkill);
      setSkills(updatedList);
    }
    
    // Lưu quyền sở hữu Skill cho email người dùng hiện tại
    if (user.email) {
      saveUserOwnedSkill(user.email, matchedSkill.id);
    }

    // Cập nhật thông tin gói của người dùng
    const updatedUser = {
      ...user,
      role: 'Khách hàng',
      plan: `Gói ${matchedSkill.name} (Đã thanh toán)`
    };
    setUser(updatedUser);
    try {
      localStorage.setItem('tri_ai_logged_user', JSON.stringify(updatedUser));
    } catch (e) {}
    
    setActiveSkill(matchedSkill);
    setTab('chat');
    setBannerMode('chat');

    // Thông báo chào mừng kích hoạt chuyên biệt trong Chat
    const celebrationMsg = {
      id: Date.now(),
      role: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: `🎉 CHÚC MỪNG BẠN ĐÃ MỞ KHÓA BẢN QUYỀN [${matchedSkill.name.toUpperCase()}] THÀNH CÔNG!\n\nToàn bộ không gian làm việc của TRÍ AI đã được chuyển đổi và tối ưu riêng theo tính năng & quy trình của ${matchedSkill.name}. Bạn có thể bắt đầu bằng việc đặt câu hỏi hoặc chọn một trong các thao tác nhanh bên dưới.`,
      checklist: matchedSkill.checklist || [
        { label: `Kích hoạt năng lực: ${matchedSkill.name}`, status: 'pass' },
        { label: 'Bản quyền thương mại: Đã xác thực thành công', status: 'pass' }
      ],
      files: matchedSkill.sampleFiles || []
    };
    setMessages(prev => [...prev, celebrationMsg]);
  };

  // Chuyển sang chat kèm tin nhắn gợi ý hoặc Agent
  const handleSwitchToChat = (promptText = '', agent = null) => {
    setTab('chat');
    setBannerMode('chat');
    if (agent) {
      setSelectedAgent(null);
      const newMsg = {
        id: Date.now(),
        role: 'ai',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        text: `Dạ anh Trí! Em là ${agent.name} (${agent.role}). ${agent.greeting}`,
        checklist: [],
        files: []
      };
      setMessages(prev => [...prev, newMsg]);
    } else if (promptText) {
      const userMsg = {
        id: Date.now(),
        role: 'user',
        text: promptText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMsg]);
    }
    setTimeout(() => {
      const inputEl = document.querySelector('.standard-chat-text-input');
      if (inputEl) inputEl.focus();
    }, 80);
  };

  // Xử lý khi chọn Agent từ RightSidebar
  const handleStartChatWithAgent = (agent) => {
    handleSwitchToChat('', agent);
  };

  return (
    <div className="tri-ai-layout">
      {/* 1. Left Sidebar Navigation (Đã gộp toàn bộ tính năng Cột 3 vào Cột 1) */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={(tabId) => {
          setTab(tabId);
          if (tabId === 'chat') {
            setBannerMode('chat');
            setTimeout(() => {
              const inputEl = document.querySelector('.standard-chat-text-input');
              if (inputEl) inputEl.focus();
            }, 60);
          }
        }} 
        onOpenSkillManager={() => setIsSkillManagerOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        skills={ownedSkills}
        allSkillsCount={skills.length}
        activeSkill={activeSkill}
        isAdmin={isAdmin}
        onSelectSkill={(s) => {
          setActiveSkill(s);
          setTab('chat');
          setBannerMode('chat');
          setTimeout(() => {
            const inputEl = document.querySelector('.standard-chat-text-input');
            if (inputEl) inputEl.focus();
          }, 60);
        }}
        onSelectAgent={(agent) => handleStartChatWithAgent(agent)}
        onOpenStore={() => setTab('store')}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Center Column: Render dynamically based on selected Tab */}
      <main className="center-viewport-column">
        {/* TAB 1: Chat với Trí AI (Có Banner cố định đỉnh Cột 2 kèm Chuông & Avatar góc phải trên cùng) */}
        {currentTab === 'chat' && (
          <>
            <HeroBanner 
              activeTab={bannerMode}
              onChangeTab={(mode) => {
                setTab('chat');
                setBannerMode(mode);
                if (mode === 'chat') {
                  setTimeout(() => {
                    const inputEl = document.querySelector('.standard-chat-text-input');
                    if (inputEl) inputEl.focus();
                  }, 60);
                }
              }}
              onTriggerVoice={() => {
                setTab('chat');
                setBannerMode('voice');
              }}
              onTriggerFileUpload={() => {
                setTab('chat');
                setBannerMode('file');
              }}
              onTriggerSkillSelect={() => {
                setIsSkillPickerOpen(true);
              }}
              onScrollToResult={() => {
                setTab('chat');
                setBannerMode('result');
              }}
              onFocusChat={() => {
                setTab('chat');
                setBannerMode('chat');
                setTimeout(() => {
                  const inputEl = document.querySelector('.standard-chat-text-input');
                  if (inputEl) inputEl.focus();
                }, 60);
              }}
              user={user}
              activeSkill={activeSkill}
              isAdmin={isAdmin}
              trialStatus={trialStatus}
              onOpenStore={() => setIsStoreOpen(true)}
              onOpenSkillManager={() => setIsSkillManagerOpen(true)}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
            />

            <ChatSection 
              activeSkill={activeSkill}
              onOpenSkillPicker={() => setIsSkillPickerOpen(true)}
              onOpenFileViewer={(file) => setSelectedFile(file)}
              messages={messages}
              setMessages={setMessages}
              bannerMode={bannerMode}
              onChangeBannerMode={(mode) => setBannerMode(mode)}
              onSelectSkill={(s) => setActiveSkill(s)}
              activeAgent={selectedAgent}
              onSelectAgent={(agent) => setSelectedAgent(agent)}
            />
          </>
        )}

        {/* TAB 2: Kho Skill */}
        {currentTab === 'skills' && (
          <SkillsView 
            skills={skills}
            ownedSkills={ownedSkills}
            isAdmin={isAdmin}
            user={user}
            activeSkill={activeSkill}
            onSelectSkill={(s) => setActiveSkill(s)}
            onOpenSkillManager={() => setIsSkillManagerOpen(true)}
            onSwitchToChat={handleSwitchToChat}
            onOpenStore={() => setTab('store')}
          />
        )}

        {/* TAB 3: Agent chuyên ngành */}
        {currentTab === 'agents' && (
          <AgentsView 
            onSelectAgent={(agent) => setSelectedAgent(agent)}
            onSwitchToChat={handleSwitchToChat}
          />
        )}

        {/* TAB 4: Cửa hàng Skill */}
        {currentTab === 'store' && (
          <StoreView 
            onActivateSkill={handleActivatePurchasedSkill}
            onStartTrial={handleStartTrial}
            onSwitchToChat={handleSwitchToChat}
          />
        )}

        {/* TAB 5: Dự án của tôi */}
        {currentTab === 'projects' && (
          <ProjectsView 
            onSwitchToChat={handleSwitchToChat}
            onSelectSkill={(s) => setActiveSkill(s)}
            skills={ownedSkills}
          />
        )}

        {/* TAB 6: Tài liệu & File */}
        {currentTab === 'files' && (
          <FilesView 
            onOpenFileViewer={(file) => setSelectedFile(file)}
            onSwitchToChat={handleSwitchToChat}
          />
        )}

        {/* TAB 7: Lịch sử hội thoại */}
        {currentTab === 'history' && (
          <HistoryView 
            onSwitchToChat={() => {
              setTab('chat');
              setBannerMode('chat');
            }}
            setMessages={setMessages}
          />
        )}

        {/* TAB 8: Cài đặt */}
        {currentTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* =========================================================================
          MODALS POPUP (HIỆN Ở CHÍNH GIỮA MÀN HÌNH & NÚT CLOSE BÊN PHẢI TRÊN CÙNG)
          ========================================================================= */}
      
      {/* 0. Bảng Chọn Nhanh Skill (Khi bấm nút "Chọn Skill") */}
      <SkillPickerModal 
        isOpen={isSkillPickerOpen}
        onClose={() => setIsSkillPickerOpen(false)}
        skills={skills}
        ownedSkills={ownedSkills}
        isAdmin={isAdmin}
        user={user}
        activeSkill={activeSkill}
        onSelectSkill={(s) => {
          setActiveSkill(s);
          setTab('chat');
          setBannerMode('chat');
        }}
        onOpenStore={() => setTab('store')}
        onOpenSkillManager={isAdmin ? () => setIsSkillManagerOpen(true) : null}
      />

      {/* 1. Quản lý & Nạp Skill mới */}
      <SkillManagerModal 
        isOpen={isSkillManagerOpen}
        onClose={() => setIsSkillManagerOpen(false)}
        skills={skills}
        setSkills={setSkills}
        activeSkill={activeSkill}
        setActiveSkill={setActiveSkill}
      />

      {/* 2. Xem & Tải tệp đính kèm */}
      <FileViewerModal 
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />

      {/* 3. Hồ sơ chuyên gia Agent */}
      <AgentConsultModal 
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onStartChatWithAgent={handleStartChatWithAgent}
      />

      {/* 4. Cửa hàng Skill Modal */}
      <StoreModal 
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        onStartTrial={handleStartTrial}
        onActivateSkill={(s) => {
          handleActivatePurchasedSkill(s);
          setIsStoreOpen(false);
          setTab('chat');
        }}
      />

      {/* 5. Thông tin Tài khoản & Bản quyền Pro */}
      <AccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 6. Đăng Nhập / Đổi Tài Khoản Gmail Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        currentUser={user}
      />
    </div>
  );
}
