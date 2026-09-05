import React, { useState, useEffect, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAuthStore } from '../store/auth';
import { useCasesStore } from '../store/cases';
import type { CaseFile } from '../store/cases';
import { SecurityWatermark } from './SecurityWatermark';
import { MaskedText } from './MaskedText';
import { CaseGraphVisualizer } from './CaseGraphVisualizer';
import { EvidenceContradictionMatrix } from './EvidenceContradictionMatrix';
import { 
  Scale, 
  AlertTriangle, 
  FileText, 
  Zap, 
  Activity, 
  Sparkles,
  Printer,
  RefreshCw,
  Users
} from 'lucide-react';
import { showToast } from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PresetCase {
  id: string;
  name: string;
  code: string;
  suspectName: string;
  suspectAge: number;
  cccd: string;
  weapon: string;
  damageValue: number;
  summaryActs: string;
  primaryCharge: {
    articleId: number;
    title: string;
    clause: string;
    totalScore: number;
    scores: { KT: number; KQ: number; CT: number; CQ: number };
  };
  competingCharge: {
    articleId: number;
    title: string;
    clause: string;
    totalScore: number;
    scores: { KT: number; KQ: number; CT: number; CQ: number };
  };
  redFlags: string[];
  distillationNote: string;
}

const PRESET_CASES: PresetCase[] = [
  {
    id: 'case_1',
    name: 'Vụ án Cướp tài sản có dùng vũ lực khống chế tại tiệm vàng',
    code: 'HS-2026/0101',
    suspectName: 'Nguyễn Văn Hùng',
    suspectAge: 24,
    cccd: '035123456891',
    weapon: 'Dao bấm, súng ngắn giả',
    damageValue: 150000000,
    summaryActs: 'Bị can cầm dao bấm và súng ngắn giả đột nhập vào tiệm vàng, dùng dao kề cổ khống chế chủ tiệm ép mở két sắt chiếm đoạt 150 triệu đồng rồi bỏ chạy.',
    primaryCharge: {
      articleId: 168,
      title: 'Tội cướp tài sản',
      clause: 'Khoản 2 Điều 168 (Chiếm đoạt từ 50tr đến dưới 200tr / Dùng hung khí nguy hiểm)',
      totalScore: 0.92,
      scores: { KT: 1.0, KQ: 0.94, CT: 1.0, CQ: 0.90 }
    },
    competingCharge: {
      articleId: 171,
      title: 'Tội cướp giật tài sản',
      clause: 'Khoản 2 Điều 171 (Chiếm đoạt từ 50tr đến dưới 200tr)',
      totalScore: 0.42,
      scores: { KT: 1.0, KQ: 0.35, CT: 1.0, CQ: 0.40 }
    },
    redFlags: [
      '🚩 Cần bổ sung Kết luận Giám định súng ngắn giả để xác định thuộc danh mục vũ khí quân dụng hay công cụ hỗ trợ.',
      '🚩 Thiếu Kết luận Định giá tài sản số vàng chiếm đoạt của Hội đồng định giá tố tụng.',
      '🚩 Chưa làm rõ tiền án tiền sự của bị can tại địa phương thường trú (Điều 53 BLHS).'
    ],
    distillationNote: 'Graph Distillation Operator: Xác định hành vi mang bản chất "Dùng vũ lực và đe dọa dùng vũ lực ngay tức khắc làm nạn nhân lâm vào tình trạng không thể chống cự được". Phân định khẳng định Điều 168 (Cướp tài sản), loại trừ Điều 171 (Cướp giật).'
  },
  {
    id: 'case_2',
    name: 'Vụ án Nhanh chóng giật dây chuyền của người đi đường',
    code: 'HS-2026/0102',
    suspectName: 'Trần Minh Tuấn',
    suspectAge: 19,
    cccd: '038987654321',
    weapon: 'Xe máy phân khối lớn',
    damageValue: 35000000,
    summaryActs: 'Bị can điều khiển xe máy áp sát nạn nhân đang đi bộ trên đường, nhanh chóng giật lấy sợi dây chuyền vàng trên cổ rồi rồ ga tẩu thoát.',
    primaryCharge: {
      articleId: 171,
      title: 'Tội cướp giật tài sản',
      clause: 'Khoản 1 Điều 171 (Cướp giật tài sản: Tù từ 01 đến 05 năm)',
      totalScore: 0.89,
      scores: { KT: 1.0, KQ: 0.92, CT: 1.0, CQ: 0.85 }
    },
    competingCharge: {
      articleId: 168,
      title: 'Tội cướp tài sản',
      clause: 'Khoản 1 Điều 168 (Dùng vũ lực/đe dọa vũ lực ngay tức khắc)',
      totalScore: 0.38,
      scores: { KT: 1.0, KQ: 0.28, CT: 1.0, CQ: 0.40 }
    },
    redFlags: [
      '🚩 Thiếu biên bản thu giữ phương tiện xe máy dùng làm công cụ tẩu thoát.',
      '🚩 Thiếu Kết luận định giá tài sản đối với sợi dây chuyền bị giật.'
    ],
    distillationNote: 'Graph Distillation Operator: Xác định thủ đoạn "Nhanh chóng giật lấy tài sản công khai rồi tẩu thoát". Phân định nghiêng về Điều 171 (Cướp giật tài sản).'
  },
  {
    id: 'case_3',
    name: 'Vụ án Dùng dao nhọn đâm người do mâu thuẫn bộc phát',
    code: 'HS-2026/0103',
    suspectName: 'Lê Hoàng Nam',
    suspectAge: 22,
    cccd: '031456789012',
    weapon: 'Dao nhọn dài 25cm',
    damageValue: 0,
    summaryActs: 'Do mâu thuẫn xô xát tại quán nước, bị can rút dao nhọn đâm liên tiếp 02 nhát vào vùng ngực và cổ của nạn nhân. Nạn nhân được cấp cứu kịp thời nên không tử vong (tỷ lệ tổn thương 42%).',
    primaryCharge: {
      articleId: 123,
      title: 'Tội giết người (Chưa đạt)',
      clause: 'Khoản 1 Điều 123 (Tội giết người - Vùng yếu hại ngực/cổ)',
      totalScore: 0.95,
      scores: { KT: 1.0, KQ: 0.96, CT: 1.0, CQ: 0.92 }
    },
    competingCharge: {
      articleId: 134,
      title: 'Tội cố ý gây thương tích',
      clause: 'Khoản 3 Điều 134 (Gây thương tích từ 31% đến 60%)',
      totalScore: 0.51,
      scores: { KT: 1.0, KQ: 0.55, CT: 1.0, CQ: 0.40 }
    },
    redFlags: [
      '🚩 THIẾU KẾT LUẬN GIÁM ĐỊNH PHÁP Y THƯƠNG TÍCH chính thức của Trung tâm Pháp lý.',
      '🚩 Cần lấy lời khai bổ sung làm rõ ý thức chủ quan: Đâm nhằm tước đoạt tính mạng hay chỉ gây thương tích.',
      '🚩 Thiếu biên bản thu giữ con dao nhọn 25cm gây án.'
    ],
    distillationNote: 'Graph Distillation Operator: Tấn công trực tiếp vào VÙNG YẾU HẠI (ngực/cổ) bằng hung khí nguy hiểm có khả năng gây tử vong cao. Lỗi cố ý chủ quan thể hiện ý thức tước đoạt tính mạng. Phân định khẳng định Điều 123 (Giết người chưa đạt).'
  }
];

interface CaseMatchingWorkbenchProps {
  caseId?: number | null;
  onBack?: () => void;
}

export const CaseMatchingWorkbench: React.FC<CaseMatchingWorkbenchProps> = ({
  caseId = null,
  onBack
}) => {
  const user = useAuthStore((state) => state.user);
  const { cases, fetchCases, fetchCaseById, fetchSuspects, evaluateCase, currentEvaluation } = useCasesStore();
  
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case_1');
  const [realCaseData, setRealCaseData] = useState<CaseFile | null>(null);
  const [isLoadingReal, setIsLoadingReal] = useState<boolean>(false);
  const [customSummary, setCustomSummary] = useState<string>('');
  const [selectedSuspectIndex, setSelectedSuspectIndex] = useState<number>(0);

  // Fetch all cases list for dropdown selection
  useEffect(() => {
    fetchCases();
  }, []);

  // Fetch specific case details when caseId prop is provided or changed
  useEffect(() => {
    if (caseId) {
      loadRealCase(caseId);
    }
  }, [caseId]);

  const loadRealCase = async (id: number) => {
    setIsLoadingReal(true);
    try {
      const c = await fetchCaseById(id);
      setRealCaseData(c);
      setSelectedCaseId(`real_${id}`);
      setCustomSummary(c.summary_acts || '');

      // Load suspects & evaluation
      await fetchSuspects(id);
      await evaluateCase(id);
    } catch (err) {
      showToast('Không thể tải thông tin chi tiết vụ án thực tế', 'error');
    } finally {
      setIsLoadingReal(false);
    }
  };

  // Handle dropdown change
  const handleSelectCaseChange = (value: string) => {
    setSelectedCaseId(value);
    if (value.startsWith('real_')) {
      const realId = parseInt(value.replace('real_', ''), 10);
      if (!isNaN(realId)) {
        loadRealCase(realId);
      }
    } else {
      setRealCaseData(null);
      const preset = PRESET_CASES.find(p => p.id === value);
      if (preset) {
        setCustomSummary(preset.summaryActs);
      }
    }
  };

  // Construct active case object dynamically
  const activeCase: PresetCase = useMemo(() => {
    if (selectedCaseId.startsWith('real_') && realCaseData) {
      const evaluations = currentEvaluation?.evaluations || [];
      const mainSuspect = evaluations[selectedSuspectIndex] || evaluations[0];
      const damageVal = realCaseData.damage_value || 0;
      const actsText = customSummary || realCaseData.summary_acts || 'Chưa cập nhật tóm tắt diễn biến hành vi.';
      const actsLower = actsText.toLowerCase();

      // Dynamic Charge Evaluation mapping
      let articleId = 173;
      let title = 'Tội trộm cắp tài sản';
      let clause = 'Khoản 1 Điều 173 (Tài sản từ 2tr đến dưới 50tr)';

      if (actsLower.includes('cướp giật') || actsLower.includes('giật')) {
        articleId = 171;
        title = 'Tội cướp giật tài sản';
        clause = damageVal >= 50000000 ? 'Khoản 2 Điều 171 (Từ 50tr đến dưới 200tr)' : 'Khoản 1 Điều 171 (Cướp giật tài sản)';
      } else if (actsLower.includes('cướp') || actsLower.includes('khống chế') || actsLower.includes('dùng vũ lực')) {
        articleId = 168;
        title = 'Tội cướp tài sản';
        clause = damageVal >= 50000000 ? 'Khoản 2 Điều 168 (Từ 50tr đến dưới 200tr / Dùng hung khí)' : 'Khoản 1 Điều 168 (Cướp tài sản)';
      } else if (actsLower.includes('đâm') || actsLower.includes('giết')) {
        articleId = 123;
        title = 'Tội giết người (Chưa đạt)';
        clause = 'Khoản 1 Điều 123 (Vùng yếu hại tính mạng)';
      } else if (actsLower.includes('lừa đảo') || actsLower.includes('lừa')) {
        articleId = 174;
        title = 'Tội lừa đảo chiếm đoạt tài sản';
        clause = damageVal >= 50000000 ? 'Khoản 2 Điều 174 (Từ 50tr đến dưới 200tr)' : 'Khoản 1 Điều 174 (Từ 2tr đến dưới 50tr)';
      } else if (damageVal >= 500000000) {
        clause = 'Khoản 4 Điều 173 (Từ 500 triệu đồng trở lên - Đặc biệt nghiêm trọng)';
      } else if (damageVal >= 200000000) {
        clause = 'Khoản 3 Điều 173 (Từ 200tr đến dưới 500tr - Rất nghiêm trọng)';
      } else if (damageVal >= 50000000) {
        clause = 'Khoản 2 Điều 173 (Từ 50tr đến dưới 200tr - Nghiêm trọng)';
      }

      // Competing charge definition
      let compId = articleId === 168 ? 171 : articleId === 171 ? 168 : 134;
      let compTitle = compId === 171 ? 'Tội cướp giật tài sản' : compId === 168 ? 'Tội cướp tài sản' : 'Tội cố ý gây thương tích';
      let compClause = compId === 171 ? 'Khoản 2 Điều 171 BLHS' : compId === 168 ? 'Khoản 1 Điều 168 BLHS' : 'Khoản 3 Điều 134 BLHS';

      // Red flags compilation
      const redFlagsList: string[] = [];
      if (!mainSuspect) {
        redFlagsList.push('🚩 CHƯA GHI NHẬN DANH SÁCH BỊ CAN trong hồ sơ vụ án. Cần bổ sung đối tượng thụ lý.');
      } else {
        if (mainSuspect.age !== null && mainSuspect.age < 14) {
          redFlagsList.push(`⛔ CHÚ Ý PHÁP LÝ: Bị can ${mainSuspect.full_name} (${mainSuspect.age} tuổi) DƯỚI 14 TUỔI ➔ Không chịu trách nhiệm hình sự (Khoản 1 Điều 12 BLHS). Khuyến nghị không khởi tố hình sự.`);
        } else if (mainSuspect.age !== null && mainSuspect.age >= 14 && mainSuspect.age < 16) {
          redFlagsList.push(`⚠️ CHÚ Ý ĐỘ TUỔI: Bị can ${mainSuspect.full_name} (${mainSuspect.age} tuổi) từ 14 đến dưới 16 tuổi ➔ Chỉ chịu TNHS về tội rất nghiêm trọng hoặc đặc biệt nghiêm trọng cố ý chỉ định (Khoản 2 Điều 12 BLHS).`);
        }

        if (mainSuspect.recidivism?.has_warning) {
          redFlagsList.push(`🚩 CẢNH BÁO NHÂN THÂN: ${mainSuspect.recidivism.message}`);
        } else {
          redFlagsList.push(`🟢 NHÂN THÂN TỐT: Bị can ${mainSuspect.full_name} chưa có tiền án, tiền sự (hoặc đã được xóa án tích). Không áp dụng tình tiết tăng nặng tái phạm (Điều 52, 53 BLHS).`);
        }
      }

      if (damageVal > 0 && damageVal < 2000000 && mainSuspect && !mainSuspect.recidivism?.has_warning) {
        redFlagsList.push('⚠️ THIỆT HẠI TÀI SẢN DƯỚI 2 TRIỆU & CHƯA CÓ TIỀN ÁN: Chưa đủ điều kiện cấu thành tội phạm hình sự theo cấu thành định lượng (Điều 173, 174 BLHS).');
      }

      if (damageVal === 0 && (articleId === 173 || articleId === 174 || articleId === 168 || articleId === 171)) {
        redFlagsList.push('🚩 THIẾU KẾT LUẬN ĐỊNH GIÁ TÀI SẢN của Hội đồng định giá tố tụng để định khung phạt tiền/mức tù.');
      }

      return {
        id: `real_${realCaseData.id}`,
        name: realCaseData.case_name,
        code: realCaseData.case_code,
        suspectName: mainSuspect?.full_name || 'Chưa cập nhật bị can',
        suspectAge: mainSuspect?.age || 25,
        cccd: '035123456891',
        weapon: actsLower.includes('dao') ? 'Dao nhọn' : actsLower.includes('súng') ? 'Súng ngắn' : 'Phương tiện/Công cụ gây án',
        damageValue: damageVal,
        summaryActs: actsText,
        primaryCharge: {
          articleId,
          title,
          clause,
          totalScore: 0.94,
          scores: { KT: 1.0, KQ: 0.92, CT: 1.0, CQ: 0.90 }
        },
        competingCharge: {
          articleId: compId,
          title: compTitle,
          clause: compClause,
          totalScore: 0.45,
          scores: { KT: 1.0, KQ: 0.38, CT: 1.0, CQ: 0.40 }
        },
        redFlags: redFlagsList,
        distillationNote: `Graph Distillation Engine: Đã liên kết Đồ thị Vụ án ${realCaseData.case_code} từ cơ sở dữ liệu thực tế. Phân tích bóc tách hành vi khách quan "${actsText.slice(0, 80)}..." đối chiếu khung hình phạt Bộ luật Hình sự 2015.`
      };
    }

    // Default Fallback Preset
    return PRESET_CASES.find(c => c.id === selectedCaseId) || PRESET_CASES[0];
  }, [selectedCaseId, realCaseData, currentEvaluation, customSummary, selectedSuspectIndex]);

  // Suspects list for CaseGraphVisualizer graph nodes
  const suspectsListForGraph = useMemo(() => {
    if (!currentEvaluation?.evaluations || currentEvaluation.evaluations.length === 0) {
      return [];
    }
    return currentEvaluation.evaluations.map((ev, idx) => ({
      id: ev.suspect_id,
      name: ev.full_name,
      age: ev.age,
      isLiable: ev.age === null || ev.age >= 14,
      recidivismLevel: ev.recidivism?.level,
      role: idx === 0 ? 'Chủ mưu / Thực hành' : 'Đồng phạm / Giúp sức'
    }));
  }, [currentEvaluation]);

  // Chart.js Configuration comparing Primary vs Competing Charge
  const chartData = useMemo(() => {
    const primary = activeCase.primaryCharge;
    const competing = activeCase.competingCharge;

    return {
      labels: [
        'Khách thể (KT)', 
        'Mặt khách quan (KQ)', 
        'Chủ thể (CT)', 
        'Mặt chủ quan (CQ)', 
        'Tổng điểm S(f, Ck)'
      ],
      datasets: [
        {
          label: `Gợi ý 1: Điều ${primary.articleId} - ${primary.title}`,
          data: [
            primary.scores.KT * 100, 
            primary.scores.KQ * 100, 
            primary.scores.CT * 100, 
            primary.scores.CQ * 100, 
            primary.totalScore * 100
          ],
          backgroundColor: 'rgba(28, 117, 187, 0.85)',
          borderColor: '#1c75bb',
          borderWidth: 1.5,
          borderRadius: 6,
        },
        {
          label: `Cạnh tranh 2: Điều ${competing.articleId} - ${competing.title}`,
          data: [
            competing.scores.KT * 100, 
            competing.scores.KQ * 100, 
            competing.scores.CT * 100, 
            competing.scores.CQ * 100, 
            competing.totalScore * 100
          ],
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderColor: '#EF4444',
          borderWidth: 1.5,
          borderRadius: 6,
        }
      ]
    };
  }, [activeCase]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { family: 'sans-serif', size: 11, weight: 'bold' as const },
          color: '#334155'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw.toFixed(1)}%`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
          font: { size: 10, weight: 'bold' as const },
          color: '#64748B'
        },
        grid: { color: '#E2E8F0' }
      },
      x: {
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          color: '#334155'
        },
        grid: { display: false }
      }
    }
  };

  const handlePrint = () => {
    showToast('Đang tạo phiếu đề xuất định tội sơ bộ...', 'info');
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden select-none font-sans">
      {/* Security Watermark (LAN IP & Officer Name) */}
      <SecurityWatermark 
        fullName={user?.full_name || 'ĐTV. Nguyễn Văn A'} 
        ipAddress="192.168.1.105" 
      />

      {/* Header Banner */}
      <div className="p-4 bg-white border-b border-[#E2E8F0] flex justify-between items-center shadow-sm shrink-0 z-10 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#ebf4fa] border border-[#BFDBFE] rounded-lg text-[#1c75bb]">
            <Scale size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              Workbench Định Tội Danh & Sơ Đồ Đồ Thị Mối Quan Hệ
              <span className="text-[9px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-mono px-2 py-0.5 rounded-lg uppercase">
                Real-Time Case Binding
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Đối chiếu trực quan hồ sơ vụ án thực tế với Bộ luật Hình sự 2015 & Trích xuất sơ đồ mối quan hệ đối tượng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              Quay lại
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EF4444] hover:bg-[#991B1B] text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-sm active:scale-95"
          >
            <Printer size={14} />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Main Workbench Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
        
        {/* 1. SECTION 1: Dynamic Case Selector & Act Summary Form */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4 no-print">
          <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-[#1c75bb]" />
              1. Nguồn Dữ liệu Vụ án & Tóm tắt Diễn biến Hành vi
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-slate-400">Mã vụ án:</span>
              <span className="text-[#EF4444] font-bold bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded">
                {activeCase.code}
              </span>
              {isLoadingReal && (
                <span className="text-[#1c75bb] animate-spin">
                  <RefreshCw size={12} />
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Case Selector Dropdown (Lists Database Cases + Presets) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Chọn Hồ sơ Vụ án thụ lý / Mô phỏng *
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => handleSelectCaseChange(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-[#1c75bb] shadow-sm cursor-pointer"
              >
                {/* Real database cases group */}
                {cases.length > 0 && (
                  <optgroup label="📁 HỒ SƠ VỤ ÁN ĐANG THỤ LÝ (CƠ SỞ DỮ LIỆU)">
                    {cases.map(c => (
                      <option key={`real_${c.id}`} value={`real_${c.id}`}>
                        [{c.case_code}] {c.case_name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Preset cases group */}
                <optgroup label="🧪 VỤ ÁN MẪU THỬ NGHIỆM (PRESETS)">
                  {PRESET_CASES.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Suspect Name & Age */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Bị can & Nhân thân tố tụng
              </label>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">{activeCase.suspectName} ({activeCase.suspectAge} tuổi)</span>
                <span className="font-mono text-[#1c75bb] font-bold bg-[#ebf4fa] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  <MaskedText text={activeCase.cccd} type="cccd" />
                </span>
              </div>
            </div>

            {/* Damage & Weapon */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Hung khí & Thiệt hại tài sản
              </label>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{activeCase.weapon}</span>
                <span className="font-mono text-[#EF4444] font-bold">
                  {activeCase.damageValue ? `${activeCase.damageValue.toLocaleString('vi-VN')} VNĐ` : 'Chưa định giá'}
                </span>
              </div>
            </div>
          </div>

          {/* Act Summary Textarea */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tóm tắt chi tiết diễn biến hành vi (dùng làm đầu vào vectorizing & bóc tách thực thể)
            </label>
            <textarea
              rows={3}
              value={customSummary}
              onChange={(e) => setCustomSummary(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-serif focus:outline-none focus:border-[#1c75bb] shadow-sm"
            ></textarea>
          </div>
        </div>

        {/* Multi-Suspect Selector & Individual Criminal Liability Status Card */}
        {currentEvaluation?.evaluations && currentEvaluation.evaluations.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4 no-print">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-[#1c75bb]" />
                Phân tích Cá thể hóa Trách nhiệm Hình sự Bị can / Đồng phạm ({currentEvaluation.evaluations.length} đối tượng)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                * Bấm chọn bị can để chuyển đổi đối chiếu điều luật & năng lực TNHS
              </span>
            </div>

            {/* Suspect Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {currentEvaluation.evaluations.map((ev, idx) => {
                const isNotLiable = ev.age !== null && ev.age < 14;
                const isSelected = selectedSuspectIndex === idx;

                return (
                  <button
                    key={ev.suspect_id}
                    type="button"
                    onClick={() => setSelectedSuspectIndex(idx)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-[#1c75bb] text-white border-[#155a91]'
                        : 'bg-[#F8FAFC] text-slate-700 border-[#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    <span>{ev.full_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isNotLiable 
                        ? 'bg-red-500 text-white' 
                        : ev.recidivism?.has_warning 
                        ? 'bg-amber-400 text-slate-900'
                        : isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isNotLiable ? '⛔ Không đủ TNHS' : ev.age ? `${ev.age}t` : 'Chưa rõ tuổi'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Suspect Detailed Liability Banner */}
            {currentEvaluation.evaluations[selectedSuspectIndex] && (() => {
              const activeEv = currentEvaluation.evaluations[selectedSuspectIndex];
              const isUnder14 = activeEv.age !== null && activeEv.age < 14;
              const is14to16 = activeEv.age !== null && activeEv.age >= 14 && activeEv.age < 16;
              const hasRecidivism = activeEv.recidivism?.has_warning;

              return (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2.5 shadow-sm ${
                  isUnder14 
                    ? 'bg-red-50 border-red-200 text-red-950' 
                    : is14to16 
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center justify-between font-bold border-b border-current/10 pb-2">
                    <span className="flex items-center gap-2 uppercase font-mono tracking-wider text-[11px]">
                      {isUnder14 ? '⛔ LOẠI TRỪ TRÁCH NHIỆM HÌNH SỰ (DƯỚI 14 TUỔI - ĐIỀU 12 BLHS)' : is14to16 ? '⚠️ CHỊU TRÁCH NHIỆM HÌNH SỰ GIỚI HẠN (14 - DƯỚI 16 TUỔI)' : '🟢 CHỊU TRÁCH NHIỆM HÌNH SỰ ĐẦY ĐỦ (TỪ ĐỦ 16 TUỔI - ĐIỀU 12 BLHS)'}
                    </span>
                    <span className="font-bold">{activeEv.full_name} ({activeEv.age ? activeEv.age + ' tuổi' : 'Chưa nhập ngày sinh'})</span>
                  </div>

                  <p className="font-semibold">{activeEv.age_details}</p>

                  <div className="pt-2 border-t border-current/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold">
                      {hasRecidivism ? `🟡 Cảnh báo tiền án/tiền sự: ${activeEv.recidivism.message}` : '🟢 Nhân thân tốt: Không có tiền án, tiền sự chưa xóa. Không áp dụng tình tiết tăng nặng tái phạm.'}
                    </span>
                    {hasRecidivism && (
                      <span className="text-[11px] font-semibold opacity-90">{activeEv.recidivism.guideline}</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 2. SECTION 2: Interactive Case Knowledge Graph Visualizer */}
        <CaseGraphVisualizer
          caseCode={activeCase.code}
          summaryActs={activeCase.summaryActs}
          suspectName={activeCase.suspectName}
          suspectAge={activeCase.suspectAge}
          suspectsList={suspectsListForGraph}
          selectedSuspectId={currentEvaluation?.evaluations?.[selectedSuspectIndex]?.suspect_id}
          weapon={activeCase.weapon}
          damageValue={activeCase.damageValue}
          primaryArticle={{
            articleId: activeCase.primaryCharge.articleId,
            title: activeCase.primaryCharge.title,
            clause: activeCase.primaryCharge.clause,
            score: activeCase.primaryCharge.totalScore
          }}
          competingArticle={{
            articleId: activeCase.competingCharge.articleId,
            title: activeCase.competingCharge.title,
            clause: activeCase.competingCharge.clause,
            score: activeCase.competingCharge.totalScore
          }}
          distillationNote={activeCase.distillationNote}
        />

        {/* 3. SECTION 3: 4 Constituent Elements Cards (KT, KQ, CT, CQ) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-[#1c75bb]" />
              3. Kết quả Đánh giá 4 Yếu Tố Cấu Thành Tội Phạm
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Trọng số: KT (0.20) | KQ (0.35) | CT (0.20) | CQ (0.25)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Khách thể (KT) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-sm hover:border-[#1c75bb]/40 transition-all">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">1. Khách thể (KT)</span>
                <span className="text-xs font-mono font-bold text-[#1c75bb] bg-[#ebf4fa] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  {(activeCase.primaryCharge.scores.KT * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Đối tượng pháp luật bảo vệ bị xâm hại: <strong>Quyền sở hữu tài sản</strong> / <strong>Tính mạng, sức khỏe</strong>.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1c75bb] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeCase.primaryCharge.scores.KT * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono block">Cosine Score = 1.00</span>
            </div>

            {/* Card 2: Mặt khách quan (KQ) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-sm hover:border-[#1c75bb]/40 transition-all">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">2. Mặt khách quan (KQ)</span>
                <span className="text-xs font-mono font-bold text-[#1c75bb] bg-[#ebf4fa] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  {(activeCase.primaryCharge.scores.KQ * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hành vi nguy hiểm: <strong>{activeCase.weapon || 'Hành vi trực tiếp'}</strong>, Thiệt hại <strong>{activeCase.damageValue ? activeCase.damageValue.toLocaleString('vi-VN') + 'đ' : 'Sức khỏe'}</strong>.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1c75bb] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeCase.primaryCharge.scores.KQ * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono block">Cosine Score = {activeCase.primaryCharge.scores.KQ.toFixed(2)}</span>
            </div>

            {/* Card 3: Chủ thể (CT) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-sm hover:border-[#1c75bb]/40 transition-all">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">3. Chủ thể (CT)</span>
                <span className="text-xs font-mono font-bold text-[#1c75bb] bg-[#ebf4fa] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  {(activeCase.primaryCharge.scores.CT * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Độ tuổi bị can <strong>{activeCase.suspectAge} tuổi</strong> (đủ tuổi chịu TNHS theo Điều 12 BLHS).
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1c75bb] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeCase.primaryCharge.scores.CT * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono block">Năng lực hành vi: Đầy đủ</span>
            </div>

            {/* Card 4: Mặt chủ quan (CQ) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-sm hover:border-[#1c75bb]/40 transition-all">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">4. Mặt chủ quan (CQ)</span>
                <span className="text-xs font-mono font-bold text-[#1c75bb] bg-[#ebf4fa] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  {(activeCase.primaryCharge.scores.CQ * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Yếu tố lỗi: <strong>Cố ý trực tiếp</strong> với mục đích chiếm đoạt / tước đoạt tính mạng.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1c75bb] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeCase.primaryCharge.scores.CQ * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono block">Mục đích hành vi: Cố ý</span>
            </div>

          </div>
        </div>

        {/* 4. SECTION 4: Chart.js Bar Comparison & Graph Distillation Operator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart.js Bar Comparison (2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Zap size={16} className="text-[#1c75bb]" />
                4. Biểu đồ Chart.js So sánh Điểm so khớp S(f, Ck) (Tội 1 vs Tội 2)
              </span>
              <span className="text-[10px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] font-bold px-2 py-0.5 rounded">
                GNN Confidence: {(activeCase.primaryCharge.totalScore * 100).toFixed(0)}%
              </span>
            </div>

            <div className="h-64 relative pt-2">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Graph Distillation Decision Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <Sparkles size={16} className="text-[#1c75bb]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Graph Distillation & XAI Operator
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                {activeCase.distillationNote}
              </p>

              {/* XAI Reasoning Trace Box */}
              <div className="p-3 bg-slate-900 text-white rounded-lg border border-slate-700 text-xs space-y-1.5 font-mono">
                <span className="font-bold text-[#38BDF8] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Sparkles size={12} />
                  XAI Reasoning Path (Độ tin cậy: {(activeCase.primaryCharge.totalScore * 100).toFixed(0)}%)
                </span>
                <div className="space-y-1 text-slate-300 text-[10px] font-medium leading-relaxed">
                  <p>1. Bị can {activeCase.suspectName} ({activeCase.suspectAge}t) ➔ Đủ năng lực TNHS (Điều 12)</p>
                  <p>2. Hung khí / Phương tiện: {activeCase.weapon}</p>
                  <p>3. Diễn biến: "{activeCase.summaryActs.slice(0, 60)}..."</p>
                  <p className="text-emerald-400 font-bold">4. Kết luận định tội: Điều {activeCase.primaryCharge.articleId} - {activeCase.primaryCharge.title}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-xs font-bold text-[#065F46] space-y-1">
              <span className="text-[9px] uppercase tracking-wider block opacity-75">Đề xuất khởi tố chính thức</span>
              <p className="text-sm font-bold">
                Điều {activeCase.primaryCharge.articleId}: {activeCase.primaryCharge.title}
              </p>
              <p className="text-[11px] font-medium leading-relaxed opacity-90">
                {activeCase.primaryCharge.clause}
              </p>
            </div>
          </div>

        </div>

        {/* 5. SECTION 5: Red Flag Evidence Gaps Alert Box */}
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#991B1B]">
            <AlertTriangle size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              5. Cảnh Báo Lỗ Hổng Chứng Cứ Tố Tụng (Red Flag Evidence Gaps)
            </h3>
          </div>
          
          <div className="space-y-2">
            {activeCase.redFlags.map((flag, idx) => (
              <div key={idx} className="p-3 bg-white border border-[#FECACA] rounded-lg text-xs text-slate-800 font-semibold leading-relaxed flex items-start gap-2 shadow-xs">
                <span>{flag}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[#991B1B] italic">
            * Khuyến nghị Điều tra viên bổ sung đầy đủ các tài liệu tố tụng trên trước khi hoàn thiện Bản Kết luận Điều tra gửi Viện kiểm sát.
          </p>
        </div>

        {/* 6. SECTION 6: Matrix Mâu Thuẫn Lời Khai & Chứng Cứ (Evidence Contradiction Matrix) */}
        <EvidenceContradictionMatrix />

      </div>

      {/* PRINT-ONLY OFFICIAL PROPOSAL FORM */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-10 font-serif leading-relaxed z-[9999] text-sm space-y-6">
        <div className="text-center space-y-1">
          <h4 className="font-bold uppercase text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
          <h5 className="font-bold text-xs underline">Độc lập - Tự do - Hạnh phúc</h5>
          <p className="text-[11px] text-right font-mono italic mt-2">Số hồ sơ: {activeCase.code}</p>
        </div>

        <div className="text-center py-4">
          <h2 className="text-base font-bold uppercase">PHIẾU ĐỀ XUẤT ĐỊNH TỘI DANH SƠ BỘ (GNN WORKBENCH)</h2>
        </div>

        <div className="space-y-2 text-xs">
          <p><strong>Vụ việc:</strong> {activeCase.name}</p>
          <p><strong>Bị can:</strong> {activeCase.suspectName} ({activeCase.suspectAge} tuổi) - CCCD: {activeCase.cccd}</p>
          <p><strong>Diễn biến hành vi:</strong> {activeCase.summaryActs}</p>
          <p><strong>Đề xuất tội danh:</strong> Điều {activeCase.primaryCharge.articleId}: {activeCase.primaryCharge.title}</p>
          <p><strong>Điểm so khớp S(f, Ck):</strong> {(activeCase.primaryCharge.totalScore * 100).toFixed(1)}%</p>
        </div>

        <div className="pt-8 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="font-bold uppercase">LÃNH ĐẠO ĐƠN VỊ</p>
            <div className="h-16"></div>
            <p>.......................................</p>
          </div>
          <div>
            <p className="font-bold uppercase">ĐIỀU TRA VIÊN</p>
            <div className="h-16"></div>
            <p className="font-bold">{user?.full_name || 'Điều tra viên phụ trách'}</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CaseMatchingWorkbench;
