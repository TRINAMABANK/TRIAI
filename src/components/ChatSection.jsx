import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Volume2, 
  Download, 
  Paperclip, 
  Plus, 
  Mic, 
  MicOff, 
  Send, 
  Globe, 
  Layers, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Check, 
  Upload, 
  UserCheck, 
  FileCheck, 
  Eye, 
  ArrowRight, 
  Terminal, 
  Zap, 
  CornerDownLeft,
  Users,
  X,
  ChevronRight,
  UserRound,
  MessageSquare
} from 'lucide-react';
import { AGENTS_DATA } from '../data/agentsData';
import { exportToWordDocument } from '../utils/documentExporter';
import { api } from '../api/client';

export default function ChatSection({ 
  activeSkill, 
  onOpenSkillPicker, 
  onOpenFileViewer, 
  messages, 
  setMessages, 
  bannerMode = 'chat', 
  onChangeBannerMode, 
  onSelectSkill,
  activeAgent,
  onSelectAgent,
  user = {},
  isAdmin = false,
  ownedSkills = [],
  trialStatus = null,
  onOpenStore,
  onOpenAuthModal
}) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState('Tiếng Việt');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  // States for Companion Agents
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [activeCompanionAgent, setActiveCompanionAgent] = useState(activeAgent || null);
  const agentPickerRef = useRef(null);

  // Sync with prop if activeAgent changes
  useEffect(() => {
    if (activeAgent) {
      setActiveCompanionAgent(activeAgent);
    }
  }, [activeAgent]);

  // Click outside to close Agent popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (agentPickerRef.current && !agentPickerRef.current.contains(e.target)) {
        setShowAgentPicker(false);
      }
    };
    if (showAgentPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAgentPicker]);

  // States for sub-modes
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState('female');
  const [speechRate, setSpeechRate] = useState(0.95);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  // QUAN TRỌNG: Trạng thái đã gọi lệnh hay chưa cho từng chế độ (Khắc phục: "phần này không hiện khi chưa gọi lệnh")
  const [hasCalledChatCommand, setHasCalledChatCommand] = useState(messages.some(m => m.role === 'user'));
  const [hasCalledVoiceCommand, setHasCalledVoiceCommand] = useState(false);
  const [hasCalledFileCommand, setHasCalledFileCommand] = useState(false);
  const [hasCalledSkillCommand, setHasCalledSkillCommand] = useState(false);
  const [hasCalledResultCommand, setHasCalledResultCommand] = useState(false);

  // Trạng thái thu xuống / thu lên Cột 5 (không hiện cố định)
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const textInputRef = useRef(null);

  // Auto scroll to latest message and focus input in chat mode
  useEffect(() => {
    if (bannerMode === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 60);
    }
  }, [messages, isAiTyping, bannerMode]);

  // Gửi tin nhắn / Gọi lệnh
  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : input;
    if (!query.trim()) return;

    // Yêu cầu đăng nhập nếu người dùng chưa đăng nhập
    if (!user?.isLoggedIn) {
      if (onOpenAuthModal) onOpenAuthModal('login');
      return;
    }

    // Đánh dấu đã gọi lệnh cho chế độ tương ứng
    if (bannerMode === 'result') setHasCalledResultCommand(true);
    if (bannerMode === 'file') setHasCalledFileCommand(true);
    if (bannerMode === 'skill') setHasCalledSkillCommand(true);
    if (bannerMode === 'voice') setHasCalledVoiceCommand(true);
    if (bannerMode === 'chat') setHasCalledChatCommand(true);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAiTyping(true);

    try {
      const chatRes = await api.chat.sendMessage({
        agentId: activeCompanionAgent?.id || null,
        skillId: activeSkill?.id || null,
        message: query
      });

      if (chatRes && chatRes.success) {
        const contentText = chatRes.content || '';
        let checklist = activeSkill?.checklist || [];
        let image = null;
        let note = 'Báo cáo chi tiết đã được đồng bộ. Anh có thể xuất tài liệu Word hoặc tương tác tiếp với AI bên dưới.';
        let files = activeSkill?.sampleFiles || [];

        const lowerQuery = query.toLowerCase();
        const isImageRequest = (
          lowerQuery.includes('tạo ảnh') || lowerQuery.includes('lookbook') || lowerQuery.includes('ý ngọc') ||
          lowerQuery.includes('áo dài') || lowerQuery.includes('người mẫu') ||
          activeCompanionAgent?.id === 'tro-ly-kol' || activeSkill?.id === 'kol-thoi-trang'
        );

        if (isImageRequest) {
          image = '/assets/y_ngoc_aodai.jpg';
          note = 'Bộ ảnh Lookbook chuẩn 8K đã kết xuất thành công. Anh có thể bấm vào tệp bên dưới để tải về các định dạng: PDF, PNG và JPEG.';
          files = [
            { name: 'Lookbook_Y_Ngoc_Ao_Dai_Trang.pdf', size: '4.8 MB', type: 'pdf', url: '/assets/y_ngoc_aodai.jpg' },
            { name: 'Lookbook_Y_Ngoc_Master_8K.png', size: '12.4 MB', type: 'png', url: '/assets/y_ngoc_aodai.jpg' },
            { name: 'Lookbook_Y_Ngoc_Editorial.jpeg', size: '6.2 MB', type: 'jpeg', url: '/assets/y_ngoc_aodai.jpg' }
          ];
        }

        const aiMsg = {
          id: Date.now() + 1,
          role: 'ai',
          agentName: chatRes.agent?.name || activeCompanionAgent?.name,
          agentRole: chatRes.agent?.role || activeCompanionAgent?.role,
          agentAvatar: chatRes.agent?.avatar || activeCompanionAgent?.avatar,
          skillId: chatRes.skill?.id || activeSkill?.id || 'pccc',
          skillName: chatRes.skill?.name || activeSkill?.name || 'PCCC',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: contentText,
          checklist: checklist,
          image: image,
          note: note,
          files: files
        };

        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(chatRes?.error || 'Không nhận được kết quả từ máy chủ AI.');
      }
    } catch (err) {
      console.warn('Chat execution note/error:', err);
      if (err.status === 403 || (err.data && err.data.restricted)) {
        const lockedMsg = {
          id: Date.now() + 1,
          role: 'ai',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: `🔒 THÔNG BÁO TỪ HỆ THỐNG TRÍ AI:\n\n${err.message || 'Tài khoản của bạn hiện chưa được Quản trị viên (triqnnamabank@gmail.com) phê duyệt cấp bản quyền Skill này.'}\n\n📌 Hướng dẫn kích hoạt:\n1. Bấm vào "Cửa Hàng Skill" (biểu tượng giỏ hàng) để chọn gói và gửi yêu cầu thanh toán tới Quản trị viên.\n2. Hoặc bấm "Dùng Thử 15 Phút Miễn Phí" để trải nghiệm ngay.\n3. Sau khi bạn chuyển khoản VietQR OCB và Admin xác nhận, Skill sẽ tự động mở khóa vĩnh viễn.`,
          checklist: [
            { label: 'Quyền truy cập: Chưa được Admin phê duyệt bản quyền', status: 'fail' },
            { label: 'Người duyệt cấp quyền: Quản trị viên triqnnamabank@gmail.com', status: 'pass' }
          ],
          files: []
        };
        setMessages(prev => [...prev, lockedMsg]);
      } else {
        const errorMsg = {
          id: Date.now() + 1,
          role: 'ai',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: `⚠️ Thông báo phản hồi AI: ${err.message || 'Hệ thống đang bận, vui lòng thử lại sau.'}`,
          checklist: [],
          files: []
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsAiTyping(false);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 60);
    }
  };

  // Chọn Agent đồng hành từ bảng popup
  const handleSelectCompanionAgent = (agent) => {
    setActiveCompanionAgent(agent);
    setShowAgentPicker(false);
    if (onSelectAgent) onSelectAgent(agent);

    // Kích hoạt tin nhắn trao đổi cùng Agent
    const agentGreetingMsg = {
      id: Date.now(),
      role: 'ai',
      agentName: agent.name,
      agentRole: agent.role,
      agentAvatar: agent.avatar,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: `Dạ anh Trí! Tôi là ${agent.name} (${agent.role}). ${agent.greeting}`,
      checklist: [
        { label: `Chuyên môn cốt lõi: ${agent.specialties.join(' • ')}`, status: 'pass' },
        { label: 'Trạng thái tham mưu: Đã kết nối trực tiếp và sẵn sàng hỗ trợ anh', status: 'pass' }
      ],
      note: `Anh có thể đặt câu hỏi hoặc gửi tệp liên quan đến ${agent.name} để bắt đầu làm việc ngay.`,
      files: []
    };

    setMessages(prev => [...prev, agentGreetingMsg]);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 60);
  };

  // Kích hoạt gọi lệnh kiểm tra kết quả (Kết quả thực tế)
  const handleExecuteResultCommand = (cmdText = 'Kiểm tra hồ sơ nghiệm thu hệ thống PCCC cơ sở 2 theo QCVN 06:2026/BXD.') => {
    setIsAiTyping(true);
    setTimeout(() => {
      setIsAiTyping(false);
      setHasCalledResultCommand(true);
    }, 600);
  };

  // Kích hoạt gọi lệnh phân tích tệp
  const handleExecuteFileCommand = () => {
    setIsAiTyping(true);
    setTimeout(() => {
      setIsAiTyping(false);
      setHasCalledFileCommand(true);
    }, 600);
  };

  // Kích hoạt gọi lệnh Skill
  const handleExecuteSkillCommand = (cmd = '') => {
    setIsAiTyping(true);
    setTimeout(() => {
      setIsAiTyping(false);
      setHasCalledSkillCommand(true);
    }, 600);
  };

  // Tóm tắt bằng giọng nói (Web Speech API)
  const handleVoiceSummary = (customText = null) => {
    if ('speechSynthesis' in window) {
      if (speechActive) {
        window.speechSynthesis.cancel();
        setSpeechActive(false);
        setIsVoicePlaying(false);
        return;
      }
      window.speechSynthesis.cancel();
      const textToRead = customText || 'Dạ anh Trí, kết quả kiểm tra sơ bộ hồ sơ nghiệm thu hệ thống PCCC cho thấy: Thành phần hồ sơ đầy đủ, biểu mẫu đúng theo quy định, nội dung kỹ thuật phù hợp thiết kế được duyệt. Có 2 điểm cần lưu ý về van xả tràn tầng 15 và biên bản thử nghiệm chuông báo cháy tự động.';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'vi-VN';
      utterance.rate = speechRate;
      utterance.onstart = () => {
        setSpeechActive(true);
        setIsVoicePlaying(true);
        setHasCalledVoiceCommand(true);
      };
      utterance.onend = () => {
        setSpeechActive(false);
        setIsVoicePlaying(false);
      };
      utterance.onerror = () => {
        setSpeechActive(false);
        setIsVoicePlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt không hỗ trợ phát giọng nói.');
    }
  };

  // Xuất báo cáo Word (.doc / .docx tải về thực tế chuẩn Times New Roman & Nghị định 30)
  const handleExportWord = () => {
    let title = 'BÁO CÁO KẾT QUẢ KIỂM TRA HỒ SƠ CHUYÊN MÔN';
    let subTitle = `V/v: Đối soát và phê duyệt dữ liệu chuyên ngành ${activeSkill?.name || 'TRÍ AI'}`;
    let department = 'HỆ THỐNG TRÍ TUỆ NHÂN TẠO TRÍ AI';
    let sections = [
      {
        heading: 'I. KẾT QUẢ RÀ SOÁT TỔNG THỂ',
        items: [
          'Thành phần hồ sơ: Đầy đủ theo quy định và tiêu chuẩn chuyên ngành (Đạt 100%).',
          'Biểu mẫu: Đúng theo quy định hành chính và quy chuẩn kỹ thuật hiện hành.',
          'Nội dung kỹ thuật: Phù hợp với thiết kế và mục tiêu công việc được phê duyệt.',
          'Các hạng mục cần lưu ý: Đã đối soát và xác thực tính đồng bộ dữ liệu.'
        ]
      },
      {
        heading: 'II. BẢNG SỐ LIỆU ĐỐI SOÁT CHI TIẾT',
        table: {
          headers: ['STT', 'Hạng mục kiểm tra', 'Tiêu chuẩn đối chiếu', 'Kết quả'],
          rows: [
            ['1', 'Cơ sở dữ liệu đầu vào', 'Đầy đủ, chính xác', 'Đạt 100%'],
            ['2', 'Tính khả thi & Logic', 'Tuân thủ quy chuẩn ngành', 'Đạt chuẩn'],
            ['3', 'Tiến độ thực hiện', 'Tối ưu hóa thời gian thực thi', 'Vượt tiến độ']
          ]
        }
      },
      {
        heading: 'III. ĐỀ XUẤT THỰC HIỆN TIẾP THEO',
        items: [
          'Kính trình Chủ sở hữu hệ thống (Ông QUANG NHỰT TRÍ) phê duyệt hồ sơ chính thức.',
          'Chuyển giao tài liệu cho các bộ phận chuyên môn liên quan để triển khai.'
        ]
      }
    ];

    if (activeSkill?.id?.includes('pccc')) {
      title = 'BÁO CÁO KẾT QUẢ THẨM TRA & RÀ SOÁT HỒ SƠ NGHIỆM THU PCCC';
      subTitle = 'V/v: Đối chiếu hồ sơ thi công nghiệm thu phòng cháy chữa cháy theo QCVN 06:2026/BXD';
      department = 'BAN KỸ THUẬT & AN TOÀN CÔNG TRÌNH';
    } else if (activeSkill?.id?.includes('mua-sam')) {
      title = 'TỜ TRÌNH BÓC TÁCH & SO SÁNH ĐA BÁO GIÁ NHÀ CUNG CẤP';
      subTitle = 'V/v: Lựa chọn nhà cung cấp tối ưu chi phí và chất lượng thiết bị công trình';
      department = 'PHÒNG MUA SẮM & QUẢN LÝ ĐẤU THẦU';
    } else if (activeSkill?.id?.includes('kol') || activeSkill?.id?.includes('thoi-trang')) {
      title = 'TỜ TRÌNH XUẤT BẢN CHIẾN DỊCH VISUAL AI & LOOKBOOK THỜI TRANG';
      subTitle = 'V/v: Phê duyệt bộ ảnh Lookbook 8K và tài liệu chiến dịch Người mẫu Ý Ngọc';
      department = 'STUDIO SÁNG TẠO & VISUAL AI Ý NGỌC';
    }

    exportToWordDocument({
      title,
      subTitle,
      department,
      code: `01/BC-${(activeSkill?.id || 'TRIAI').toUpperCase()}`,
      sections,
      approverName: 'QUANG NHỰT TRÍ',
      approverTitle: 'CHỦ SỞ HỮU & MASTER ADMIN',
      fileName: `Bao_cao_${activeSkill?.id || 'TriAI'}_TimesNewRoman.doc`
    });
  };

  // Kích hoạt Micro
  const handleToggleMic = () => {
    if (!isRecording) {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = selectedLang === 'English' ? 'en-US' : 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onstart = () => {
          setIsRecording(true);
          setHasCalledVoiceCommand(true);
        };
        recognition.onresult = (e) => {
          const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
          setInput(transcript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } else {
        setIsRecording(true);
        setHasCalledVoiceCommand(true);
        setTimeout(() => {
          setInput('Kiểm tra giúp tôi các hạng mục cần lưu ý trong hồ sơ nghiệm thu này.');
          setIsRecording(false);
        }, 2200);
      }
    } else {
      setIsRecording(false);
    }
  };

  // Upload tệp thật
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSend(`Đã đính kèm tệp: ${file.name} (${(file.size / 1024).toFixed(0)} KB). Nhờ Trí AI phân tích giúp.`);
    }
  };

  // Danh mục 3 file hồ sơ thực tế
  const currentFiles = [
    {
      id: 0,
      name: 'Bao_cao_kiem_tra_PCCC.pdf',
      size: '2.4 MB',
      type: 'pdf',
      status: 'Hợp lệ 100%',
      itemsCount: '14 trang',
      findings: [
        'Hồ sơ thẩm duyệt thiết kế PCCC số 284/TD-PCCC: Đạt chuẩn',
        'Biên bản kiểm tra nghiệm thu cơ sở 2: Đầy đủ chữ ký',
        'Chứng chỉ kiểm định phương tiện PCCC: Hợp lệ'
      ]
    },
    {
      id: 1,
      name: 'Danh_sach_diem_luu_y.xlsx',
      size: '324 KB',
      type: 'excel',
      status: '2 điểm cần xử lý',
      itemsCount: '48 dòng',
      findings: [
        'Tầng 15: Van xả tràn DN100 thiếu biên bản thử áp lực 1.5 lần',
        'Phòng máy bơm: Đồng hồ đo áp lực cần hiệu chuẩn định kỳ',
        'Tủ trung tâm: Bổ sung sơ đồ khối liên động hút khói'
      ]
    },
    {
      id: 2,
      name: 'So_do_hoan_cong.pdf',
      size: '1.1 MB',
      type: 'pdf',
      status: 'Cần cập nhật bổ sung',
      itemsCount: '6 bản vẽ',
      findings: [
        'Mặt bằng bố trí chuông đèn báo cháy: Trùng khớp hiện trường',
        'Sơ đồ nguyên lý hút khói hành lang: Cần ký duyệt sửa đổi',
        'Đường ống cấp nước chữa cháy vách tường: Đạt áp suất 4.5 bar'
      ]
    }
  ];

  // XÁC ĐỊNH XEM CÓ HIỂN THỊ HÀNG NÚT HÀNH ĐỘNG (VÙNG 4) HAY KHÔNG
  // "Phần này không hiện khi chưa gọi lệnh": Nếu chưa gọi lệnh thì KHÔNG HIỆN!
  const showActionPills = (
    (bannerMode === 'chat' && hasCalledChatCommand && messages.length > 0) ||
    (bannerMode === 'voice' && hasCalledVoiceCommand) ||
    (bannerMode === 'file' && hasCalledFileCommand) ||
    (bannerMode === 'skill' && hasCalledSkillCommand) ||
    (bannerMode === 'result' && hasCalledResultCommand)
  );

  return (
    <div className="chat-viewport-section">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
      />

      {/* =========================================================================
          CỘT 3: VÙNG NỘI DUNG CHÍNH (THAY ĐỔI THEO 5 TÍNH NĂNG Ở BANNER CỘT 2)
          ========================================================================= */}

      {/* CHẾ ĐỘ 1: Chat văn bản */}
      {bannerMode === 'chat' && (
        <div className="chat-thread-container">
          {messages.length === 0 && (
            <div className="chat-welcome-empty-state">
              {/* NẾU KHÁCH HÀNG CHƯA ĐƯỢC DUYỆT BẢN QUYỀN VÀ KHÔNG CÓ TRIAL */}
              {!isAdmin && (!ownedSkills || ownedSkills.length === 0) && (!trialStatus?.hasTrial || trialStatus?.isExpired) ? (
                <div className="customer-unapproved-warning-box">
                  <div className="warning-lock-icon">🔒</div>
                  <h2 className="warning-title">Tài Khoản Chưa Được Phê Duyệt Bản Quyền</h2>
                  <p className="warning-desc">
                    Hệ sinh thái TRÍ AI thiết lập chế độ phân quyền nghiêm ngặt. Duy nhất Quản trị viên <b>triqnnamabank@gmail.com (QUANG NHỰT TRÍ)</b> là người duyệt và cấp quyền sử dụng các Skill & Agent cho khách hàng.
                  </p>
                  <div className="warning-meta-card">
                    <div className="warning-meta-row">
                      <span>Tài khoản hiện tại:</span>
                      <b>{user?.email || 'Chưa đăng nhập'}</b>
                    </div>
                    <div className="warning-meta-row">
                      <span>Trạng thái:</span>
                      <span className="badge-pending-review">Chờ Quản trị viên phê duyệt</span>
                    </div>
                    <div className="warning-meta-row">
                      <span>Quản trị viên cấp phép:</span>
                      <b>triqnnamabank@gmail.com</b>
                    </div>
                  </div>

                  <div className="warning-action-buttons">
                    <button 
                      type="button" 
                      className="btn-warning-store"
                      onClick={onOpenStore}
                    >
                      🛒 Mở Cửa Hàng Chọn Gói & Gửi Yêu Cầu Duyệt
                    </button>
                    <button 
                      type="button" 
                      className="btn-warning-auth"
                      onClick={onOpenAuthModal}
                    >
                      🔑 Đổi Tài Khoản / Đăng Nhập Admin
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="welcome-brain-glow">
                    <img 
                      src="/assets/brand_logo.png" 
                      alt="Trí AI" 
                      className="welcome-brand-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span>🧠</span>';
                      }} 
                    />
                  </div>
                  {/* Tiêu đề và mô tả tùy biến theo Skill đã mua / kích hoạt */}
                  <h2 className="welcome-title">
                    {activeSkill?.id === 'kol-thoi-trang' ? 'Studio Sáng Tạo KOL Thời Trang Ý Ngọc' :
                     activeSkill?.id === 'pccc' ? 'Chuyên Gia Nghiệm Thu & Thẩm Duyệt PCCC' :
                     activeSkill?.id === 'mua-sam' ? 'Chuyên Viên Bóc Tách & Đa Báo Giá' :
                     activeSkill?.id === 'mep' ? 'Chuyên Gia Vận Hành Kỹ Thuật MEP' :
                     activeSkill?.name ? `Trí AI — Chuyên Môn ${activeSkill.name}` : 'Trí AI Đã Sẵn Sàng'}
                  </h2>
                  <p className="welcome-desc">
                    {activeSkill?.id === 'kol-thoi-trang' ? 'Không gian sản xuất bộ ảnh chiến dịch thời trang chuẩn 8K, khóa nhận diện gương mặt người mẫu Ý Ngọc và xuất bản tài liệu Lookbook.' :
                     activeSkill?.id === 'pccc' ? 'Hệ thống đối soát 100% hồ sơ nghiệm thu, bản vẽ hoàn công và quy chuẩn QCVN 06:2026/BXD.' :
                     activeSkill?.id === 'mua-sam' ? 'Hệ thống so sánh 3-5 báo giá nhà cung cấp, tối ưu đơn giá 10-15% và lập tờ trình mua sắm ISO.' :
                     activeSkill?.id === 'mep' ? 'Hệ thống quản trị kỹ thuật cơ điện, vận hành HVAC, máy phát điện và ứng phó sự cố tòa nhà.' :
                     activeSkill?.desc ? activeSkill.desc : 'Hãy chọn một thao tác nhanh bên dưới để bắt đầu làm việc ngay:'}
                  </p>
                </>
              )}

              <div className="welcome-suggestions-grid">
                {activeSkill?.id === 'kol-thoi-trang' ? (
                  <>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Ý Ngọc + Áo dài trắng + Khách sạn cao cấp + Fashion Campaign + Commercial Photography + Giữ nhận diện nhân vật')}
                    >
                      <div className="sug-icon-box pink">✨</div>
                      <div className="sug-text-wrap">
                        <b>Lookbook Áo Dài Trắng</b>
                        <span>Ảnh thương mại 8K khách sạn 5 sao</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Ý Ngọc + Haute Couture Dạ Hội + Sân Khấu Thời Trang + Ánh sáng Studio chuẩn quốc tế')}
                    >
                      <div className="sug-icon-box orange">👗</div>
                      <div className="sug-text-wrap">
                        <b>BST Dạ Hội Haute Couture</b>
                        <span>Thiết kế thời trang dạ tiệc sang trọng</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Xuất bản bảng thông số Prompt Sheet và Style Guide Lookbook chi tiết')}
                    >
                      <div className="sug-icon-box blue">📄</div>
                      <div className="sug-text-wrap">
                        <b>Xuất Prompt Sheet & Style Guide</b>
                        <span>Tài liệu kỹ thuật định dạng PDF & PNG</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Kiểm tra độ tương đồng và khóa nhận diện gương mặt người mẫu Ý Ngọc 100%')}
                    >
                      <div className="sug-icon-box red">🎯</div>
                      <div className="sug-text-wrap">
                        <b>Khóa nhận diện gương mặt</b>
                        <span>Đảm bảo 100% nhất quán nhận diện</span>
                      </div>
                    </div>
                  </>
                ) : activeSkill?.id === 'pccc' ? (
                  <>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Anh kiểm tra giúp tôi hồ sơ nghiệm thu hệ thống PCCC này được không?')}
                    >
                      <div className="sug-icon-box red">🔥</div>
                      <div className="sug-text-wrap">
                        <b>Kiểm tra hồ sơ PCCC</b>
                        <span>Rà soát nghiệm thu theo QCVN 06:2026/BXD</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Kiểm tra biên bản thử áp lực đường ống chữa cháy và van xả tràn tầng 15.')}
                    >
                      <div className="sug-icon-box orange">📋</div>
                      <div className="sug-text-wrap">
                        <b>Biên bản thử áp lực</b>
                        <span>Kiểm tra áp suất van xả tràn & đường ống</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Rà soát bản vẽ hoàn công và đối chiếu sơ đồ vị trí đầu phun Sprinkler.')}
                    >
                      <div className="sug-icon-box blue">📐</div>
                      <div className="sug-text-wrap">
                        <b>Bản vẽ hoàn công</b>
                        <span>Khoanh vùng điểm lưu ý sơ đồ Sprinkler</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Xuất báo cáo kết quả kiểm tra định dạng Word (.doc) và PDF để trình duyệt.')}
                    >
                      <div className="sug-icon-box pink">📑</div>
                      <div className="sug-text-wrap">
                        <b>Xuất báo cáo kỹ thuật</b>
                        <span>Tải tệp Word (.docx) & PDF chuẩn ISO</span>
                      </div>
                    </div>
                  </>
                ) : activeSkill?.id === 'mua-sam' ? (
                  <>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('So sánh giúp tôi 3 bảng báo giá thiết bị điều hòa VRV trung tâm.')}
                    >
                      <div className="sug-icon-box orange">🛒</div>
                      <div className="sug-text-wrap">
                        <b>Bóc tách 3 báo giá</b>
                        <span>So sánh đơn giá & thông số kỹ thuật</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Phân tích chênh lệch đơn giá và đề xuất phương án đàm phán giảm 10-15%.')}
                    >
                      <div className="sug-icon-box blue">💰</div>
                      <div className="sug-text-wrap">
                        <b>Tối ưu chi phí đàm phán</b>
                        <span>Đề xuất tiết kiệm 10-15% ngân sách</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Lập tờ trình phê duyệt lựa chọn nhà cung cấp chuẩn quy trình ISO.')}
                    >
                      <div className="sug-icon-box red">📝</div>
                      <div className="sug-text-wrap">
                        <b>Tờ trình mua sắm ISO</b>
                        <span>Soạn thảo văn bản trình ban giám đốc</span>
                      </div>
                    </div>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => handleSend('Xuất bảng so sánh tổng hợp chi phí định dạng Excel (.xlsx).')}
                    >
                      <div className="sug-icon-box pink">📊</div>
                      <div className="sug-text-wrap">
                        <b>Xuất bảng tính Excel</b>
                        <span>Báo cáo tài chính & biểu đồ so sánh</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => {
                        if (onSelectSkill) {
                          onSelectSkill({
                            id: 'pccc',
                            name: 'Nghiệm thu PCCC Tòa nhà',
                            category: 'Kỹ thuật',
                            status: 'Đã kích hoạt'
                          });
                        }
                        handleSend('Anh kiểm tra giúp tôi hồ sơ nghiệm thu hệ thống PCCC này được không?');
                      }}
                    >
                      <div className="sug-icon-box red">🔥</div>
                      <div className="sug-text-wrap">
                        <b>Kiểm tra hồ sơ PCCC</b>
                        <span>Rà soát nghiệm thu theo QCVN 06:2026/BXD</span>
                      </div>
                    </div>

                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => {
                        if (onSelectSkill) {
                          onSelectSkill({
                            id: 'mua-sam',
                            name: 'Bóc tách & So sánh Đa báo giá',
                            category: 'Mua sắm',
                            status: 'Đã kích hoạt'
                          });
                        }
                        handleSend('So sánh giúp tôi 3 bảng báo giá thiết bị điều hòa VRV trung tâm.');
                      }}
                    >
                      <div className="sug-icon-box orange">🛒</div>
                      <div className="sug-text-wrap">
                        <b>Bóc tách báo giá</b>
                        <span>So sánh đa nhà cung cấp và tối ưu chi phí</span>
                      </div>
                    </div>

                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => {
                        if (onSelectSkill) {
                          onSelectSkill({
                            id: 'kol-thoi-trang',
                            name: 'KOL Thời Trang Siêu Thực (Ý Ngọc)',
                            category: 'KOL AI',
                            status: 'Đã kích hoạt'
                          });
                        }
                        handleSend('Ý Ngọc + Áo dài trắng + Khách sạn cao cấp + Fashion Campaign + Commercial Photography + Giữ nhận diện nhân vật');
                      }}
                    >
                      <div className="sug-icon-box pink">✨</div>
                      <div className="sug-text-wrap">
                        <b>Lookbook KOL Thời Trang</b>
                        <span>Sản xuất ảnh thời trang chuẩn 8K</span>
                      </div>
                    </div>

                    <div 
                      className="welcome-suggestion-card"
                      onClick={() => {
                        if (onSelectSkill) {
                          onSelectSkill({
                            id: 'mep',
                            name: 'Vận hành Kỹ thuật MEP & Cơ điện',
                            category: 'Kỹ thuật',
                            status: 'Đã kích hoạt'
                          });
                        }
                        handleSend('Kiểm toán vận hành hệ thống cơ điện MEP và máy phát điện dự phòng.');
                      }}
                    >
                      <div className="sug-icon-box blue">⚙️</div>
                      <div className="sug-text-wrap">
                        <b>Vận hành kỹ thuật MEP</b>
                        <span>Quy trình bảo trì và ứng phó sự cố tòa nhà</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`message-thread-item ${isUser ? 'user-item' : 'ai-item'}`}>
                {/* Avatar */}
                <div className="thread-avatar-col">
                  {isUser ? (
                    <div className="user-initials-badge">QT</div>
                  ) : (
                    <div className="ai-neon-badge">
                      <img 
                        src={m.agentAvatar || "/assets/brand_logo.png"} 
                        alt={m.agentName || "Trí AI"} 
                        className="ai-avatar-pic"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span>🧠</span>';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Bubble Content */}
                <div className="thread-bubble-col">
                  {!isUser && (
                    <div className="ai-title-row">
                      <span className="ai-brand-label">{m.agentName ? m.agentName.toUpperCase() : 'TRÍ AI'}</span>
                      {m.agentRole && <span className="ai-agent-role-pill">{m.agentRole}</span>}
                      <span className="ai-timestamp">{m.time || '10:24'}</span>
                    </div>
                  )}

                  <div className={`thread-card-bubble ${isUser ? 'user-card-bubble' : 'ai-card-bubble'}`}>
                    <div className="message-main-text">{m.text}</div>

                    {/* Checklist Box (Khớp 100% bản mẫu) */}
                    {m.checklist && m.checklist.length > 0 && (
                      <div className="white-checklist-card">
                        {m.checklist.map((item, idx) => (
                          <div key={idx} className="checklist-bullet-row">
                            <CheckCircle2 size={18} className="check-emerald-icon" />
                            <span className="check-bullet-text">{item.label}</span>
                          </div>
                        ))}

                        {m.note && (
                          <div className="checklist-footer-note">
                            {m.note}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lookbook 8K Image (Nếu kích hoạt KOL Thời Trang Ý Ngọc) */}
                    {m.image && (
                      <div className="kol-lookbook-showcase">
                        <div className="lookbook-badge-tag">
                          <Sparkles size={14} /> Lookbook KOL Ý Ngọc • Áo Dài Di Sản 8K
                        </div>
                        <div className="lookbook-img-frame">
                          <img 
                            src={m.image} 
                            alt="Ý Ngọc Áo Dài Trắng" 
                            className="lookbook-img-preview"
                          />
                        </div>
                        <div className="lookbook-caption-row">
                          <span>Nhận diện: <b>100% Nhất quán</b></span>
                          <span>Bối cảnh: <b>Khách sạn 5 sao Luxury</b></span>
                          <span>Độ phân giải: <b>8K UHD</b></span>
                        </div>
                      </div>
                    )}

                    {/* Attached Files (Khớp 100% định dạng xuất bản theo từng Skill) */}
                    {m.files && m.files.length > 0 && (
                      <div className="attached-files-row">
                        {m.files.map((file, fIdx) => {
                          const isImage = file.type === 'png' || file.type === 'jpeg' || file.type === 'jpg' || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg');
                          const isExcel = file.type === 'excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
                          const isWord = file.type === 'word' || file.name.endsWith('.docx') || file.name.endsWith('.doc');
                          const isPdf = file.type === 'pdf' || file.name.endsWith('.pdf');

                          let badgeClass = 'pdf-tag';
                          let icon = <FileText size={16} />;
                          if (isImage) {
                            badgeClass = 'image-tag';
                            icon = <Sparkles size={16} />;
                          } else if (isExcel) {
                            badgeClass = 'excel-tag';
                            icon = <FileSpreadsheet size={16} />;
                          } else if (isWord) {
                            badgeClass = 'word-tag';
                            icon = <FileText size={16} />;
                          }

                          return (
                            <div 
                              key={fIdx} 
                              className={`file-card-pill ${badgeClass}-pill`} 
                              onClick={() => onOpenFileViewer(file)}
                              title={`Bấm để xem và tải file ${file.name}`}
                            >
                              <div className={`file-badge-icon ${badgeClass}`}>
                                {icon}
                              </div>
                              <div className="file-pill-info">
                                <div className="file-pill-name">{file.name}</div>
                                <div className="file-pill-size">{file.size}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isAiTyping && (
            <div className="message-thread-item ai-item">
              <div className="thread-avatar-col">
                <div className="ai-neon-badge">
                  <span>🧠</span>
                </div>
              </div>
              <div className="thread-bubble-col">
                <div className="thread-card-bubble ai-card-bubble typing-box">
                  <span className="dot-wave"></span>
                  <span className="dot-wave"></span>
                  <span className="dot-wave"></span>
                  <span className="typing-notice">Trí AI đang phân tích hồ sơ chuyên ngành...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>
      )}

      {/* CHẾ ĐỘ 2: Nói giọng nói */}
      {bannerMode === 'voice' && (
        <div className="voice-mode-workspace">
          <div className="voice-assistant-central-card">
            <div className={`voice-aura-circle ${isVoicePlaying || isRecording ? 'is-pulsing' : ''}`}>
              <div className="voice-center-brain">🧠</div>
            </div>

            <h3 className="voice-central-title">
              {isRecording 
                ? 'Đang lắng nghe giọng của bạn...' 
                : isVoicePlaying 
                ? 'Trí AI đang đọc tóm tắt...' 
                : 'Trợ Lý Giọng Nói Trí AI (Nói tiếng Việt tự nhiên)'}
            </h3>
            
            <p className="voice-central-desc">
              "Anh cứ nói, Trí AI sẽ lo phần còn lại." — Bấm micro hoặc nói trực tiếp để phân tích và thực thi quy trình chuyên môn.
            </p>

            <div className="voice-actions-quick-bar">
              <button 
                className="btn-voice-round-toggle"
                onClick={() => handleVoiceSummary()}
              >
                {isVoicePlaying ? <Pause size={20} /> : <Play size={20} />}
                <span>{isVoicePlaying ? 'Tạm dừng đọc' : 'Phát tóm tắt giọng nói Trí AI'}</span>
              </button>
            </div>
          </div>

          {/* Live Voice Dialog Transcript */}
          <div className="voice-transcript-card">
            <div className="transcript-head">
              <b>Nhật ký hội thoại âm thanh trực tiếp:</b>
              <span className="lang-tag">Tiếng Việt (Chuẩn 100%)</span>
            </div>
            <div className="transcript-stream">
              <div className="transcript-line user-line">
                <span className="speaker-tag">Anh Trí:</span>
                <p>"Anh kiểm tra giúp tôi hồ sơ nghiệm thu hệ thống PCCC này được không?"</p>
              </div>
              <div className="transcript-line ai-line">
                <span className="speaker-tag">Trí AI (Giọng nói):</span>
                <p>"Dạ anh Trí, em đã kiểm tra sơ bộ hồ sơ nghiệm thu: Thành phần hồ sơ đầy đủ, biểu mẫu đúng quy định, nội dung kỹ thuật phù hợp thiết kế. Có 2 điểm cần lưu ý về van xả tràn tầng 15 và sơ đồ hoàn công."</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 3: Phân tích file */}
      {bannerMode === 'file' && (
        <div className="file-mode-workspace">
          {/* File Tab Selector */}
          <div className="file-tabs-bar">
            {currentFiles.map((f, i) => (
              <button 
                key={f.id} 
                className={`file-tab-btn ${activeFileIndex === i ? 'active' : ''}`}
                onClick={() => {
                  setActiveFileIndex(i);
                }}
              >
                {f.type === 'excel' ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                <span>{f.name}</span>
                <span className="file-tab-size">{f.size}</span>
              </button>
            ))}
          </div>

          {/* Trạng thái CHƯA GỌI LỆNH ở chế độ File */}
          {!hasCalledFileCommand ? (
            <div className="command-idle-card">
              <div className="idle-icon-wrap">
                <FileCheck size={28} />
              </div>
              <div className="idle-badge">Chờ gọi lệnh phân tích</div>
              <h3 className="idle-title">Tệp "{currentFiles[activeFileIndex].name}" Đã Sẵn Sàng</h3>
              <p className="idle-desc">
                Các nút bóc tách bảng tính, đối chiếu quy chuẩn và tải báo cáo Word sẽ xuất hiện ngay sau khi anh gọi lệnh phân tích tệp này.
              </p>
              <button className="btn-call-command" onClick={handleExecuteFileCommand}>
                <Zap size={16} /> Gọi lệnh bóc tách & phân tích tệp ngay
              </button>
            </div>
          ) : (
            /* File Analysis Card khi ĐÃ GỌI LỆNH */
            <div className="file-analysis-card">
              <div className="analysis-card-head">
                <div>
                  <span className="badge-analysis-pill">
                    {currentFiles[activeFileIndex].type === 'excel' ? 'Bảng tính kỹ thuật' : 'Hồ sơ pháp lý & bản vẽ'}
                  </span>
                  <h3 className="analysis-file-title">{currentFiles[activeFileIndex].name}</h3>
                  <div className="analysis-meta-txt">
                    Quy mô: <b>{currentFiles[activeFileIndex].itemsCount}</b> • Trạng thái: <b style={{ color: '#16a34a' }}>{currentFiles[activeFileIndex].status}</b>
                  </div>
                </div>
                <button 
                  className="btn-view-doc"
                  onClick={() => onOpenFileViewer(currentFiles[activeFileIndex])}
                >
                  <Eye size={15} /> Xem chi tiết
                </button>
              </div>

              <div className="analysis-findings-list">
                <div className="findings-title">Kết quả bóc tách & phát hiện từ Trí AI:</div>
                {currentFiles[activeFileIndex].findings.map((item, idx) => (
                  <div key={idx} className="finding-row-item">
                    <CheckCircle2 size={16} className="find-check-icon" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="analysis-actions-row">
                <button className="btn-file-sub" onClick={handleExportWord}>
                  <Download size={14} /> Xuất báo cáo bóc tách (.doc)
                </button>
                <button className="btn-file-sub" onClick={() => handleSend(`So sánh chi tiết tệp [${currentFiles[activeFileIndex].name}] với tiêu chuẩn QCVN 06:2026.`)}>
                  <ShieldCheck size={14} /> Đối chiếu tiêu chuẩn QCVN
                </button>
                <button className="btn-file-sub reset-btn" onClick={() => setHasCalledFileCommand(false)}>
                  <RotateCcw size={14} /> Đặt lại lệnh
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHẾ ĐỘ 4: Sử dụng Skill */}
      {bannerMode === 'skill' && (
        <div className="skill-mode-workspace">
          {/* Active Skill Overview Card */}
          <div className="skill-studio-card">
            <div className="studio-card-head">
              <div className={`studio-icon-wrap ${activeSkill.color || 'red'}`}>
                <Sparkles size={24} />
              </div>
              <div>
                <div className="studio-cat">{activeSkill.category || 'Nghiệp vụ chuyên sâu'}</div>
                <h3 className="studio-name">{activeSkill.name || 'PCCC'}</h3>
                <div className="studio-role">Vai trò: <b>{activeSkill.systemRole || 'Chuyên gia Thẩm duyệt & Nghiệm thu'}</b></div>
              </div>
              <button className="btn-change-skill" onClick={onOpenSkillPicker}>
                <Layers size={15} /> Đổi Skill khác
              </button>
            </div>

            <div className="studio-prompt-box">
              <div className="prompt-box-title">Chọn một quy trình bên dưới để Gọi lệnh thực thi:</div>
              <div className="preset-prompts-grid">
                <button 
                  className="preset-prompt-btn"
                  onClick={() => {
                    handleExecuteSkillCommand();
                    handleSend(activeSkill.samplePrompt || 'Kiểm tra hồ sơ nghiệm thu này giúp tôi.');
                  }}
                >
                  <Play size={14} className="text-blue" />
                  <span>"{activeSkill.samplePrompt || 'Kiểm tra hồ sơ nghiệm thu'}"</span>
                </button>
                <button 
                  className="preset-prompt-btn"
                  onClick={() => {
                    handleExecuteSkillCommand();
                    handleSend(`Rà soát 100% điều khoản theo quy chuẩn áp dụng cho Skill ${activeSkill.name}.`);
                  }}
                >
                  <ShieldCheck size={14} className="text-green" />
                  <span>"Rà soát đối chiếu tiêu chuẩn pháp lý mới nhất"</span>
                </button>
                <button 
                  className="preset-prompt-btn"
                  onClick={() => {
                    handleExecuteSkillCommand();
                    handleSend(`Lập tờ trình và biên bản thẩm duyệt chính thức cho hồ sơ ${activeSkill.name}.`);
                  }}
                >
                  <FileText size={14} className="text-purple" />
                  <span>"Lập tờ trình và biên bản thẩm tra bàn giao"</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 5: Kết quả thực tế (QUAN TRỌNG: Ẩn phần nút hành động khi chưa gọi lệnh) */}
      {bannerMode === 'result' && (
        <div className="result-mode-workspace">
          {/* TRẠNG THÁI 1: KHI CHƯA GỌI LỆNH -> KHÔNG HIỆN KẾT QUẢ VÀ KHÔNG HIỆN 4 NÚT HÀNH ĐỘNG */}
          {!hasCalledResultCommand ? (
            <div className="command-idle-card">
              <div className="idle-icon-wrap">
                <Terminal size={30} />
              </div>
              <div className="idle-badge">Chưa gọi lệnh kiểm tra</div>
              <h3 className="idle-title">Hồ Sơ Nghiệm Thu PCCC Đang Ở Trạng Thái Chờ</h3>
              <p className="idle-desc">
                Các nút thao tác <b>"Đọc tóm tắt kết quả"</b>, <b>"Tải báo cáo Word"</b>, <b>"Tạo tờ trình"</b> và <b>"Phê duyệt kết quả"</b> sẽ tự động xuất hiện ngay sau khi anh kích hoạt lệnh thẩm duyệt.
              </p>
              
              <button 
                className="btn-call-command"
                onClick={() => handleExecuteResultCommand()}
              >
                <Zap size={16} /> Gọi lệnh kiểm tra & xuất kết quả ngay
              </button>

              <div className="idle-suggestions-box">
                <div className="suggestions-title">Hoặc chọn một câu lệnh cụ thể:</div>
                <div className="suggestions-list">
                  <button onClick={() => handleExecuteResultCommand('Đối chiếu 28 tiêu chí theo tiêu chuẩn QCVN 06:2026/BXD')}>
                    <ArrowRight size={13} /> 1. Đối chiếu 28 tiêu chí an toàn theo QCVN 06:2026/BXD
                  </button>
                  <button onClick={() => handleExecuteResultCommand('Rà soát van xả tràn tầng 15 và tủ trung tâm')}>
                    <ArrowRight size={13} /> 2. Rà soát van xả tràn tầng 15 và tủ báo cháy trung tâm
                  </button>
                  <button onClick={() => handleExecuteResultCommand('Kiểm tra hồ sơ hoàn công và biên bản thử nghiệm')}>
                    <ArrowRight size={13} /> 3. Kiểm tra hồ sơ hoàn công và biên bản thử nghiệm áp lực
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TRẠNG THÁI 2: KHI ĐÃ GỌI LỆNH -> XUẤT HIỆN BẢNG KẾT QUẢ ĐẦY ĐỦ */
            <div className="result-official-card">
              <div className="result-card-head">
                <div>
                  <span className="result-badge-tag">Biên bản nghiệm thu chuyên môn</span>
                  <h3 className="result-title">Kết Quả Phân Tích & Nghiệm Thu Chính Thức</h3>
                  <p className="result-subtitle">Cơ sở: Diamond Plaza (Cơ sở 2) • Tiêu chuẩn: QCVN 06:2026/BXD</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="result-status-stamp">ĐẠT 94% CHUẨN</span>
                  <button 
                    className="btn-reset-command"
                    onClick={() => setHasCalledResultCommand(false)}
                    title="Đặt lại trạng thái chưa gọi lệnh"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              <div className="result-checklist-body">
                <div className="result-check-line pass">
                  <CheckCircle2 size={18} className="res-icon" />
                  <div>
                    <b>Thành phần hồ sơ: Đầy đủ 100%</b>
                    <p>Biên bản nghiệm thu, bản vẽ hoàn công, chứng chỉ kiểm định thiết bị.</p>
                  </div>
                </div>
                <div className="result-check-line pass">
                  <CheckCircle2 size={18} className="res-icon" />
                  <div>
                    <b>Biểu mẫu: Đúng theo quy định hiện hành</b>
                    <p>Phù hợp Nghị định 136/2020/NĐ-CP và Thông tư 149/2020/TT-BCA.</p>
                  </div>
                </div>
                <div className="result-check-line pass">
                  <CheckCircle2 size={18} className="res-icon" />
                  <div>
                    <b>Nội dung kỹ thuật: Phù hợp thiết kế được phê duyệt</b>
                    <p>Đường ống, tủ điều khiển, hệ thống báo cháy tự động hoạt động đồng bộ.</p>
                  </div>
                </div>
                <div className="result-check-line warning">
                  <AlertTriangle size={18} className="res-icon warn" />
                  <div>
                    <b>Hạng mục cần lưu ý: 2 điểm kỹ thuật đã khoanh vùng</b>
                    <p>Van xả tràn tầng 15 và sơ đồ khối tủ trung tâm báo cháy tự động.</p>
                  </div>
                </div>
                <div className="result-check-line pass">
                  <CheckCircle2 size={18} className="res-icon" />
                  <div>
                    <b>Đề xuất: Bổ sung biên bản thử nghiệm và cập nhật sơ đồ hoàn công</b>
                    <p>Thời hạn hoàn thiện: Trước khi bàn giao nghiệm thu chính thức.</p>
                  </div>
                </div>
              </div>

              {/* 3 Result Files */}
              <div className="result-files-download-row">
                <div className="result-file-item" onClick={() => onOpenFileViewer(currentFiles[0])}>
                  <FileText size={16} className="text-red" />
                  <span>Bao_cao_kiem_tra_PCCC.pdf</span>
                </div>
                <div className="result-file-item" onClick={() => onOpenFileViewer(currentFiles[1])}>
                  <FileSpreadsheet size={16} className="text-green" />
                  <span>Danh_sach_diem_luu_y.xlsx</span>
                </div>
                <div className="result-file-item" onClick={() => onOpenFileViewer(currentFiles[2])}>
                  <FileText size={16} className="text-blue" />
                  <span>So_do_hoan_cong.pdf</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CỘT 4: HÀNG 4 NÚT HÀNH ĐỘNG NHANH (ACTION PILLS)
          CHỈ HIỂN THỊ KHI ĐÃ GỌI LỆNH (showActionPills === true)
          ========================================================================= */}
      {showActionPills && (
        <div className="action-pills-row animated-fade-in">
          {/* Pills cho Chat văn bản */}
          {bannerMode === 'chat' && (
            <>
              {(activeSkill?.id === 'kol-thoi-trang' || activeSkill?.id?.includes('kol') || activeSkill?.id?.includes('thoi-trang')) ? (
                <>
                  <button 
                    className="pill-action-btn"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = '/assets/y_ngoc_aodai.jpg';
                      a.download = 'Lookbook_Y_Ngoc_Master_8K.png';
                      a.target = '_blank';
                      a.click();
                    }}
                    title="Tải về ảnh PNG chất lượng gốc 8K"
                  >
                    <Sparkles size={16} color="#ec4899" />
                    <span>Tải ảnh PNG 8K</span>
                  </button>

                  <button 
                    className="pill-action-btn"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = '/assets/y_ngoc_aodai.jpg';
                      a.download = 'Lookbook_Y_Ngoc_Editorial.jpeg';
                      a.target = '_blank';
                      a.click();
                    }}
                    title="Tải về ảnh JPEG tối ưu đa nền tảng"
                  >
                    <Eye size={16} color="#38bdf8" />
                    <span>Tải ảnh JPEG</span>
                  </button>

                  <button 
                    className="pill-action-btn"
                    onClick={() => onOpenFileViewer({ name: 'Lookbook_Y_Ngoc_Ao_Dai_Trang.pdf', size: '4.8 MB', type: 'pdf' })}
                    title="Xuất trọn bộ Catalog Lookbook PDF"
                  >
                    <FileText size={16} className="text-red" />
                    <span>Xuất Catalog PDF</span>
                  </button>

                  <button 
                    className={`pill-action-btn voice-summary-pill ${speechActive ? 'speaking-active' : ''}`}
                    onClick={() => handleVoiceSummary('Dạ anh Trí, bộ ảnh Lookbook KOL Thời Trang Ý Ngọc với tà áo dài truyền thống đã hoàn thành kết xuất độ phân giải 8K, khóa nhận diện nhân vật 100%.')}
                    title="Nghe tóm tắt bộ ảnh bằng giọng nói"
                  >
                    <Volume2 size={16} />
                    <span>{speechActive ? 'Đang đọc...' : 'Tóm tắt bộ ảnh'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={`pill-action-btn voice-summary-pill ${speechActive ? 'speaking-active' : ''}`}
                    onClick={() => handleVoiceSummary()}
                    title="Nghe tóm tắt bằng giọng nói"
                  >
                    <Volume2 size={16} />
                    <span>{speechActive ? 'Đang đọc...' : 'Tóm tắt bằng giọng nói'}</span>
                  </button>

                  <button 
                    className="pill-action-btn"
                    onClick={handleExportWord}
                    title="Tải về file báo cáo Word (.docx)"
                  >
                    <span className="word-blue-tag">W</span>
                    <span>Xuất file Word (.docx)</span>
                  </button>

                  <button 
                    className="pill-action-btn"
                    onClick={() => onOpenFileViewer({ 
                      name: activeSkill?.id === 'pccc' ? 'Danh_sach_diem_luu_y.xlsx' : activeSkill?.id === 'mua-sam' ? 'Bang_so_sanh_3_bao_gia.xlsx' : 'Bang_tong_hop_so_lieu.xlsx', 
                      size: '450 KB', 
                      type: 'excel' 
                    })}
                    title="Bóc tách và tải bảng tính Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={16} className="text-green" />
                    <span>Xuất file Excel (.xlsx)</span>
                  </button>

                  <button 
                    className="pill-action-btn"
                    onClick={() => onOpenFileViewer({ 
                      name: activeSkill?.id === 'pccc' ? 'Bao_cao_kiem_tra_PCCC.pdf' : activeSkill?.id === 'mua-sam' ? 'Bao_cao_danh_gia_NCC.pdf' : 'Ho_so_xuat_ban.pdf', 
                      size: '2.4 MB', 
                      type: 'pdf' 
                    })}
                    title="Xuất tài liệu báo cáo PDF (.pdf)"
                  >
                    <FileText size={16} className="text-red" />
                    <span>Xuất file PDF (.pdf)</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* Pills cho Nói giọng nói: Tập trung hành động kết quả, không dư thừa nút phát âm thanh */}
          {bannerMode === 'voice' && (
            <>
              <button 
                className="pill-action-btn"
                onClick={handleExportWord}
                title="Tải file Word biên bản ghi âm cuộc trò chuyện"
              >
                <Download size={16} />
                <span>Xuất biên bản ghi âm (.doc)</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => handleSend(`Khởi tạo checklist các đầu việc đã trao đổi qua giọng nói.`)}
                title="Tự động trích xuất checklist từ giọng nói"
              >
                <CheckCircle2 size={16} />
                <span>Lập checklist từ giọng nói</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => handleSend(`Tóm tắt các kết luận quan trọng nhất vừa thống nhất.`)}
                title="Tóm tắt ngắn gọn các nội dung đã nói"
              >
                <FileText size={16} />
                <span>Tóm tắt kết luận</span>
              </button>
            </>
          )}

          {/* Pills cho Phân tích file */}
          {bannerMode === 'file' && (
            <>
              <button 
                className="pill-action-btn"
                onClick={handleExportWord}
              >
                <span className="word-blue-tag">W</span>
                <span>Xuất báo cáo thẩm tra Word</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => handleSend(`Đối chiếu các phát hiện với tiêu chuẩn QCVN 06:2026/BXD mới nhất.`)}
              >
                <ShieldCheck size={16} />
                <span>Đối chiếu QCVN 06:2026</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => onOpenFileViewer(currentFiles[1])}
              >
                <FileSpreadsheet size={16} />
                <span>Bóc tách bảng tính Excel</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => {
                  alert(`Bắt đầu tải tệp gốc: ${currentFiles[activeFileIndex].name}`);
                }}
              >
                <Download size={16} />
                <span>Tải tệp đính kèm gốc</span>
              </button>
            </>
          )}

          {/* Pills cho Sử dụng Skill */}
          {bannerMode === 'skill' && (
            <>
              <button 
                className="pill-action-btn voice-summary-pill"
                onClick={() => handleSend(activeSkill.samplePrompt || 'Thực thi quy trình tự động của Skill')}
              >
                <Play size={16} />
                <span>Chạy quy trình tự động</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeSkill, null, 2));
                  const a = document.createElement('a');
                  a.href = dataStr;
                  a.download = `Skill_${activeSkill.id || 'export'}.json`;
                  a.click();
                }}
              >
                <Download size={16} />
                <span>Xuất gói Skill (.json)</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                <span>Nạp thêm kiến thức Skill</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={onOpenSkillPicker}
              >
                <Layers size={16} />
                <span>Đổi Skill chuyên ngành</span>
              </button>
            </>
          )}

          {/* Pills cho Kết quả thực tế (ĐÚNG PHẦN ANH TRÍ ĐÃ CHỤP ẢNH) */}
          {bannerMode === 'result' && (
            <>
              <button 
                className="pill-action-btn voice-summary-pill"
                onClick={() => handleVoiceSummary('Dạ anh Trí, đây là kết quả phân tích và thẩm duyệt chính thức: Hồ sơ nghiệm thu đạt 94% chuẩn, thành phần hồ sơ đầy đủ, biểu mẫu đúng quy định, có 2 điểm cần lưu ý về van xả tràn và sơ đồ hoàn công.')}
              >
                <Volume2 size={16} />
                <span>Đọc tóm tắt kết quả</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={handleExportWord}
              >
                <span className="word-blue-tag">W</span>
                <span>Tải toàn bộ báo cáo Word (.doc)</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => handleSend(`Khởi tạo tờ trình nghiệm thu PCCC chính thức kèm chữ ký điện tử.`)}
              >
                <FileText size={16} />
                <span>Tạo tờ trình nghiệm thu</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => {
                  alert('Hồ sơ đã được phê duyệt đạt yêu cầu kỹ thuật!');
                }}
              >
                <CheckCircle2 size={16} />
                <span>Phê duyệt kết quả</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          CỘT 5: DOCK MICRO & THANH NHẬP LIỆU (COMPOSER DOCK Ở ĐÁY CỘT 2)
          "Mục Cột 5 CHỈ XUẤT HIỆN KHI BẤM CHỌN 'NÓI GIỌNG NÓI'"
          ========================================================================= */}
      {/* =========================================================================
          ĐÁY CỘT 2: ĐỒNG BỘ CHÍNH XÁC THEO TỪNG TÍNH NĂNG (KHÔNG DƯ THỪA TÍNH NĂNG)
          ========================================================================= */}

      {/* 1. KHI CHỌN NÓI GIỌNG NÓI: CHỈ HIỂN THỊ CỘT 5 DOCK ÂM THANH CHUYÊN BIỆT */}
      {bannerMode === 'voice' && (
        <div className={`composer-dock-capsule ${isDockCollapsed ? 'dock-collapsed' : 'dock-expanded'}`}>
          {/* Thanh điều khiển Nói giọng nói: Thu xuống / Thu lên & Đóng giọng nói */}
          <div className="dock-drag-toggle-bar">
            <button 
              type="button"
              className="btn-dock-toggle-handle"
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              title={isDockCollapsed ? "Nhấn để thu lên (Mở rộng Micro & Bảng giọng nói)" : "Nhấn để thu xuống (Thu gọn thanh công cụ)"}
            >
              {isDockCollapsed ? (
                <>
                  <ChevronUp size={14} className="toggle-chevron" />
                  <span className="toggle-text">Thu lên (Mở rộng Micro & Sóng âm)</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="toggle-chevron" />
                  <span className="toggle-text">Thu xuống (Ẩn sóng âm micro)</span>
                </>
              )}
            </button>

            {/* Nút Đóng giọng nói để quay về Chat văn bản */}
            <button 
              type="button"
              className="btn-close-col5-voice"
              onClick={() => onChangeBannerMode && onChangeBannerMode('chat')}
              title="Đóng chế độ Nói giọng nói và quay về Chat văn bản"
            >
              <span>✕ Đóng giọng nói</span>
            </button>
          </div>

          {/* Center Soundwave & Glowing Mic (Ẩn khi thu xuống, hiện khi thu lên) */}
          {!isDockCollapsed && (
            <div className="dock-wave-center-area">
              <div className={`soundwave-visual-wrap ${isRecording ? 'recording-wave' : ''}`}>
                <img 
                  src="/assets/soundwave_exact.png" 
                  alt="Voice Visualizer" 
                  className="soundwave-exact-img"
                  onClick={handleToggleMic}
                />

                <button 
                  type="button"
                  className={`mic-pulsing-circle ${isRecording ? 'is-mic-on' : ''}`}
                  onClick={handleToggleMic}
                  title="Bấm để nói trực tiếp"
                >
                  {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              </div>

              <div className="mic-hint-caption" onClick={handleToggleMic}>
                {isRecording ? 'Đang lắng nghe giọng của anh...' : 'Nhấn để nói...'}
              </div>
            </div>
          )}

          {/* Bottom Tool Row: Chỉ hiển thị các công cụ âm thanh chuyên biệt, loại bỏ tính năng thừa */}
          <div className="dock-bottom-controls-row">
            <div className="dock-left-buttons">
              {/* Nút mic nhỏ gọn khi thu xuống */}
              {isDockCollapsed && (
                <button 
                  type="button"
                  className={`btn-dock-pill mini-mic-pill ${isRecording ? 'recording-active' : ''}`}
                  onClick={handleToggleMic}
                  title="Bấm để nói nhanh"
                >
                  {isRecording ? <MicOff size={15} color="#ef4444" /> : <Mic size={15} color="#2b78fe" />}
                  <span>{isRecording ? 'Đang nghe...' : 'Nói'}</span>
                </button>
              )}

              {/* Nghe lại giọng nói AI */}
              <button 
                type="button"
                className={`btn-dock-pill ${isVoicePlaying ? 'speaking-active' : ''}`}
                onClick={() => handleVoiceSummary()}
                title="Bấm để phát hoặc tạm dừng giọng đọc AI"
              >
                {isVoicePlaying ? <Pause size={15} /> : <Play size={15} />}
                <span>{isVoicePlaying ? 'Tạm dừng đọc' : 'Phát giọng AI'}</span>
              </button>

              {/* Đổi giọng Nam / Nữ */}
              <button 
                type="button"
                className="btn-dock-pill"
                onClick={() => {
                  const nextGender = selectedVoiceGender === 'female' ? 'male' : 'female';
                  setSelectedVoiceGender(nextGender);
                }}
                title="Chuyển đổi giữa giọng Nam và Nữ miền Bắc"
              >
                <Volume2 size={15} />
                <span>{selectedVoiceGender === 'female' ? 'Giọng Nữ Bắc' : 'Giọng Nam Bắc'}</span>
              </button>

              {/* Tốc độ đọc */}
              <button 
                type="button"
                className="btn-dock-pill"
                onClick={() => setSpeechRate(speechRate === 0.95 ? 1.15 : 0.95)}
                title="Điều chỉnh tốc độ giọng nói"
              >
                <Sliders size={15} />
                <span>{speechRate}x</span>
              </button>
            </div>

            {/* Collapsed Inline Input */}
            {isDockCollapsed && (
              <div className="dock-collapsed-input-wrapper">
                <input 
                  ref={textInputRef}
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Nhập phản hồi đàm thoại tại đây..."
                  className="dock-compact-chat-input"
                />
              </div>
            )}

            {/* Right tools */}
            <div className="dock-right-buttons">
              <div className="lang-menu-container">
                <button 
                  type="button"
                  className="btn-dock-pill lang-btn" 
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  title="Chọn ngôn ngữ đàm thoại"
                >
                  <Globe size={15} />
                  <span>{selectedLang}</span>
                  <ChevronDown size={13} />
                </button>

                {showLangMenu && (
                  <div className="lang-popover-dropdown">
                    <button onClick={() => { setSelectedLang('Tiếng Việt'); setShowLangMenu(false); }}>
                      Tiếng Việt (Mặc định)
                    </button>
                    <button onClick={() => { setSelectedLang('English'); setShowLangMenu(false); }}>
                      English (US)
                    </button>
                  </div>
                )}
              </div>

              {/* Send button */}
              <button 
                type="button"
                className={`btn-round-send ${input.trim() ? 'has-text' : ''}`}
                onClick={() => handleSend()}
                title="Gửi tin nhắn âm thanh"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Input văn bản khi mở rộng */}
          {!isDockCollapsed && (
            <input 
              ref={textInputRef}
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Nói vào micro hoặc gõ phản hồi âm thanh..."
              className="dock-inline-chat-input"
            />
          )}
        </div>
      )}

      {/* CHIP BÁO ĐANG ĐỒNG HÀNH CÙNG AGENT */}
      {activeCompanionAgent && (
        <div className="active-companion-chip-bar animated-fade-in">
          <div className="active-companion-chip-left">
            <img 
              src={activeCompanionAgent.avatar} 
              alt={activeCompanionAgent.name} 
              className="chip-avatar-img"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span>Đang đồng hành cùng: <b>{activeCompanionAgent.name}</b> <span className="chip-role">({activeCompanionAgent.role})</span></span>
          </div>
          <button 
            type="button" 
            className="chip-btn-dismiss" 
            onClick={() => setActiveCompanionAgent(null)}
            title="Hủy đồng hành, quay về Trí AI mặc định"
          >
            <X size={13} />
            <span>Hủy</span>
          </button>
        </div>
      )}

      {/* 2. KHI CHỌN CHAT VĂN BẢN: THANH CHAT CHUẨN MỰC, TINH GỌN */}
      {bannerMode === 'chat' && (
        <div className="standard-chat-dock-bar">
          <div className="standard-chat-left-tools">
            <button 
              type="button"
              className="btn-dock-pill" 
              onClick={() => fileInputRef.current?.click()}
              title="Tải lên tệp hồ sơ để phân tích"
            >
              <Paperclip size={15} />
              <span>Tải file</span>
            </button>

            <button 
              type="button"
              className="btn-dock-pill" 
              onClick={onOpenSkillPicker}
              title="Chọn bộ kỹ năng chuyên ngành"
            >
              <Layers size={15} />
              <span>Chọn Skill</span>
            </button>
          </div>

          <div className="standard-chat-input-wrapper">
            <input 
              ref={textInputRef}
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={activeCompanionAgent ? `Trao đổi chuyên môn với ${activeCompanionAgent.name}...` : "Nhập tin nhắn để chat lại với Trí AI (Nhấn Enter để gửi)..."}
              className="standard-chat-text-input"
            />
          </div>

          <div className="standard-chat-right-tools">
            <button 
              type="button"
              className="btn-switch-to-voice-col5"
              onClick={() => onChangeBannerMode && onChangeBannerMode('voice')}
              title="Bật chế độ Nói giọng nói"
            >
              <Mic size={15} className="voice-mic-icon" />
              <span>Nói giọng nói</span>
            </button>

            {/* NÚT AGENT ĐỒNG HÀNH CUỐI CÙNG BÊN PHẢI */}
            <div className="agent-companion-trigger-wrapper" ref={agentPickerRef}>
              <button 
                type="button"
                className={`btn-dock-pill btn-agent-companion ${showAgentPicker ? 'active' : ''} ${activeCompanionAgent ? 'has-active' : ''}`}
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                title="Bấm để chọn Agent đồng hành (4 Chuyên gia AI)"
              >
                {activeCompanionAgent ? (
                  <img src={activeCompanionAgent.avatar} alt="" className="btn-agent-mini-avatar" />
                ) : (
                  <Users size={15} className="agent-dock-icon" />
                )}
                <span className="btn-agent-label">{activeCompanionAgent ? activeCompanionAgent.name : 'Agent đồng hành'}</span>
                <ChevronUp size={13} className={`agent-dock-chevron ${showAgentPicker ? 'open' : ''}`} />
              </button>

              {/* BẢNG AGENT ĐỒNG HÀNH (4 CHUYÊN GIA AI) - KHỚP 100% GIAO DIỆN CỘT 1 */}
              {showAgentPicker && (
                <div className="agent-companion-popover animated-scale-up">
                  <div className="agent-popover-header">
                    <div className="agent-popover-title-row">
                      <span className="agent-popover-title">AGENT ĐỒNG HÀNH</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-agent-popover-close" 
                      onClick={() => setShowAgentPicker(false)}
                      title="Đóng bảng Agent"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="agent-popover-list">
                    {AGENTS_DATA.map((agent) => {
                      const isSelected = activeCompanionAgent?.id === agent.id;
                      return (
                        <div 
                          key={agent.id}
                          className={`agent-popover-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectCompanionAgent(agent)}
                          title={`Kích hoạt ${agent.name}`}
                        >
                          <div className="agent-popover-avatar-wrap">
                            <img 
                              src={agent.avatar} 
                              alt={agent.name} 
                              className="agent-popover-avatar"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span class="avatar-fallback-initials">AG</span>';
                              }}
                            />
                            {isSelected && <span className="agent-selected-badge">✓</span>}
                          </div>
                          <div className="agent-popover-info">
                            <b className="agent-popover-name">{agent.name}</b>
                            <span className="agent-popover-role">{agent.role}</span>
                          </div>
                          <ChevronRight size={16} className="agent-popover-arrow" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button 
              type="button"
              className={`btn-round-send ${input.trim() ? 'has-text' : ''}`}
              onClick={() => handleSend()}
              title="Gửi tin nhắn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 3. KHI CHỌN PHÂN TÍCH FILE: CHỈ HIỂN THỊ CÁC TÍNH NĂNG FILE */}
      {bannerMode === 'file' && (
        <div className="file-mode-dock-bar">
          <div className="standard-chat-left-tools">
            <button 
              type="button"
              className="btn-dock-pill primary-pill" 
              onClick={() => fileInputRef.current?.click()}
              title="Tải lên tệp hồ sơ mới để phân tích"
            >
              <Paperclip size={15} />
              <span>Tải tệp mới</span>
            </button>
          </div>

          <div className="standard-chat-input-wrapper">
            <input 
              ref={textInputRef}
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi Trí AI về bất kỳ chi tiết, số liệu nào trong tệp hồ sơ..."
              className="standard-chat-text-input"
            />
          </div>

          <div className="standard-chat-right-tools">
            <button 
              type="button"
              className="btn-dock-pill"
              onClick={handleExportWord}
              title="Xuất báo cáo kết quả phân tích sang Word (.doc)"
            >
              <Download size={15} />
              <span>Xuất Word</span>
            </button>

            <button 
              type="button"
              className={`btn-round-send ${input.trim() ? 'has-text' : ''}`}
              onClick={() => handleSend()}
              title="Gửi câu hỏi về file"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 4. KHI CHỌN SỬ DỤNG SKILL: CHỈ HIỂN THỊ CÁC TÍNH NĂNG SKILL */}
      {bannerMode === 'skill' && (
        <div className="skill-mode-dock-bar">
          <div className="standard-chat-left-tools">
            <button 
              type="button"
              className="btn-dock-pill" 
              onClick={onOpenSkillPicker}
              title="Đổi sang Skill khác trong kho 33 Skill"
            >
              <Layers size={15} />
              <span>Đổi Skill ({activeSkill.name || 'PCCC'})</span>
            </button>
          </div>

          <div className="standard-chat-input-wrapper">
            <input 
              ref={textInputRef}
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Nhập lệnh thực thi cho Skill [${activeSkill.name || 'PCCC'}]...`}
              className="standard-chat-text-input"
            />
          </div>

          <div className="standard-chat-right-tools">
            <button 
              type="button"
              className="btn-dock-pill primary-pill"
              onClick={() => handleSend(activeSkill.samplePrompt || `Thực thi quy trình chuyên môn ${activeSkill.name}`)}
              title="Chạy quy trình tự động của Skill này"
            >
              <Play size={15} />
              <span>Chạy lệnh</span>
            </button>

            <button 
              type="button"
              className={`btn-round-send ${input.trim() ? 'has-text' : ''}`}
              onClick={() => handleSend()}
              title="Gửi lệnh thực thi"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 5. KHI CHỌN KẾT QUẢ THỰC TẾ: CHỈ HIỂN THỊ CÁC TÍNH NĂNG PHÊ DUYỆT & XUẤT BẢN */}
      {bannerMode === 'result' && (
        <div className="result-mode-dock-bar">
          <div className="standard-chat-left-tools">
            <button 
              type="button"
              className="btn-dock-pill primary-pill" 
              onClick={handleExportWord}
              title="Tải toàn bộ báo cáo thẩm tra Word (.doc)"
            >
              <Download size={15} />
              <span>Tải báo cáo Word</span>
            </button>

            <button 
              type="button"
              className="btn-dock-pill success-pill" 
              onClick={() => alert('Hồ sơ đã được phê duyệt đạt yêu cầu kỹ thuật và ký số thành công!')}
              title="Phê duyệt kết quả thẩm định"
            >
              <CheckCircle2 size={15} />
              <span>Phê duyệt kết quả</span>
            </button>
          </div>

          <div className="standard-chat-input-wrapper">
            <input 
              ref={textInputRef}
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Nhập ý kiến chỉ đạo hoặc yêu cầu điều chỉnh..."
              className="standard-chat-text-input"
            />
          </div>

          <div className="standard-chat-right-tools">
            <button 
              type="button"
              className={`btn-round-send ${input.trim() ? 'has-text' : ''}`}
              onClick={() => handleSend()}
              title="Gửi phản hồi"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
