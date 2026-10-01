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
  saveUserOwnedSkill,
  startSkillTrial,
  getActiveTrial,
  getLicenseRequests,
  saveLicenseRequests,
  createLicenseRequest,
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
      return reqs.filter(r => r.status === 'pending').length;
    } catch (e) {
      return 0;
    }
  }, [isAdmin, licenseChangeTick]);

  // Trial 15 phút state & Live Countdown Timer (mỗi 1 giây)
  const [trialStatus, setTrialStatus] = useState(null);

  useEffect(() => {
    const checkTrial = () => {
      if (user?.isLoggedIn && user?.email && !isAdmin) {
        const active = getActiveTrial(user.email);
        setTrialStatus(active);
      } else {
        setTrialStatus(null);
      }
    };
    checkTrial();
    const timer = setInterval(checkTrial, 1000);
    return () => clearInterval(timer);
  }, [user?.isLoggedIn, user?.email, isAdmin]);

  // Danh sách Skill thuộc sở hữu của tài khoản hiện tại (kèm Skill đang dùng thử nếu còn hạn)
  const baseOwnedSkillIds = user?.isLoggedIn ? getUserOwnedSkillIds(user.email, user.role) : [];
  const userOwnedSkillIds = React.useMemo(() => {
    if (!user?.isLoggedIn) return [];
    if (isAdmin || baseOwnedSkillIds === null) return null;
    const list = [...baseOwnedSkillIds];
    if (trialStatus && trialStatus.hasTrial && !trialStatus.isExpired && trialStatus.skillId) {
      if (!list.includes(trialStatus.skillId)) {
        list.push(trialStatus.skillId);
      }
    }
    return list;
  }, [user?.isLoggedIn, isAdmin, baseOwnedSkillIds, trialStatus]);

  const ownedSkills = !user?.isLoggedIn
    ? []
    : (isAdmin || !userOwnedSkillIds)
      ? skills 
      : skills.filter(s => userOwnedSkillIds.includes(s.id));

  const handleLogin = (userData, token) => {
    if (token) setAuthToken(token);
    setUser({
      ...userData,
      isLoggedIn: true,
      isAdmin: userData.role === 'owner' || userData.role === 'admin' || userData.role === 'Chủ sở hữu'
    });
  };

  const handleLogout = () => {
    api.auth.logout();
    setAuthToken('');
    setUser({ isLoggedIn: false });
    setTrialStatus(null);
    setTab('chat');
  };

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
  const handleStartTrial = (pkg) => {
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

    const currentEmail = user.email || 'khachhang@example.com';
    startSkillTrial(currentEmail, matchedSkill.id, 15);
    setActiveSkill(matchedSkill);
    setTab('chat');
    setBannerMode('chat');

    const trialMsg = {
      id: Date.now(),
      role: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: `🎁 BẠN ĐÃ KÍCH HOẠT DÙNG THỬ 15 PHÚT SKILL [${matchedSkill.name.toUpperCase()}] MIỄN PHÍ!\n\nBạn có trọn vẹn 15 phút trải nghiệm toàn bộ tính năng & tài liệu mẫu của ${matchedSkill.name}. Đồng hồ đếm ngược trực tiếp đang hiển thị ở góc trên bên phải.\n\nSau 15 phút, bạn có thể nộp tiền quét mã QR để mở khóa bản quyền chính thức!`,
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
      'van-hanh-toa-nha': 'van-hanh-toa-nha',
      'store-master-33': 'master-33',
      'store-enterprise': 'master-33'
    };

    const skillToAgentMap = {
      'kol-thoi-trang': 'tro-ly-kol',
      'pccc': 'anh-an',
      'mua-sam': 'tro-ly-muasam',
      'mep': 'anh-an',
      'phap-ly': 'tro-ly-phaply',
      'van-hanh-toa-nha': 'anh-an'
    };

    const targetSkillId = packageToSkillMap[purchasedPkg.id] || purchasedPkg.id;
    const isMasterAll = targetSkillId === 'master-33' || purchasedPkg.id === 'store-master-33' || purchasedPkg.id === 'store-enterprise';

    let matchedSkill = isMasterAll 
      ? (skills.find(s => s.id === 'kol-thoi-trang') || skills[0])
      : skills.find(s => s.id === targetSkillId || s.id === purchasedPkg.id || s.name?.toLowerCase() === purchasedPkg.name?.toLowerCase());

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

    const skillName = matchedSkill?.name || purchasedPkg.name;
    const userEmail = (user?.email || 'khachhang@example.com').toLowerCase().trim();
    const userName = user?.name || 'Khách hàng';

    // 1. CẤP QUYỀN SỞ HỮU SKILL CHO TÀI KHOẢN KHÁCH HÀNG
    if (isMasterAll) {
      skills.forEach(s => saveUserOwnedSkill(userEmail, s.id));
    } else if (matchedSkill?.id) {
      saveUserOwnedSkill(userEmail, matchedSkill.id);
    }

    // 2. GÁN AGENT TƯƠNG ỨNG VỚI SKILL ĐÃ MUA
    const targetAgentId = skillToAgentMap[matchedSkill?.id] || (matchedSkill?.id === 'kol-thoi-trang' ? 'tro-ly-kol' : 'anh-an');
    const matchedAgent = AGENTS_DATA.find(a => a.id === targetAgentId) || AGENTS_DATA[0];
    setSelectedAgent(matchedAgent);

    // 3. GHI NHẬN GIAO DỊCH
    try {
      const allReqs = getLicenseRequests();
      const autoApprovedLog = {
        id: `REQ-PAY-${Date.now().toString().slice(-6)}`,
        email: userEmail,
        userName: userName,
        skillId: isMasterAll ? 'master-33' : matchedSkill.id,
        skillName: isMasterAll ? 'Trọn Bộ 33 Skill Master & Agent' : skillName,
        type: 'purchase_qr',
        price: purchasedPkg.priceMonth || purchasedPkg.price || 'Đã thanh toán VietQR OCB',
        time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        status: 'approved',
        approvedBy: 'Hệ thống Quét VietQR OCB (Tự động)',
        approvedAt: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        phone: '',
        notes: `Khách hàng quét mã VietQR OCB thành công. Hệ thống tự động mở khóa Skill [${skillName}] & Trợ lý [${matchedAgent.name}].`
      };
      saveLicenseRequests([autoApprovedLog, ...allReqs]);
      setLicenseChangeTick(prev => prev + 1);
    } catch (e) {}

    // 4. CẬP NHẬT THÔNG TIN TÀI KHOẢN
    const updatedUser = {
      ...user,
      plan: isMasterAll ? 'Trọn Gói 33 Skill VIP Toàn Quyền' : `Gói ${skillName} & ${matchedAgent.name} (Đã thanh toán QR)`
    };
    setUser(updatedUser);

    // 5. KÍCH HOẠT SKILL VÀ CHUYỂN NGAY VÀO KHÔNG GIAN CHAT
    setActiveSkill(matchedSkill);
    setTab('chat');
    setBannerMode('chat');

    // 6. THÔNG BÁO CHÚC MỪNG
    const celebrationMsg = {
      id: Date.now(),
      role: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: `🎉 XÁC NHẬN THANH TOÁN VIETQR THÀNH CÔNG! HỆ THỐNG ĐÃ KÍCH HOẠT SKILL VÀ AGENT CHO BẠN!\n\n` +
            `• ✨ Skill đã kích hoạt: [${isMasterAll ? 'TRỌN BỘ 33 SKILL MASTER' : skillName.toUpperCase()}]\n` +
            `• 🤖 Trợ lý Agent đồng hành: ${matchedAgent.name} (${matchedAgent.role})\n` +
            `• 📧 Cấp quyền cho tài khoản: ${userEmail}\n` +
            `• 👑 Đối soát thanh toán: Đã xác thực thành công qua VietQR OCB (STK: 0982441446 - QUANG NHỰT TRÍ)\n\n` +
            `"${matchedAgent.greeting}"\n\nToàn bộ năng lực xử lý, tài liệu và prompt mẫu đã được mở khóa 100%. Bạn có thể bắt đầu ngay!`,
      checklist: matchedSkill.checklist || [
        { label: `Kích hoạt năng lực: ${skillName}`, status: 'pass' },
        { label: `Kết nối Trợ lý Agent: ${matchedAgent.name}`, status: 'pass' },
        { label: 'Bản quyền thương mại VietQR: Đã xác thực thành công 100%', status: 'pass' }
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
          />
        )}

        {/* TAB 4: Cửa hàng Skill */}
        {currentTab === 'store' && (
          <StoreView 
            onActivateSkill={handleActivatePurchasedSkill}
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
        onClose={() => setIsAdminApprovalOpen(false)}
        skills={skills}
        adminUser={user}
        onLicenseChanged={() => setLicenseChangeTick(prev => prev + 1)}
      />
    </div>
  );
}
