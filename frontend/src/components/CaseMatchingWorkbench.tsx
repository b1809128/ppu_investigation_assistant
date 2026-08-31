import React, { useState, useEffect } from 'react';
import { useCasesStore } from '../store/cases';
import { useAuthStore } from '../store/auth';
import { MaskedText } from './MaskedText';
import { 
  Scale, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Info,
  AlertCircle
} from 'lucide-react';
import api, { showToast } from '../services/api';
import { formatDateToDDMMYYYY } from '../utils/date';


interface CaseMatchingWorkbenchProps {
  caseId: number;
  onBack?: () => void;
}

export const CaseMatchingWorkbench: React.FC<CaseMatchingWorkbenchProps> = ({ 
  caseId,
  onBack
}) => {
  const user = useAuthStore((state) => state.user);
  const { currentEvaluation, evaluateCase, isLoading, error } = useCasesStore();
  const [selectedSuspectId, setSelectedSuspectId] = useState<number | null>(null);
  const [manualKeywords, setManualKeywords] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [xaiModalSuggestion, setXaiModalSuggestion] = useState<any>(null);

  // Load evaluation from API via store
  useEffect(() => {
    if (caseId) {
      evaluateCase(caseId);
    }
  }, [caseId]);

  // Automatically select the first suspect when evaluations load
  useEffect(() => {
    if (currentEvaluation?.evaluations && currentEvaluation.evaluations.length > 0) {
      setSelectedSuspectId(currentEvaluation.evaluations[0].suspect_id);
    } else {
      setSelectedSuspectId(null);
    }
  }, [currentEvaluation]);

  // Find the selected suspect's evaluation details
  const selectedSuspectEval = React.useMemo(() => {
    if (!currentEvaluation?.evaluations || !selectedSuspectId) return null;
    return currentEvaluation.evaluations.find(
      (e: any) => e.suspect_id === selectedSuspectId
    ) || null;
  }, [currentEvaluation, selectedSuspectId]);

  // Calculate age color code
  const getAgeColor = (age: number | null) => {
    if (age === null) return 'gray';
    if (age >= 16) return 'emerald';
    if (age >= 14 && age < 16) return 'amber';
    return 'red';
  };

  // Run a manual Print window for the official Vietnamese Preliminary Investigation Proposal
  const handlePrintReport = () => {
    if (!currentEvaluation || !selectedSuspectEval) {
      showToast('Không có đủ dữ liệu để in phiếu đề xuất.', 'warning');
      return;
    }
    
    // Log the print action for audit log trail
    api.post('/api/audit', {
      action: 'PRINT_PROPOSAL',
      resource_type: 'CASE_FILE',
      resource_id: caseId,
      details: `In phiếu đề xuất định tội sơ bộ cho bị can ${selectedSuspectEval.full_name} vụ án ID ${caseId}`
    }).catch(err => console.error('Lỗi ghi audit log print:', err));

    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-8 w-8 text-[#1c75bb]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Đang chạy Động cơ Đối chiếu Luật...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md p-6 bg-red-950/40 border border-red-900/60 rounded-lg text-center space-y-4 shadow-lg">
          <AlertCircle className="mx-auto text-red-500" size={32} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lỗi chạy đối chiếu định tội</h3>
          <p className="text-xs text-red-100/90 leading-relaxed">{error}</p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-navy-950 hover:bg-navy-900 border border-slate-800 text-xs font-semibold text-slate-350 rounded-lg cursor-pointer"
            >
              Quay lại
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentEvaluation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
        <Scale size={48} className="opacity-25 mb-4" />
        <p className="text-sm">Vui lòng chọn vụ án để tiến hành chạy đối chiếu định tội</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden p-6 gap-6 h-[calc(100vh-73px)] relative">
      {/* LEFT COLUMN (35%): Case overview and select suspect */}
      <div className="w-[35%] shrink-0 h-full flex flex-col bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm no-print">
        
        {/* Case Heading */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-[#EF4444] uppercase tracking-wider font-mono bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded-lg shadow-sm">
              Thụ lý quyết định: {currentEvaluation.case_code}
            </span>
            <h3 className="text-sm font-bold text-slate-800 truncate mt-2 pl-1">
              {currentEvaluation.case_name}
            </h3>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-bold bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer shrink-0 ml-2 shadow-sm transition-colors"
            >
              Quay lại
            </button>
          )}
        </div>

        {/* Suspect Selector Dropdown */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/50">
          <label htmlFor="suspect-select" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Chọn bị can thụ lý cần phân tích *
          </label>
          <div className="relative">
            <select
              id="suspect-select"
              value={selectedSuspectId || ''}
              onChange={(e) => setSelectedSuspectId(Number(e.target.value))}
              className="w-full bg-white border border-[#E2E8F0] focus:border-[#1c75bb] focus:ring-1 focus:ring-[#1c75bb] text-xs font-bold text-slate-800 rounded-lg p-2.5 focus:outline-none cursor-pointer shadow-sm transition-colors"
            >
              {currentEvaluation.evaluations.length === 0 ? (
                <option value="">(Không có đối tượng liên quan)</option>
              ) : (
                currentEvaluation.evaluations.map((e: any) => (
                  <option key={e.suspect_id} value={e.suspect_id}>
                    {e.full_name} ({e.age !== null ? `${e.age} tuổi` : 'Không rõ ngày sinh'})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Case & Suspect Summary Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-700">
          
          {/* General Case Info */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Thông tin địa bàn & Thiệt hại
            </span>
            <div className="grid grid-cols-2 gap-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 shadow-sm">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Thời gian xảy ra</span>
                <span className="font-mono text-slate-800 font-bold">
                  {formatDateToDDMMYYYY(currentEvaluation.incident_date)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Giá trị thiệt hại</span>
                <span className="text-[#EF4444] font-mono font-bold">
                  {currentEvaluation.damage_value ? `${currentEvaluation.damage_value.toLocaleString('vi-VN')} VND` : '0 VND'}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Suspect Info */}
          {selectedSuspectEval ? (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Thông tin bị can được chọn
              </span>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 space-y-2.5 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                  <span className="font-bold text-slate-900 text-sm">
                    <MaskedText text={selectedSuspectEval.full_name} type="name" />
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border bg-[#ebf4fa] border-[#BFDBFE] text-[#1c75bb] shadow-sm">
                    {selectedSuspectEval.age !== null ? `${selectedSuspectEval.age} tuổi` : 'Không rõ'}
                  </span>
                </div>
                
                <div className="text-[11px] leading-relaxed">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Ngày sinh</span>
                  <span className="font-mono text-slate-800 font-bold">{selectedSuspectEval.dob || 'Chưa rõ'}</span>
                </div>

                <div className="text-[11px] border-t border-[#E2E8F0] pt-2 leading-relaxed">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Tiền án tiền sự / Tình trạng</span>
                  <span className="text-slate-800 font-semibold block bg-white p-2.5 rounded-lg border border-[#E2E8F0] mt-1 max-h-24 overflow-y-auto font-mono text-[10px]">
                    {selectedSuspectEval.recidivism?.message || 'Không ghi nhận tiền án tiền sự.'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 font-bold">Hãy chọn bị can để xem chi tiết</div>
          )}

          {/* Acts acts details */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Tóm tắt diễn biến hành vi vi phạm
            </span>
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg leading-relaxed text-slate-700 font-serif text-[11px] whitespace-pre-line max-h-60 overflow-y-auto shadow-sm">
              {currentEvaluation.summary_acts || 'Chưa cập nhật hành vi vi phạm.'}
            </div>
          </div>

        </div>

        {/* Print Action Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex gap-2">
          <button
            type="button"
            onClick={handlePrintReport}
            className="w-full flex items-center justify-center gap-2 bg-[#EF4444] hover:bg-[#991B1B] text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer transition-all active:scale-95 duration-100 shadow-sm"
          >
            <Printer size={14} />
            <span>In Phiếu Đề Xuất Khởi Tố</span>
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN (65%): Evaluation results from Rule Engine */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg flex flex-col overflow-hidden shadow-sm no-print">
        
        {/* Right Header */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Scale size={16} className="text-[#1c75bb] animate-pulse" />
            Kết quả Phân tích từ Động cơ Định tội Luật
          </h3>
          <span className="text-[9px] bg-[#ebf4fa] text-[#1c75bb] border border-[#BFDBFE] px-2 py-0.5 rounded-lg font-mono font-bold uppercase">
            Auto Engine Active
          </span>
        </div>

        {/* Warnings & Suggestions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedSuspectEval ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Warnings Panel (Liability & Recidivism side-by-side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Article 12: Age liability warning */}
                {(() => {
                  const ageColor = getAgeColor(selectedSuspectEval.age);
                  return (
                    <div className={`p-4 rounded-lg border ${
                      ageColor === 'red' 
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]' 
                        : ageColor === 'amber'
                        ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                        : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                    } space-y-2 shadow-sm font-semibold`}>
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                        <ShieldAlert size={15} />
                        <span>Cảnh báo Điều 12 (Độ tuổi TNHS)</span>
                      </div>
                      <p className="text-xs font-bold font-mono">
                        {selectedSuspectEval.age_status}
                      </p>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {selectedSuspectEval.age_details}
                      </p>
                    </div>
                  );
                })()}

                {/* 2. Article 53: Recidivism warning */}
                <div className={`p-4 rounded-lg border ${
                  selectedSuspectEval.recidivism?.has_warning 
                    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]' 
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-700'
                } space-y-2 shadow-sm font-semibold`}>
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={15} />
                    <span>Cảnh báo Điều 53 (Tái phạm)</span>
                  </div>
                  <p className="text-xs font-bold">
                    {selectedSuspectEval.recidivism?.has_warning 
                      ? 'PHÁT HIỆN DẤU HIỆU TÁI PHẠM/TÁI PHẠM NGUY HIỂM' 
                      : 'Không ghi nhận dấu hiệu tái phạm hình sự.'}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {selectedSuspectEval.recidivism?.guideline || 'Đối tượng chưa có tiền án được ghi nhận. Tiếp tục xác minh xác thực nhân thân.'}
                  </p>
                </div>

              </div>

              {/* Manual Keyword Override Form */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-sm no-print">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Định khung thủ công & Tinh chỉnh Từ khóa
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isManualMode}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsManualMode(checked);
                        if (!checked) {
                          // Re-run standard matching using summary acts
                          evaluateCase(caseId);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1c75bb]"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-600">Kích hoạt</span>
                  </label>
                </div>
                
                {isManualMode && (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-slate-500 italic">
                      * Nhập các từ khóa/cụm từ hành vi (cách nhau bằng dấu phẩy) hoặc chọn từ khóa chính từ vụ việc để hệ thống chạy thuật toán định khung tự động dựa trên từ khóa này.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualKeywords}
                        onChange={(e) => setManualKeywords(e.target.value)}
                        placeholder="Ví dụ: cạy cửa, lấy trộm xe máy, trộm cắp tài sản..."
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-[#1c75bb] focus:ring-1 focus:ring-[#1c75bb]"
                      />
                      <button
                        onClick={() => evaluateCase(caseId, manualKeywords)}
                        className="px-4 py-1.5 bg-[#1c75bb] hover:bg-[#155d95] text-white font-bold text-xs rounded-lg shadow transition duration-150 shrink-0 cursor-pointer"
                      >
                        Chạy đối chiếu
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions List */}
              <div className="space-y-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Đề xuất tội danh & định khung tương ứng
                </span>

                {selectedSuspectEval.article_suggestions?.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#E2E8F0] bg-[#F8FAFC] rounded-lg text-center text-slate-500 text-xs space-y-2 font-semibold">
                    <Info className="mx-auto text-slate-400" size={24} />
                    <p>Không tìm thấy điều luật tương ứng khớp với từ khóa hành vi trong tóm tắt vụ việc.</p>
                    <p className="text-[10px] text-slate-400">Hãy cập nhật từ khóa hành vi hoặc bổ sung diễn biến vụ việc chi tiết hơn.</p>
                  </div>
                ) : (
                  selectedSuspectEval.article_suggestions.map((suggestion: any) => {
                    const isLiable = suggestion.suspect_is_liable;
                    return (
                      <div 
                        key={suggestion.article_id}
                        className={`border rounded-lg p-5 space-y-4 bg-white shadow-sm relative overflow-hidden ${
                          isLiable 
                            ? 'border-[#E2E8F0] hover:border-slate-350 hover:shadow-md transition-all duration-200' 
                            : 'border-[#FECACA] opacity-75'
                        }`}
                      >
                        {/* Article Header */}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border tracking-wider shadow-sm ${
                              suggestion.severity === 'ĐẶC_BIỆT_NGHIÊM_TRỌNG'
                                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                                : suggestion.severity === 'RẤT_NGHIÊM_TRỌNG'
                                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                                : suggestion.severity === 'NGHIÊM_TRỌNG'
                                ? 'bg-[#ebf4fa] border-[#BFDBFE] text-[#1c75bb]'
                                : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                            }`}>
                              {suggestion.severity.replace(/_/g, ' ')}
                            </span>
                            
                            {suggestion.ai_evaluation && (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border tracking-wider shadow-sm ml-2 bg-blue-50 border-blue-200 text-blue-700">
                                Độ tin cậy: {Math.round(suggestion.ai_evaluation.confidence * 100)}%
                              </span>
                            )}
                            
                            <h4 className="text-sm font-bold text-slate-800 mt-2">
                              Điều {suggestion.article_id}: {suggestion.title}
                            </h4>
                          </div>

                          <div className="shrink-0 text-right no-print">
                            <span className="text-[9px] font-mono block text-slate-400 font-bold uppercase">Phương thức khớp</span>
                            {suggestion.ai_evaluation ? (
                              <div className="space-y-1 mt-0.5">
                                <span className="text-[10px] font-bold bg-gradient-to-r from-[#1c75bb] to-[#155d95] text-white px-2 py-0.5 rounded shadow-sm inline-block">
                                  AI: {suggestion.ai_evaluation.engine.replace("Hybrid (", "").replace(")", "")}
                                </span>
                                <button
                                  onClick={() => setXaiModalSuggestion(suggestion)}
                                  className="text-[9px] text-[#1c75bb] hover:text-[#155d95] font-bold underline block mt-1 hover:cursor-pointer w-full text-right"
                                >
                                  Xem Sơ Đồ GNN
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-[#1c75bb] font-mono block mt-0.5">
                                {currentEvaluation.matched_articles?.find((a: any) => a.article_id === suggestion.article_id)?.matched_keywords ? 'Động cơ đối chiếu' : 'Tội danh liên đới'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Clause analysis card based on damage */}
                        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5 shadow-sm">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-100 pb-1">
                            Định khung dựa trên Thiệt hại/Chiếm đoạt
                          </span>
                          <p className="text-xs text-slate-800 font-bold leading-relaxed font-sans">
                            {suggestion.clause_details}
                          </p>
                          {suggestion.damage_warning && (
                            <p className="text-[10px] text-[#EF4444] font-mono font-bold leading-relaxed">
                              * Lưu ý: {suggestion.damage_warning}
                            </p>
                          )}
                        </div>

                        {/* Age-based liability check for this specific article */}
                        <div className={`p-3 rounded-lg flex items-start gap-2.5 text-xs font-semibold ${
                          isLiable 
                            ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]' 
                            : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                        }`}>
                          {isLiable ? (
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                          ) : (
                            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                          )}
                          <div className="leading-relaxed">
                            <span className="font-bold uppercase tracking-wider text-[9px] block mb-0.5">
                              Đánh giá năng lực chịu hình sự (Điều 12 vs Điều {suggestion.article_id})
                            </span>
                            <span>{suggestion.liability_note}</span>
                          </div>
                        </div>

                        {/* Keyword correlates */}
                        {(() => {
                          const originalMatched = currentEvaluation.matched_articles?.find(
                            (a: any) => a.article_id === suggestion.article_id
                          );
                          if (!originalMatched?.matched_keywords) return null;
                          return (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                                Các từ khóa hành vi trùng khớp thực tế
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {originalMatched.matched_keywords.map((kw: string, i: number) => (
                                  <span 
                                    key={i} 
                                    className="px-2 py-0.5 rounded-lg bg-[#F8FAFC] text-[10px] font-mono text-slate-700 border border-[#E2E8F0] shadow-sm"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* GNN/CNN AI Explanation Path (XAI) */}
                        {suggestion.ai_evaluation && suggestion.ai_evaluation.xai_path && (
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 shadow-sm">
                            <span className="text-[9px] text-[#155d95] font-bold uppercase tracking-wider block border-b border-slate-200 pb-1">
                              Giải thích cơ chế AI (Explainable AI Path)
                            </span>
                            <p className="text-[11px] text-slate-600 italic leading-relaxed">
                              {suggestion.ai_evaluation.xai_explanation}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {suggestion.ai_evaluation.xai_path.nodes.map((node: string, index: number) => {
                                const edge = suggestion.ai_evaluation.xai_path.edges[index];
                                return (
                                  <React.Fragment key={index}>
                                    <span className="px-2 py-1 rounded bg-white text-[10px] font-semibold text-slate-800 border border-slate-200 shadow-sm">
                                      {node}
                                    </span>
                                    {index < suggestion.ai_evaluation.xai_path.nodes.length - 1 && (
                                      <span className="text-slate-400 text-xs font-bold select-none">
                                        ──[{edge ? edge.split("-[")[1].split("]->")[0] : "KẾT_NỐI"}]──&gt;
                                      </span>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 font-semibold">
              <User size={48} className="opacity-25 mb-3 text-slate-400 animate-pulse" />
              <p className="text-sm">Hãy tạo bị can và chạy đối chiếu vụ án</p>
            </div>
          )}
        </div>

      </div>

      {/* PRINT-ONLY SECTION (Hidden on screen via TailWind utility, displayed on window.print()) */}
      {currentEvaluation && selectedSuspectEval && (
        <div className="hidden print:block absolute inset-0 bg-white text-black p-10 font-serif leading-relaxed z-[9999] overflow-visible text-sm space-y-6">
          
          {/* Official Vietnam Police Document Header */}
          <div className="text-center space-y-1">
            <h4 className="font-bold uppercase text-xs tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
            <h5 className="font-bold text-xs underline decoration-solid">Độc lập - Tự do - Hạnh phúc</h5>
            <div className="h-2"></div>
            <p className="text-[11px] text-right font-mono italic">Mã số hồ sơ: {currentEvaluation.case_code}</p>
            <p className="text-[11px] text-right italic">Hà Nội, Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
          </div>

          <div className="text-center py-4">
            <h2 className="text-lg font-bold uppercase tracking-wide">PHIẾU ĐỀ XUẤT ĐỊNH TỘI DANH VÀ KHỞI TỐ SƠ BỘ</h2>
            <p className="text-xs italic">(Hệ thống Trợ lý Điều tra & Đối chiếu BLHS - Bộ phận Công nghệ LAN Nội bộ)</p>
          </div>

          {/* 1. Case details */}
          <div className="space-y-2 border-b border-black pb-4">
            <h3 className="font-bold text-sm uppercase">I. Thông Tin Chung Vụ Án</h3>
            <table className="w-full text-xs text-left border-collapse">
              <tbody>
                <tr>
                  <td className="font-bold py-1 w-40">Tên vụ việc:</td>
                  <td className="py-1">{currentEvaluation.case_name}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Quyết định thụ lý số:</td>
                  <td className="py-1 font-mono">{currentEvaluation.case_code}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Thời gian xảy ra:</td>
                  <td className="py-1">{formatDateToDDMMYYYY(currentEvaluation.incident_date)}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Địa điểm xảy ra:</td>
                  <td className="py-1">{currentEvaluation.location || 'Chưa rõ'}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Giá trị tài sản thiệt hại:</td>
                  <td className="py-1 font-bold">{currentEvaluation.damage_value ? `${currentEvaluation.damage_value.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Suspect details */}
          <div className="space-y-2 border-b border-black pb-4">
            <h3 className="font-bold text-sm uppercase">II. Thông Tin Nhân Thân Bị Can Đề Xuất</h3>
            <table className="w-full text-xs text-left border-collapse">
              <tbody>
                <tr>
                  <td className="font-bold py-1 w-40">Họ và tên bị can:</td>
                  <td className="py-1 font-bold">{selectedSuspectEval.full_name}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Ngày sinh:</td>
                  <td className="py-1 font-mono">{selectedSuspectEval.dob || 'Chưa rõ'}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Tuổi thực tế khi gây án:</td>
                  <td className="py-1 font-bold">{selectedSuspectEval.age !== null ? `${selectedSuspectEval.age} tuổi` : 'Chưa rõ'}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Tiền án, tiền sự:</td>
                  <td className="py-1">{selectedSuspectEval.recidivism?.message || 'Không ghi nhận tiền án tiền sự.'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. Rule Engine Analysis */}
          <div className="space-y-3 border-b border-black pb-4">
            <h3 className="font-bold text-sm uppercase">III. Căn Cứ Pháp Lý & Kết Quả Đối Chiếu</h3>
            
            <div className="space-y-2">
              <p className="text-xs font-bold underline">1. Đánh giá độ tuổi chịu TNHS (Điều 12 BLHS):</p>
              <p className="text-xs italic pl-4 leading-relaxed">{selectedSuspectEval.age_details}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold underline">2. Đề xuất điều khoản khởi tố hình sự:</p>
              {selectedSuspectEval.article_suggestions?.length === 0 ? (
                <p className="text-xs italic pl-4">Chưa có điều luật đề xuất phù hợp.</p>
              ) : (
                selectedSuspectEval.article_suggestions.map((suggestion: any, i: number) => (
                  <div key={suggestion.article_id} className="pl-4 space-y-1.5">
                    <p className="text-xs font-bold">
                      {i + 1}. Điều {suggestion.article_id}: {suggestion.title} ({suggestion.severity.replace(/_/g, ' ')})
                      {suggestion.ai_evaluation && ` [AI Đề xuất - Độ tin cậy: ${Math.round(suggestion.ai_evaluation.confidence * 100)}%]`}
                    </p>
                    <p className="text-xs leading-relaxed pl-3 text-justify">
                      - <strong>Định khung:</strong> {suggestion.clause_details}
                    </p>
                    <p className="text-xs leading-relaxed pl-3 text-justify">
                      - <strong>Năng lực hành vi:</strong> {suggestion.liability_note}
                    </p>
                    {suggestion.ai_evaluation && (
                      <p className="text-xs leading-relaxed pl-3 text-justify italic">
                        - <strong>Giải thích AI:</strong> {suggestion.ai_evaluation.xai_explanation} 
                        {suggestion.ai_evaluation.xai_path && ` (Đồ thị thực thể: ${suggestion.ai_evaluation.xai_path.nodes.join(" ──> ")})`}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 text-center text-xs">
            <div className="space-y-1">
              <p className="font-bold uppercase">LÃNH ĐẠO CƠ QUAN ĐIỀU TRA</p>
              <p className="text-[10px] italic">(Ký, ghi rõ họ tên và đóng dấu mật)</p>
              <div className="h-20"></div>
              <p className="text-slate-400">....................................................</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-bold uppercase">ĐIỀU TRA VIÊN THỤ LÝ</p>
              <p className="text-[10px] italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20"></div>
              <p className="font-bold">{user?.full_name || 'Điều tra viên phụ trách'}</p>
            </div>
          </div>

        </div>
      )}

      {/* Visual Graph Modal */}
      {xaiModalSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col m-4 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1c75bb] to-[#155d95] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Scale size={20} />
                <h3 className="font-bold text-base">
                  Sơ Đồ Phân Tích Định Tội Danh (Mạng Nơ-ron Đồ thị - GNN)
                </h3>
              </div>
              <button 
                onClick={() => setXaiModalSuggestion(null)}
                className="text-white hover:text-slate-200 focus:outline-none text-lg font-bold hover:cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-xs leading-relaxed">
                <strong>Mô tả cơ chế đối chiếu:</strong> Sơ đồ dưới đây hiển thị mối liên kết giữa <strong>Đồ thị vụ việc thực tế (Case Graph)</strong> ở bên trái và <strong>Đồ thị luật pháp (Legal Ontology Graph)</strong> ở bên phải, dựa trên kết quả phân tích lan truyền thông tin của mạng Graph Attention Network (GAT) để đối sánh yếu tố cấu thành tội danh.
              </div>

              {/* Visual Graph Schema using SVG */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
                  Đồ thị so khớp thực thể và cấu thành
                </span>
                
                <div className="w-full overflow-x-auto py-2">
                  <div className="min-w-[700px] relative h-[220px] select-none flex justify-between items-center px-4 font-sans">
                    
                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 10 5 L 0 8 z" fill="#94A3B8" />
                        </marker>
                        <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 10 5 L 0 8 z" fill="#1c75bb" />
                        </marker>
                      </defs>
                      
                      {/* Case Graph connections */}
                      <path d="M 160 50 L 160 110" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <path d="M 160 170 L 160 110" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      
                      {/* Cross Graph Match (Case Graph action -> Legal Graph constituent element) */}
                      <path d="M 230 110 L 370 110" stroke="#1c75bb" strokeWidth="2.5" markerEnd="url(#arrow-blue)" />
                      
                      {/* Legal Graph connections */}
                      <path d="M 470 110 L 570 110" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />
                      <path d="M 670 110 L 750 110" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />
                    </svg>
                    
                    {/* Column 1: Case Graph (Đồ thị vụ án thực tế) */}
                    <div className="flex flex-col justify-between h-full w-[210px] shrink-0" style={{ zIndex: 10 }}>
                      {/* Suspect Node */}
                      <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-center shadow-sm">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Bị can (Suspect)</span>
                        <span className="text-xs font-bold text-slate-800">{selectedSuspectEval?.full_name ?? 'Bị can'}</span>
                        <span className="text-[10px] block text-slate-500 mt-0.5">
                          Tuổi: {selectedSuspectEval?.age ?? 'Không rõ'} ({selectedSuspectEval?.age_status?.split('. ')[0] ?? 'Chưa xác định'})
                        </span>
                      </div>
                      
                      {/* Action Node */}
                      <div className="bg-blue-50 border-2 border-[#1c75bb] rounded-lg p-2.5 text-center shadow-md">
                        <span className="text-[8px] text-[#1c75bb] font-bold uppercase tracking-wider block">Hành vi (Action)</span>
                        <span className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                          {xaiModalSuggestion.ai_evaluation?.xai_path?.nodes[1] || 'Hành vi trong vụ việc'}
                        </span>
                      </div>
                      
                      {/* Asset Node */}
                      <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-center shadow-sm">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Tài sản (Asset)</span>
                        <span className="text-xs font-bold text-slate-800">
                          {currentEvaluation.case_name?.toLowerCase().includes("xe") ? "Xe máy / Phương tiện" : "Tài sản bị xâm hại"}
                        </span>
                        <span className="text-[10px] block text-green-600 font-bold mt-0.5">
                          {currentEvaluation.damage_value ? currentEvaluation.damage_value.toLocaleString("vi-VN") + " VNĐ" : "Chưa xác định trị giá"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Column 2: Legal Crime Element (Dấu hiệu cấu thành pháp lý) */}
                    <div className="w-[190px] shrink-0" style={{ zIndex: 10 }}>
                      <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-3 text-center shadow-md">
                        <span className="text-[8px] text-[#D97706] font-bold uppercase tracking-wider block">Yếu tố cấu thành (Element)</span>
                        <span className="text-xs font-bold text-slate-800 block mt-1 leading-snug">
                          {xaiModalSuggestion.ai_evaluation?.xai_path?.nodes[2] || 'Dấu hiệu cấu thành'}
                        </span>
                        <span className="text-[9px] bg-[#FCD34D] text-[#78350F] font-bold px-1.5 py-0.5 rounded-full inline-block mt-2">
                          Mặt khách quan
                        </span>
                      </div>
                    </div>
                    
                    {/* Column 3: Legal Clause (Khoản áp dụng (Clause) */}
                    <div className="w-[200px] shrink-0" style={{ zIndex: 10 }}>
                      <div className="bg-[#ECFDF5] border border-[#10B981] rounded-lg p-3 text-center shadow-md">
                        <span className="text-[8px] text-[#059669] font-bold uppercase tracking-wider block">Khoản áp dụng (Clause)</span>
                        <span className="text-xs font-bold text-slate-800 block mt-1 font-sans">
                          Khoản {xaiModalSuggestion.applicable_clause}
                        </span>
                        <span className="text-[9.5px] block text-slate-500 mt-1 leading-tight line-clamp-2">
                          {xaiModalSuggestion.clause_details.split(" (")[0]}
                        </span>
                      </div>
                    </div>
                    
                    {/* Column 4: Legal Article (Điều luật đề xuất) */}
                    <div className="w-[170px] shrink-0" style={{ zIndex: 10 }}>
                      <div className="bg-gradient-to-r from-[#1c75bb] to-[#155d95] text-white rounded-lg p-3 text-center shadow-lg border border-blue-600">
                        <span className="text-[8px] opacity-85 font-bold uppercase tracking-wider block">Điều luật (Article)</span>
                        <span className="text-xs font-bold block mt-1 leading-tight">
                          Điều {xaiModalSuggestion.article_id}
                        </span>
                        <span className="text-[10px] opacity-90 block mt-1.5 leading-snug line-clamp-2">
                          {xaiModalSuggestion.title}
                        </span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b pb-2">
                  Chi tiết định khung & phân tích dấu hiệu pháp lý
                </span>
                
                <table className="w-full text-xs text-slate-700 leading-relaxed">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 font-bold w-[180px] shrink-0 text-slate-500">Tội danh đề xuất:</td>
                      <td className="py-2.5 font-bold text-[#1c75bb]">
                        Điều {xaiModalSuggestion.article_id}: {xaiModalSuggestion.title}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 font-bold text-slate-500">Phân định khung hình phạt:</td>
                      <td className="py-2.5 font-semibold text-slate-800">
                        {xaiModalSuggestion.clause_details}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 font-bold text-slate-500">Dấu hiệu hành vi khớp:</td>
                      <td className="py-2.5 text-slate-800 font-medium">
                        {xaiModalSuggestion.ai_evaluation?.xai_explanation}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 font-bold text-slate-500">Năng lực hành vi bị can:</td>
                      <td className="py-2.5 text-slate-800">
                        {xaiModalSuggestion.liability_note}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-slate-500">Chuỗi GNN Embeddings:</td>
                      <td className="py-2.5 font-mono text-[10px] text-slate-500">
                        {xaiModalSuggestion.ai_evaluation?.xai_path?.nodes?.join(" ──> ") || "Không có đường dẫn đồ thị."}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-right shrink-0">
              <button 
                onClick={() => setXaiModalSuggestion(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold text-xs rounded-lg shadow-sm transition duration-150 hover:cursor-pointer"
              >
                Đóng sơ đồ
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};
export default CaseMatchingWorkbench;
