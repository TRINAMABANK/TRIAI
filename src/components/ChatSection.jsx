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
  onSelectAgent
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
  const handleSend = (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : input;
    if (!query.trim()) return;

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

    setTimeout(() => {
      // Xác định Skill chính xác từ activeSkill hoặc ngữ cảnh truy vấn
      let skillId = (activeSkill?.id || '').toLowerCase();
      if (!skillId) {
        if (query.toLowerCase().includes('ngọc') || query.toLowerCase().includes('áo dài') || query.toLowerCase().includes('lookbook') || query.toLowerCase().includes('kol')) {
          skillId = 'kol-thoi-trang';
        } else if (query.toLowerCase().includes('báo giá') || query.toLowerCase().includes('mua sắm') || query.toLowerCase().includes('đấu thầu')) {
          skillId = 'mua-sam';
        } else if (query.toLowerCase().includes('mep') || query.toLowerCase().includes('cơ điện') || query.toLowerCase().includes('bảo trì')) {
          skillId = 'mep';
        } else if (query.toLowerCase().includes('hợp đồng') || query.toLowerCase().includes('pháp lý')) {
          skillId = 'phap-ly';
        } else {
          skillId = 'pccc';
        }
      }

      let aiResponseText = `Dạ anh Trí, em (${activeSkill?.name || 'Trí AI'}) đã tiếp nhận yêu cầu: "${query}". Dưới đây là kết quả phân tích chuyên môn:`;
      let checklist = activeSkill?.checklist || [];
      let image = null;
      let note = 'Anh có thể xem báo cáo chi tiết ở bên phải, hoặc yêu cầu em xuất báo cáo Word / đọc tóm tắt ngay bây giờ.';
      let files = activeSkill?.sampleFiles || [];

      if (skillId.includes('kol') || skillId.includes('thoi-trang') || skillId.includes('y-ngoc')) {
        aiResponseText = `Dạ anh Trí, em đã kích hoạt Skill KOL Thời Trang và hoàn thành khởi tạo bộ ảnh Lookbook theo quy trình chuẩn cho người mẫu Ý Ngọc:`;
        checklist = [
          { label: 'Nhận diện nhân vật Ý Ngọc: Khóa gương mặt nhất quán 100%', status: 'pass' },
          { label: 'Trang phục Áo dài trắng: Lụa tơ tằm thêu hoa cúc và cườm thủ công', status: 'pass' },
          { label: 'Bối cảnh Khách sạn cao cấp: Sảnh tiệc di sản 5 sao, đèn chùm pha lê', status: 'pass' },
          { label: 'Ánh sáng & Nhiếp ảnh: Commercial Photography, tiêu cự 85mm', status: 'pass' },
          { label: 'Chất lượng xuất bản: Đạt chuẩn Fashion Campaign Lookbook 8K', status: 'pass' }
        ];
        image = '/assets/y_ngoc_aodai.jpg';
        note = 'Ảnh Lookbook độ phân giải 8K đã được kết xuất thành công với tính nhất quán nhận diện nhân vật 100%. Anh có thể tải bộ ảnh gốc ở bên dưới.';
        files = [
          { name: 'Lookbook_Y_Ngoc_Ao_Dai_Trang.pdf', size: '4.8 MB', type: 'pdf' },
          { name: 'Prompt_Sheet_KOL_Thoi_Trang.docx', size: '380 KB', type: 'word' }
        ];
      } else if (skillId.includes('pccc') || skillId.includes('chua-chay')) {
        aiResponseText = `Dạ anh Trí, em (${activeSkill?.name || 'PCCC'}) đã hoàn thành kiểm tra sơ bộ hồ sơ nghiệm thu hệ thống PCCC theo quy chuẩn QCVN 06:2026/BXD:`;
        checklist = [
          { label: 'Thành phần hồ sơ: Đầy đủ theo quy định', status: 'pass' },
          { label: 'Biểu mẫu: Đúng theo Nghị định 136/2020/NĐ-CP & QCVN 06:2026/BXD', status: 'pass' },
          { label: 'Nội dung kỹ thuật: Phù hợp thiết kế được duyệt', status: 'pass' },
          { label: 'Các hạng mục cần lưu ý: 2 điểm (Van xả tràn & Sơ đồ hoàn công)', status: 'pass' },
          { label: 'Đề xuất: Bổ sung biên bản thử nghiệm hệ thống báo cháy tự động và cập nhật sơ đồ hoàn công.', status: 'pass' }
        ];
        image = null;
        note = 'Hồ sơ PCCC đã được đối soát 100%. Anh có thể xuất báo cáo Word (.doc) hoặc nghe tóm tắt kết quả.';
        files = [
          { name: 'Bao_cao_kiem_tra_PCCC.pdf', size: '2.4 MB', type: 'pdf' },
          { name: 'Danh_sach_diem_luu_y.xlsx', size: '324 KB', type: 'excel' },
          { name: 'So_do_hoan_cong.pdf', size: '1.1 MB', type: 'pdf' }
        ];
      } else if (skillId.includes('mua-sam') || skillId.includes('dau-thau') || skillId.includes('bao-gia')) {
        aiResponseText = `Dạ anh Trí, em (${activeSkill?.name || 'Mua sắm'}) đã hoàn thành bóc tách và so sánh đa báo giá thiết bị:`;
        checklist = [
          { label: 'Số lượng báo giá so sánh: Đầy đủ 3 nhà cung cấp uy tín', status: 'pass' },
          { label: 'Đơn giá & Chiết khấu: Tối ưu 12% so với đơn giá dự toán duyệt', status: 'pass' },
          { label: 'Hồ sơ năng lực & Chứng chỉ CO/CQ: Hợp lệ theo tiêu chuẩn', status: 'pass' },
          { label: 'Đề xuất: Lựa chọn phương án có tổng chi phí sở hữu (TCO) thấp nhất.', status: 'pass' }
        ];
        image = null;
        note = 'Bảng so sánh chi tiết và dự thảo tờ trình mua sắm đã sẵn sàng để xuất file.';
        files = [
          { name: 'Bang_so_sanh_3_bao_gia.xlsx', size: '512 KB', type: 'excel' },
          { name: 'To_trinh_mua_sam_ISO.docx', size: '1.2 MB', type: 'word' }
        ];
      } else if (skillId.includes('mep') || skillId.includes('van-hanh') || skillId.includes('toa-nha')) {
        aiResponseText = `Dạ anh Trí, em (${activeSkill?.name || 'MEP'}) đã hoàn tất phân tích hệ thống cơ điện và quy trình bảo trì tòa nhà:`;
        checklist = [
          { label: 'Trạm biến áp & Tủ điện phân phối: Phân tải cân bằng 3 pha', status: 'pass' },
          { label: 'Hệ thống bơm nước & Điều hòa HVAC: Áp lực và lưu lượng ổn định', status: 'pass' },
          { label: 'Lịch bảo dưỡng phòng ngừa rủi ro: Đã lên kế hoạch quý', status: 'pass' },
          { label: 'Đề xuất: Hiệu chuẩn cảm biến nhiệt độ tầng hầm và thay thế bộ lọc gió.', status: 'pass' }
        ];
        image = null;
        note = 'Báo cáo kiểm toán vận hành MEP đã được trích xuất chi tiết.';
        files = [
          { name: 'Nhat_ky_van_hanh_MEP.xlsx', size: '820 KB', type: 'excel' },
          { name: 'Quy_trinh_bao_tri_toa_nha.pdf', size: '1.9 MB', type: 'pdf' }
        ];
      } else if (skillId.includes('phap-ly') || skillId.includes('hop-dong')) {
        aiResponseText = `Dạ anh Trí, em (${activeSkill?.name || 'Pháp lý'}) đã hoàn thành rà soát các điều khoản hợp đồng:`;
        checklist = [
          { label: 'Tư cách chủ thể & Thẩm quyền đại diện: Hợp lệ 100%', status: 'pass' },
          { label: 'Điều khoản bảo lãnh & Tạm ứng thanh toán: Đảm bảo an toàn tài chính', status: 'pass' },
          { label: 'Điều khoản phạt vi phạm & Bồi thường thiệt hại: Đúng luật', status: 'pass' },
          { label: 'Đề xuất: Làm rõ mốc bàn giao thực tế và cơ chế giải quyết tranh chấp.', status: 'pass' }
        ];
        image = null;
        note = 'Biên bản rà soát pháp lý kèm ghi chú rủi ro đã sẵn sàng.';
        files = [
          { name: 'Ra_soat_hop_dong_phap_ly.docx', size: '1.4 MB', type: 'word' }
        ];
      } else {
        if (checklist.length === 0) {
          checklist = [
            { label: `Quy trình thực thi Skill [${activeSkill?.name}]: Đạt chuẩn`, status: 'pass' },
            { label: 'Dữ liệu đầu vào: Hợp lệ và đồng bộ', status: 'pass' },
            { label: 'Đề xuất: Thực hiện theo đúng quy chuẩn nghiệp vụ.', status: 'pass' }
          ];
        }
        if (files.length === 0) {
          files = [
            { name: `Bao_cao_${activeSkill?.id || 'Skill'}.pdf`, size: '1.8 MB', type: 'pdf' }
          ];
        }
      }

      if (activeCompanionAgent) {
        aiResponseText = `Dạ anh Trí, tôi là ${activeCompanionAgent.name} (${activeCompanionAgent.role}). Tôi đã tiếp nhận yêu cầu: "${query}". Dưới đây là phân tích chuyên môn của tôi:`;
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        agentName: activeCompanionAgent?.name,
        agentRole: activeCompanionAgent?.role,
        agentAvatar: activeCompanionAgent?.avatar,
        skillId: activeSkill?.id || 'pccc',
        skillName: activeSkill?.name || 'PCCC',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        text: aiResponseText,
        checklist: checklist,
        image: image,
        note: note,
        files: files
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsAiTyping(false);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 60);
    }, 800);
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

  // Xuất báo cáo Word (.doc tải về thực tế)
  const handleExportWord = () => {
    const reportContent = `
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------------
BÁO CÁO KẾT QUẢ KIỂM TRA HỒ SƠ CHUYÊN MÔN
Hệ thống: ${activeSkill.name || 'PCCC'}
Chủ sở hữu hệ thống: Anh Trí (TRÍ AI)
Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}

1. KẾT QUẢ RÀ SOÁT TỔNG THỂ:
- Thành phần hồ sơ: Đầy đủ theo quy định (100%).
- Biểu mẫu: Đúng theo Nghị định 136/2020/NĐ-CP & QCVN 06:2026/BXD.
- Nội dung kỹ thuật: Phù hợp với thiết kế được phê duyệt.
- Các hạng mục cần lưu ý: 2 điểm kỹ thuật (Van xả tràn & Sơ đồ hoàn công).

2. ĐỀ XUẤT THỰC HIỆN:
- Bổ sung biên bản thử nghiệm áp lực hệ thống báo cháy tự động.
- Cập nhật sơ đồ hoàn công vào hồ sơ bàn giao.

Khởi tạo tự động bởi Hệ sinh thái Trí AI.
    `;
    const blob = new Blob([reportContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_kiem_tra_${activeSkill.id || 'PCCC'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
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
              <h2 className="welcome-title">Trí AI Đã Sẵn Sàng</h2>
              <p className="welcome-desc">
                Hệ sinh thái đã được làm mới hoàn toàn để bắt đầu sử dụng từ đầu. Hãy chọn một gợi ý bên dưới hoặc nhập tin nhắn để bắt đầu:
              </p>

              <div className="welcome-suggestions-grid">
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

                    {/* Attached Files (Khớp 100% 3 thẻ file mẫu) */}
                    {m.files && m.files.length > 0 && (
                      <div className="attached-files-row">
                        {m.files.map((file, fIdx) => {
                          const isExcel = file.type === 'excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
                          return (
                            <div 
                              key={fIdx} 
                              className="file-card-pill" 
                              onClick={() => onOpenFileViewer(file)}
                              title="Bấm để xem và tải file"
                            >
                              <div className={`file-badge-icon ${isExcel ? 'excel-tag' : 'pdf-tag'}`}>
                                {isExcel ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
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
                ? 'Đang lắng nghe giọng của anh...' 
                : isVoicePlaying 
                ? 'Trí AI đang đọc tóm tắt...' 
                : 'Trợ Lý Giọng Nói Trí AI Đã Sẵn Sàng'}
            </h3>
            
            <p className="voice-central-desc">
              Anh có thể nói tự nhiên bằng tiếng Việt hoặc bấm nút gọi lệnh bên dưới để Trí AI phản hồi ngay.
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
                title="Tải về file báo cáo Word (.doc)"
              >
                <span className="word-blue-tag">W</span>
                <span>Xuất báo cáo Word</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => handleSend(`Hãy tạo giúp tôi một Tờ trình phê duyệt hồ sơ ${activeSkill.name || 'PCCC'}.`)}
                title="Tạo tờ trình phê duyệt"
              >
                <FileText size={16} />
                <span>Tạo tờ trình</span>
              </button>

              <button 
                className="pill-action-btn"
                onClick={() => handleSend(`Lập bảng Checklist chi tiết các hạng mục cần nghiệm thu.`)}
                title="Lập checklist nghiệm thu"
              >
                <CheckCircle2 size={16} />
                <span>Lập checklist</span>
              </button>
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
          {/* Thanh điều khiển trên Cột 5: Thu xuống / Thu lên & Đóng giọng nói */}
          <div className="dock-drag-toggle-bar">
            <button 
              type="button"
              className="btn-dock-toggle-handle"
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              title={isDockCollapsed ? "Nhấn để thu lên (Mở rộng Micro & Bảng giọng nói Cột 5)" : "Nhấn để thu xuống (Thu gọn thanh công cụ Cột 5)"}
            >
              {isDockCollapsed ? (
                <>
                  <ChevronUp size={14} className="toggle-chevron" />
                  <span className="toggle-text">Thu lên (Mở rộng Micro & Sóng âm)</span>
                  <span className="badge-col5-hint">Cột 5</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="toggle-chevron" />
                  <span className="toggle-text">Thu xuống (Ẩn sóng âm micro)</span>
                  <span className="badge-col5-hint">Cột 5</span>
                </>
              )}
            </button>

            {/* Nút Đóng Cột 5 để quay về Chat văn bản */}
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
              title="Bật chế độ Nói giọng nói (Cột 5)"
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
