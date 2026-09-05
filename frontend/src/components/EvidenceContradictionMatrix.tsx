import React, { useState } from 'react';
import { 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  ArrowRightLeft,
  UserCheck
} from 'lucide-react';

export interface ContradictionItem {
  id: string;
  category: 'VAI_TRÒ_ĐỒNG_PHẠM' | 'THỜI_GIAN_NGOẠI_PHẠM' | 'HUNG_KHÍ_GÂY_ÁN' | 'TÀI_SẢN_THIỆT_HẠI';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  source_a: string;
  source_b: string;
  investigation_advice: string;
}

interface EvidenceContradictionMatrixProps {
  contradictions?: ContradictionItem[];
}

export const EvidenceContradictionMatrix: React.FC<EvidenceContradictionMatrixProps> = ({
  contradictions = [
    {
      id: 'contra_role_1',
      category: 'VAI_TRÒ_ĐỒNG_PHẠM',
      severity: 'CRITICAL',
      title: 'Mâu thuẫn vai trò chủ mưu / thực hành giữa các bị can',
      source_a: 'Bị can Nguyễn Văn A: Khai báo không trực tiếp lên kế hoạch, chỉ đi theo hỗ trợ cảnh giới.',
      source_b: 'Bị can Trần Văn B: Khai báo Nguyễn Văn A là người chủ mưu bàn bạc, rủ rê và chuẩn bị hung khí từ trước.',
      investigation_advice: 'Yêu cầu tổ chức hỏi cung đối chất trực tiếp giữa 02 bị can theo Điều 189 BLTTHS 2015 để làm rõ ý thức chủ quan và vai trò chủ mưu.'
    },
    {
      id: 'contra_weapon_1',
      category: 'HUNG_KHÍ_GÂY_ÁN',
      severity: 'WARNING',
      title: 'Bất đồng về nguồn gốc và đặc điểm hung khí gây án',
      source_a: 'Bị can Nguyễn Văn A: Khai con dao bấm do Trần Văn B mua và mang theo trong người.',
      source_b: 'Bị can Trần Văn B: Khai con dao bấm có sẵn tại hiện trường tiệm vàng do A rút ra khống chế.',
      investigation_advice: 'Trưng cầu giám định dấu vết đường vân (vân tay) và đường chuyên thu DNA trên cán dao bấm thu giữ được tại hiện trường.'
    },
    {
      id: 'contra_alibi_1',
      category: 'THỜI_GIAN_NGOẠI_PHẠM',
      severity: 'INFO',
      title: 'Xác minh mốc thời gian xuất hiện tại địa bàn xảy ra vụ án',
      source_a: 'Lời khai bị can: Khai báo từ 20h00 đến 22h00 ở nhà xem tivi cùng người thân tại xã X.',
      source_b: 'Trích xuất Camera an ninh: Ghi nhận xe máy BKS 29-X1... xuất hiện tại ngã tư cách hiện trường 200m lúc 20h45.',
      investigation_advice: 'Bổ sung trích xuất dữ liệu định vị cột sóng viễn thông (BTS) của số điện thoại bị can và lấy lời khai xác minh người thân.'
    }
  ]
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'VAI_TRÒ' | 'HUNG_KHÍ'>('ALL');

  const filteredItems = contradictions.filter(item => {
    if (activeTab === 'CRITICAL') return item.severity === 'CRITICAL';
    if (activeTab === 'VAI_TRÒ') return item.category === 'VAI_TRÒ_ĐỒNG_PHẠM';
    if (activeTab === 'HUNG_KHÍ') return item.category === 'HUNG_KHÍ_GÂY_ÁN';
    return true;
  });

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <ArrowRightLeft size={18} className="text-[#EF4444]" />
            Ma Trận Phân Tích Mâu Thuẫn Lời Khai & Lỗ Hổng Chứng Cứ
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Tự động đối sánh lời khai Bị can ➔ Nạn nhân ➔ Nhân chứng để phát hiện chi tiết mâu thuẫn cần đối chất.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'ALL' ? 'bg-white text-[#1c75bb] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({contradictions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CRITICAL')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'CRITICAL' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mâu thuẫn nghiêm trọng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VAI_TRÒ')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'VAI_TRÒ' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vai trò đồng phạm
          </button>
        </div>
      </div>

      {/* Contradictions List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isCritical = item.severity === 'CRITICAL';
          const isWarning = item.severity === 'WARNING';

          return (
            <div 
              key={item.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isCritical 
                  ? 'bg-red-50/60 border-red-200' 
                  : isWarning 
                  ? 'bg-amber-50/60 border-amber-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Item Title & Badge Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  {isCritical ? (
                    <AlertTriangle size={16} className="text-red-600 shrink-0" />
                  ) : isWarning ? (
                    <HelpCircle size={16} className="text-amber-600 shrink-0" />
                  ) : (
                    <UserCheck size={16} className="text-blue-600 shrink-0" />
                  )}
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[9px]">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                    isCritical ? 'bg-red-600 text-white' : isWarning ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {item.severity}
                  </span>
                  <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Side-by-side Evidence Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Source A Card */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block border-b border-slate-100 pb-1">
                    📌 Nguồn Chứng cứ / Lời khai 1
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed mt-1">
                    {item.source_a}
                  </p>
                </div>

                {/* Source B Card */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block border-b border-slate-100 pb-1">
                    📌 Nguồn Chứng cứ / Lời khai 2
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed mt-1">
                    {item.source_b}
                  </p>
                </div>
              </div>

              {/* Investigation Advice Banner */}
              <div className="p-3 bg-white/90 border border-slate-300 rounded-lg text-xs flex items-start gap-2 text-slate-800 font-semibold shadow-xs">
                <Sparkles size={16} className="text-[#1c75bb] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#1c75bb] font-mono font-bold uppercase block tracking-wider">
                    Khuyến nghị Nghiệp vụ Điều tra viên (Investigation Action Plan)
                  </span>
                  <p className="mt-0.5 leading-relaxed text-slate-800 font-medium">
                    {item.investigation_advice}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
