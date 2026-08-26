import React, { useEffect, useState } from 'react';
import { useCasesStore } from '../store/cases';
import type { CaseFile } from '../store/cases';
import { useAuthStore } from '../store/auth';
import { CaseFileDetailView } from '../components/CaseFileDetailView';
import { 
  FolderLock, 
  FolderPlus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Coins, 
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';

interface CasesProps {
  onSelectEvaluate?: (caseId: number) => void;
}

export const Cases: React.FC<CasesProps> = ({ onSelectEvaluate }) => {
  const user = useAuthStore((state) => state.user);
  
  // Zustand store properties
  const {
    cases,
    currentCase,
    isLoading,
    error,
    fetchCases,
    fetchCaseById,
    createCase,
    updateCase,
    deleteCase,
    fetchSuspects
  } = useCasesStore();

  // Navigation states
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseFile | null>(null);

  // Form states - Case
  const [caseCode, setCaseCode] = useState('');
  const [caseName, setCaseName] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [summaryActs, setSummaryActs] = useState('');
  const [damageValue, setDamageValue] = useState('');
  const [caseStatus, setCaseStatus] = useState<'INVESTIGATING' | 'SUSPENDED' | 'CLOSED'>('INVESTIGATING');

  useEffect(() => {
    fetchCases();
  }, []);

  // Open Case Create/Edit Modal
  const handleOpenCaseModal = (c: CaseFile | null = null) => {
    if (c) {
      setEditingCase(c);
      setCaseCode(c.case_code);
      setCaseName(c.case_name);
      setIncidentDate(c.incident_date ? c.incident_date.substring(0, 10) : '');
      setLocation(c.location || '');
      setSummaryActs(c.summary_acts || '');
      setDamageValue(c.damage_value ? c.damage_value.toString() : '');
      setCaseStatus(c.status);
    } else {
      setEditingCase(null);
      setCaseCode('');
      setCaseName('');
      setIncidentDate('');
      setLocation('');
      setSummaryActs('');
      setDamageValue('');
      setCaseStatus('INVESTIGATING');
    }
    setShowCaseModal(true);
  };

  // Submit Case Form
  const handleCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseCode.trim() || !caseName.trim()) return;

    const damageFloat = damageValue ? parseFloat(damageValue) : null;
    const payload = {
      case_code: caseCode,
      case_name: caseName,
      incident_date: incidentDate || null,
      location: location || null,
      summary_acts: summaryActs || null,
      damage_value: damageFloat,
      status: caseStatus,
    };

    try {
      if (editingCase) {
        await updateCase(editingCase.id, payload);
      } else {
        await createCase(payload);
      }
      setShowCaseModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete Case
  const handleDeleteCase = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ vụ án này không? Mọi dữ liệu đi kèm sẽ bị xóa hoàn toàn.')) {
      try {
        await deleteCase(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Open Case Details
  const handleOpenCaseDetail = async (caseId: number) => {
    try {
      await fetchCaseById(caseId);
      await fetchSuspects(caseId);
      setViewMode('DETAIL');
    } catch (err) {
      console.error(err);
    }
  };

  const isLeadershipOrAdmin = user?.role === 'LEADERSHIP' || user?.role === 'ADMIN';

  return (
    <div className="flex-1 p-6 space-y-6">
      
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#991B1B] text-sm flex items-start gap-2.5 shadow-sm font-semibold">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {viewMode === 'LIST' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between no-print">
            <div>
              <h2 className="text-base font-bold tracking-wider text-slate-800 flex items-center gap-2">
                <FolderLock className="text-[#126DA6]" />
                DANH SÁCH QUẢN LÝ HỒ SƠ VỤ ÁN
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Hệ thống lưu trữ và tra cứu hồ sơ vụ việc, thông tin đối tượng liên quan đang thụ lý điều tra
              </p>
            </div>
            
            {/* Create Case Button */}
            {!isLeadershipOrAdmin && (
              <button
                type="button"
                onClick={() => handleOpenCaseModal()}
                className="flex items-center gap-2 bg-[#126DA6] hover:bg-[#1D4ED8] border border-[#126DA6] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <FolderPlus size={16} />
                <span>Thụ lý vụ án mới</span>
              </button>
            )}
          </div>

          {/* Cases Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-[#126DA6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center text-slate-500 shadow-sm">
              <FolderLock size={48} className="mx-auto mb-4 opacity-25 text-[#126DA6]" />
              <p className="text-sm font-semibold">Chưa có hồ sơ vụ án nào được thụ lý trong tài khoản của bạn</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleOpenCaseDetail(c.id)}
                  className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-lg p-5 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-[#126DA6] transition-colors duration-200" />
                  
                  <div>
                    <div className="flex items-start justify-between mb-3 pl-2">
                      <span className="text-[10px] font-bold text-[#126DA6] font-mono uppercase bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-lg shadow-sm">
                        {c.case_code || c.case_number}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                        c.status === 'CLOSED' 
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' 
                          : c.status === 'SUSPENDED'
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                          : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#126DA6]'
                      }`}>
                        {c.status === 'CLOSED' ? 'Đã đóng' : c.status === 'SUSPENDED' ? 'Tạm đình chỉ' : 'Đang điều tra'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 pl-2 group-hover:text-[#126DA6] line-clamp-1 mb-2">
                      {c.case_name || c.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 pl-2 line-clamp-2 leading-relaxed mb-4 font-sans">
                      {c.summary_acts || c.description || 'Chưa cập nhật tóm tắt diễn biến hành vi vi phạm pháp luật...'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 pl-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-4 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-450" />
                        {c.incident_date ? new Date(c.incident_date).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins size={12} className="text-slate-450" />
                        {c.damage_value ? `${c.damage_value.toLocaleString('vi-VN')} VND` : '0 VND'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 no-print" onClick={(e) => e.stopPropagation()}>
                      {!isLeadershipOrAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenCaseModal(c)}
                          className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#126DA6] hover:border-[#CBD5E1] text-slate-500 transition-colors duration-150 cursor-pointer shadow-sm"
                          title="Sửa hồ sơ"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      
                      {isLeadershipOrAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCase(c.id, e)}
                          className="p-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#991B1B] hover:text-[#EF4444] transition-colors duration-150 cursor-pointer shadow-sm"
                          title="Xóa hồ sơ (Lãnh đạo)"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-[#126DA6] transition-colors duration-150" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* DETAIL VIEW */
        currentCase && (
          <CaseFileDetailView 
            caseId={currentCase.id}
            onBack={() => setViewMode('LIST')}
            onSelectEvaluate={onSelectEvaluate || (() => {})}
          />
        )
      )}

      {/* CASE CREATION / EDIT MODAL */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowCaseModal(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <FolderPlus size={18} className="text-[#126DA6]" />
              {editingCase ? 'Cập nhật thông tin chi tiết hồ sơ vụ án' : 'Thụ lý hồ sơ vụ án hình sự mới'}
            </h3>

            <form onSubmit={handleCaseSubmit} className="space-y-4 text-xs text-slate-650 font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="case_code_input" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Số quyết định thụ lý / Mã số vụ việc *
                  </label>
                  <input
                    id="case_code_input"
                    type="text"
                    required
                    placeholder="Ví dụ: QĐ-01/2026/VPCQ"
                    value={caseCode}
                    onChange={(e) => setCaseCode(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="case_name_input" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Tên vụ án / Vụ việc hình sự *
                  </label>
                  <input
                    id="case_name_input"
                    type="text"
                    required
                    placeholder="Ví dụ: Vụ trộm cắp tài sản tại tiệm vàng Kim Phát"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="incident_date_input" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Thời điểm xảy ra vụ việc *
                  </label>
                  <input
                    id="incident_date_input"
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="location_input" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Địa bàn / Nơi xảy ra *
                  </label>
                  <input
                    id="location_input"
                    type="text"
                    required
                    placeholder="Ví dụ: Quận Hoàn Kiếm, Hà Nội"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="damage_value_input" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Giá trị thiệt hại định lượng (VND)
                  </label>
                  <input
                    id="damage_value_input"
                    type="number"
                    placeholder="Ví dụ: 120000000"
                    value={damageValue}
                    onChange={(e) => setDamageValue(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              {editingCase && (
                <div>
                  <label htmlFor="status_input" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Trạng thái hồ sơ điều tra
                  </label>
                  <select
                    id="status_input"
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800"
                  >
                    <option value="INVESTIGATING">Đang tiến hành thụ lý điều tra</option>
                    <option value="SUSPENDED">Tạm đình chỉ vụ việc / chờ xác minh</option>
                    <option value="CLOSED">Đã hoàn thành đóng hồ sơ vụ án</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="summary_acts_input" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Tóm tắt hành vi thực tế (Cơ sở để đối chiếu điều khoản luật hình sự) *
                </label>
                <textarea
                  id="summary_acts_input"
                  rows={6}
                  required
                  placeholder="Nhập chi tiết hành vi phạm tội của đối tượng, thủ đoạn gây án, tài sản bị tác động..."
                  value={summaryActs}
                  onChange={(e) => setSummaryActs(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800 resize-none leading-relaxed font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] px-4 py-2.5 rounded-lg cursor-pointer font-bold text-xs text-slate-600"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#126DA6] hover:bg-[#1D4ED8] border border-[#126DA6] text-white px-5 py-2.5 rounded-lg cursor-pointer font-bold text-xs uppercase tracking-wider shadow-sm"
                >
                  {editingCase ? 'Lưu cập nhật' : 'Thành lập hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
