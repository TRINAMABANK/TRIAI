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
import AdminApprovalModal from './components/AdminApprovalModal';

import { AGENTS_DATA } from './data/agentsData';

import { 
  getLoadedSkills, 
  addOrUpdateSkill, 
  getUserOwnedSkillIds, 
  getLicenseRequests,
  MASTER_ADMIN_EMAIL 
} from './data/skillsData';

import { api, setAuthToken } from './api/client';

export default function App() {
  const [currentTab, setTab] = useState('chat');
  const [bannerMode, setBannerMode] = useState('chat');
  const [skills, setSkills] = useState([]);
  const [activeSkill, setActiveSkill] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // 1. User Authentication State: BẮT ĐẦU MẶC ĐỊNH CHƯA ĐĂNG NHẬP
  const [user, setUser] = useState({
    isLoggedIn: false,
    name: '',
    email: '',
    role: '',
    plan: '',
    avatar: ''
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState('login');
  const [isAdminApprovalOpen, setIsAdminApprovalOpen] = useState(false);
  const [licenseChangeTick, setLicenseChangeTick] = useState(0);

  // 2. Xác định quyền Admin: DỰA TRÊN ROLE ĐÃ ĐƯỢC BACKEND XÁC THỰC
  const isAdmin = Boolean(
    user?.isLoggedIn && 
    (user?.role === 'owner' || user?.role === 'admin' || user?.role === 'Chủ sở hữu' || user?.role === 'Admin')
  );

  // 3. XÁC THỰC PHIÊN LÀM VIỆC TỪ SERVER KHI KHỞI ĐỘNG ỨNG DỤNG (KHÔNG TIN LOCALSTORAGE RAW)
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('triai_token');
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res && res.success && res.user) {
            setUser({
              id: res.user.id,
              name: res.user.full_name || res.user.name || res.user.email.split('@')[0],
              email: res.user.email,
              role: res.user.role,
              plan: res.user.plan || (res.user.role === 'owner' ? 'Gói Quản Trị Hệ Thống (Master)' : 'Gói Khách Hàng'),
              avatar: res.user.avatar_url || '/assets/user_avatar.png',
              isLoggedIn: true,
              isAdmin: res.user.role === 'owner' || res.user.role === 'admin'
            });
            return;
          }
        } catch (e) {
          console.warn('Phiên đăng nhập hết hạn hoặc không hợp lệ:', e);
        }
      }
      // Nếu không có token hoặc token không hợp lệ -> Reset sạch về trạng thái CHƯA ĐĂNG NHẬP
      setAuthToken('');
      setUser({ isLoggedIn: false });
    };

    verifySession();
  }, []);

  // Số lượng yêu cầu đang chờ Admin duyệt
  const pendingApprovalCount = React.useMemo(() => {
    if (!isAdmin) return 0;
    try {
      const reqs = getLicenseRequests();
      return Array.isArray(reqs) ? reqs.filter(r => r.status === 'pending').length : 0;
    } catch (e) {
      return 0;
    }
  }, [isAdmin, licenseChangeTick]);

  // Trial 15 phút state & Server License State
  const [trialStatus, setTrialStatus] = useState(null);
  const [serverOwnedSkillIds, setServerOwnedSkillIds] = useState([]);

  // Đồng bộ License và Dùng thử từ máy chủ
  useEffect(() => {
    let timer = null;
    const syncServerLicenses = async () => {
      if (user?.isLoggedIn && user?.email && !isAdmin) {
        try {
          const res = await api.licenses.getMyLicenses();
          if (res && res.success && Array.isArray(res.licenses)) {
            const activeLicIds = res.licenses
              .filter(l => l.status === 'active' || l.status === 'granted')
              .map(l => l.skill_id);
            setServerOwnedSkillIds(activeLicIds);

            const activeTrialLic = res.licenses.find(l => l.status === 'trial' || l.is_trial);
            if (activeTrialLic) {
              const expiresAt = new Date(activeTrialLic.expires_at || activeTrialLic.trial_expires_at).getTime();
              const now = Date.now();
              const remainingSec = Math.max(0, Math.floor((expiresAt - now) / 1000));
              setTrialStatus({
                hasTrial: true,
                skillId: activeTrialLic.skill_id,
                skillName: activeTrialLic.skill_name || activeTrialLic.skill_id,
                remainingSeconds: remainingSec,
                isExpired: remainingSec <= 0
              });
              return;
            }
          }
        } catch (e) {
          console.warn('Đồng bộ License từ server:', e);
        }
      }
      setTrialStatus(null);
    };

    if (user?.isLoggedIn && !isAdmin) {
      syncServerLicenses();
      timer = setInterval(syncServerLicenses, 10000);
    } else {
      setTrialStatus(null);
      setServerOwnedSkillIds([]);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user?.isLoggedIn, user?.email, isAdmin, licenseChangeTick]);

  // Danh sách Skill thuộc sở hữu của tài khoản hiện tại (kèm Skill đang dùng thử nếu còn hạn)
  const userOwnedSkillIds = React.useMemo(() => {
    if (!user?.isLoggedIn) return [];
    if (isAdmin) return null;
    const list = [...serverOwnedSkillIds];
    if (trialStatus && trialStatus.hasTrial && !trialStatus.isExpired && trialStatus.skillId) {
      if (!list.includes(trialStatus.skillId)) {
        list.push(trialStatus.skillId);
      }
    }
    return list;
  }, [user?.isLoggedIn, isAdmin, serverOwnedSkillIds, trialStatus]);

  const ownedSkills = !user?.isLoggedIn
    ? []
    : (isAdmin || !userOwnedSkillIds)
      ? skills 
      : skills.filter(s => userOwnedSkillIds.includes(s.id));

  const handleLogin = (userData, token) => {
    if (token) setAuthToken(token);
    const isUserAdmin = userData.role === 'owner' || userData.role === 'admin' || userData.role === 'Chủ sở hữu';
    
    setUser({
      ...userData,
      isLoggedIn: true,
      isAdmin: isUserAdmin
    });

    // Nếu là Admin -> Điều hướng sang /admin và mở Trung Tâm Quản Trị
    // Nếu là User thường -> Giữ ở hệ thống User
    if (isUserAdmin) {
      window.history.pushState(null, '', '/admin');
      setIsAdminApprovalOpen(true);
    } else {
      window.history.pushState(null, '', '/');
      setIsAdminApprovalOpen(false);
      setTab('chat');
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setAuthToken('');
    setUser({ isLoggedIn: false });
    setTrialStatus(null);
    setIsAdminApprovalOpen(false);
    window.history.pushState(null, '', '/');
    setTab('chat');
  };

  // Kiểm tra đường dẫn /admin khi người dùng truy cập trực tiếp
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      if (!user?.isLoggedIn) {
        openAuth('login');
      } else if (isAdmin) {
        setIsAdminApprovalOpen(true);
      } else {
        alert('Bạn không có quyền truy cập khu vực Quản trị Admin.');
        window.history.pushState(null, '', '/');
        setIsAdminApprovalOpen(false);
      }
    }
  }, [user?.isLoggedIn, isAdmin]);

  const openAuth = (mode = 'login') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
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

  // Load skills on mount
  useEffect(() => {
    const loaded = getLoadedSkills();
    setSkills(loaded);
    const pccc = loaded.find(s => s.id === 'pccc') || loaded[0];
    setActiveSkill(pccc);
  }, []);

  // Tự động chuyển activeSkill sang Skill mà tài khoản sở hữu hoặc đang dùng thử
  useEffect(() => {
    if (user?.isLoggedIn && ownedSkills.length > 0) {
      if (!activeSkill?.id || !ownedSkills.some(s => s.id === activeSkill.id)) {
        setActiveSkill(ownedSkills[0]);
      }
    }
  }, [user?.isLoggedIn, user?.email, skills, ownedSkills.length]);

  // Xử lý khi bắt đầu dùng thử 15 phút từ Cửa Hàng
  const handleStartTrial = async (pkg) => {
    if (!user?.isLoggedIn) {
      openAuth('login');
      return;
    }

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

    try {
      await api.licenses.startTrial(matchedSkill.id);
    } catch (e) {
      console.warn('Backend start trial notice:', e);
    }

    setActiveSkill(matchedSkill);
    setTab('chat');
    setBannerMode('chat');

    const trialMsg = {
      id: Date.now(),
      role: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: `🎁 BẠN ĐÃ KÍCH HOẠT DÙNG THỬ 15 PHÚT SKILL [${matchedSkill.name.toUpperCase()}] MIỄN PHÍ!\n\nBạn có trọn vẹn 15 phút trải nghiệm toàn bộ tính năng & tài liệu mẫu của ${matchedSkill.name}.\n\nSau khi hết hạn trải nghiệm, bạn có thể chuyển khoản để mở khóa bản quyền chính thức!`,
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

  // Xử lý khi khách hàng gửi xác nhận đã chuyển khoản VietQR OCB (Chờ Admin phê duyệt)
  const handleRequestSkillPurchase = (paymentInfo) => {
    if (!user?.isLoggedIn) {
      openAuth('login');
      return;
    }

    const { packageData, billingCycle, transferContent, formattedAmount } = paymentInfo;
    const skillName = packageData.name || 'Gói Skill Bản Quyền';
    const userEmail = (user?.email || 'khachhang@example.com').toLowerCase().trim();

    setLicenseChangeTick(prev => prev + 1);

    // Chuyển về màn hình chat và thông báo trạng thái Chờ phê duyệt
    setTab('chat');
    setBannerMode('chat');

    const pendingMsg = {
      id: Date.now(),
      role: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: `⏳ ĐÃ GỬI YÊU CẦU ĐĂNG KÝ BẢN QUYỀN [${skillName.toUpperCase()}]:\n\n` +
            `• 📦 Gói đăng ký: ${skillName}\n` +
            `• 💰 Số tiền chuyển khoản: ${formattedAmount || packageData.priceMonth || packageData.price}\n` +
            `• 📝 Nội dung chuyển khoản: ${transferContent}\n` +
            `• 👤 Tài khoản nhận: ${userEmail}\n` +
            `• 👑 Quản trị viên đối soát: QUANG NHỰT TRÍ (triqnnamabank@gmail.com)\n\n` +
            `📌 TRẠNG THÁI: ĐANG CHỜ ADMIN ĐỐI SOÁT NGÂN HÀNG.\n` +
            `Sau khi Quản trị viên đối soát và xác nhận giao dịch khớp sao kê OCB, Skill sẽ được kích hoạt toàn quyền cho tài khoản của bạn!`,
      checklist: [
        { label: `Gửi thông tin giao dịch: ${skillName}`, status: 'pass' },
        { label: 'Trạng thái: Chờ Quản trị viên đối soát OCB', status: 'pending' }
      ]
    };
    setMessages(prev => [...prev, pendingMsg]);
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
        text: `Xin chào! Tôi là ${agent.name} (${agent.role}). ${agent.greeting}`,
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

  const handleStartChatWithAgent = (agent) => {
    handleSwitchToChat('', agent);
  };

  // Xử lý chuyển tab có kiểm tra phân quyền cho các tab nội bộ cá nhân
  const handleSelectTab = (tabId) => {
    if (['projects', 'files', 'history'].includes(tabId) && !user?.isLoggedIn) {
      openAuth('login');
      return;
    }
    setTab(tabId);
    if (tabId === 'chat') {
      setBannerMode('chat');
      setTimeout(() => {
        const inputEl = document.querySelector('.standard-chat-text-input');
        if (inputEl) inputEl.focus();
      }, 60);
    }
  };

  return (
    <div className="tri-ai-layout">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={handleSelectTab} 
        onOpenSkillManager={() => {
          if (!isAdmin) {
            openAuth('login');
            return;
          }
          setIsSkillManagerOpen(true);
        }}
        onOpenAccountModal={() => {
          if (!user?.isLoggedIn) {
            openAuth('login');
            return;
          }
          setIsAccountModalOpen(true);
        }}
        onOpenAdminApproval={() => {
          if (!isAdmin) {
            alert('Bạn không có quyền truy cập Trung Tâm Quản Trị Admin.');
            return;
          }
          setIsAdminApprovalOpen(true);
        }}
        pendingApprovalCount={pendingApprovalCount}
        skills={ownedSkills}
        allSkillsCount={skills.length}
        activeSkill={activeSkill}
        isAdmin={isAdmin}
        onSelectSkill={(s) => {
          setActiveSkill(s);
          setTab('chat');
          setBannerMode('chat');
        }}
        onSelectAgent={(agent) => handleStartChatWithAgent(agent)}
        onOpenStore={() => setTab('store')}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        user={user}
        onOpenAuthModal={openAuth}
        onLogout={handleLogout}
      />

      {/* 2. Center Column */}
      <main className="center-viewport-column">
        {/* TAB 1: Chat với Trí AI */}
        {currentTab === 'chat' && (
          <>
            <HeroBanner 
              activeTab={bannerMode}
              onChangeTab={(mode) => {
                setTab('chat');
                setBannerMode(mode);
              }}
              onTriggerVoice={() => {
                if (!user?.isLoggedIn) {
                  openAuth('login');
                  return;
                }
                setTab('chat');
                setBannerMode('voice');
              }}
              onTriggerFileUpload={() => {
                if (!user?.isLoggedIn) {
                  openAuth('login');
                  return;
                }
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
              pendingApprovalCount={pendingApprovalCount}
              onOpenAdminApproval={() => {
                if (!isAdmin) {
                  alert('Bạn không có quyền truy cập Trung Tâm Quản Trị Admin.');
                  return;
                }
                setIsAdminApprovalOpen(true);
              }}
              onOpenStore={() => setIsStoreOpen(true)}
              onOpenSkillManager={() => {
                if (!isAdmin) {
                  openAuth('login');
                  return;
                }
                setIsSkillManagerOpen(true);
              }}
              onOpenAccountModal={() => {
                if (!user?.isLoggedIn) {
                  openAuth('login');
                  return;
                }
                setIsAccountModalOpen(true);
              }}
              onOpenAuthModal={openAuth}
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
              user={user}
              isAdmin={isAdmin}
              ownedSkills={ownedSkills}
              trialStatus={trialStatus}
              onOpenStore={() => setTab('store')}
              onOpenAuthModal={openAuth}
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
            onOpenSkillManager={isAdmin ? () => setIsSkillManagerOpen(true) : null}
            onSwitchToChat={handleSwitchToChat}
            onOpenStore={() => setTab('store')}
          />
        )}

        {/* TAB 3: Agent chuyên ngành */}
        {currentTab === 'agents' && (
          <AgentsView 
            onSelectAgent={(agent) => setSelectedAgent(agent)}
            onSwitchToChat={handleSwitchToChat}
            ownedSkills={ownedSkills}
            onOpenStore={() => setTab('store')}
          />
        )}

        {/* TAB 4: Cửa hàng Skill */}
        {currentTab === 'store' && (
          <StoreView 
            onRequestPurchase={handleRequestSkillPurchase}
            onStartTrial={handleStartTrial}
            onSwitchToChat={handleSwitchToChat}
            user={user}
            onOpenAuthModal={openAuth}
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
          MODALS POPUP
          ========================================================================= */}
      
      {/* 0. Bảng Chọn Nhanh Skill */}
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
        onRequestPurchase={(info) => {
          handleRequestSkillPurchase(info);
          setIsStoreOpen(false);
          setTab('chat');
        }}
      />

      {/* 5. Thông tin Tài khoản & Bản quyền Pro */}
      <AccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        onOpenAuthModal={openAuth}
        onLogout={handleLogout}
      />

      {/* 6. Đăng Nhập / Đăng Ký Tài Khoản Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        initialMode={authModalInitialMode}
      />

      {/* 7. TRUNG TÂM PHÊ DUYỆT & CẤP BẢN QUYỀN (CHỈ DÀNH CHO ADMIN) */}
      <AdminApprovalModal 
        isOpen={isAdminApprovalOpen}
        onClose={() => {
          setIsAdminApprovalOpen(false);
          window.history.pushState(null, '', '/');
        }}
        skills={skills}
        adminUser={user}
        onLicenseChanged={() => setLicenseChangeTick(prev => prev + 1)}
      />
    </div>
  );
}
