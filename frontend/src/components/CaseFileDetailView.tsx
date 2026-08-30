import React, { useState, useEffect } from 'react';
import type { Suspect } from '../store/cases';
import { useCasesStore } from '../store/cases';
import { useAuthStore } from '../store/auth';
import { MaskedText } from './MaskedText';
import { 
  Calendar, 
  MapPin, 
  Coins, 
  UserPlus, 
  Scale, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle,
  FileText,
  CheckCircle2,
  Plus
} from 'lucide-react';
import api from '../services/api';
import { showToast } from '../services/api';

interface CaseFileDetailViewProps {
  caseId: number;
  onBack: () => void;
  onSelectEvaluate: (caseId: number) => void;
}

export const CaseFileDetailView: React.FC<CaseFileDetailViewProps> = ({ 
  caseId, 
  onBack, 
  onSelectEvaluate 
}) => {
  const user = useAuthStore((state) => state.user);
  const {
    currentCase,
    currentSuspects,
    error,
    fetchCaseById,
    fetchSuspects,
    updateCase,
    addSuspect,
    updateSuspect,
    removeSuspect
  } = useCasesStore();

  // Mode states
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [showSuspectModal, setShowSuspectModal] = useState(false);
  const [editingSuspect, setEditingSuspect] = useState<Suspect | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'timeline'>('info');
  const [investigationStage, setInvestigationStage] = useState('XAC_MINH');
  const [investigationLogs, setInvestigationLogs] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTitle, setLogTitle] = useState('');
  const [logDetails, setLogDetails] = useState('');

  // Form states - Case Edit
  const [caseName, setCaseName] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [summaryActs, setSummaryActs] = useState('');
  const [damageValueRaw, setDamageValueRaw] = useState('');
  const [damageValueFormatted, setDamageValueFormatted] = useState('');
  const [caseStatus, setCaseStatus] = useState<'INVESTIGATING' | 'SUSPENDED' | 'CLOSED'>('INVESTIGATING');

  // Form states - Suspect
  const [suspectName, setSuspectName] = useState('');
  const [suspectDob, setSuspectDob] = useState('');
  const [suspectCccd, setSuspectCccd] = useState('');
  const [suspectAddress, setSuspectAddress] = useState('');
  const [suspectRole, setSuspectRole] = useState<'SUSPECT' | 'WITNESS' | 'VICTIM' | 'OTHER'>('SUSPECT');
  
  // Specific role involvement for suspect (Chủ mưu, Thực hành, Giúp sức, Xúi giục)
  const [suspectInvolvement, setSuspectInvolvement] = useState('Thực hành');

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Quyết định khởi tố vụ án hình sự');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Load case details on mount
  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      const c = await fetchCaseById(caseId);
      await fetchSuspects(caseId);
      await loadDocuments();
      await loadEvaluation();
      await loadInvestigationLogs();
      
      // Populate case form states
      setCaseName(c.case_name);
      setIncidentDate(c.incident_date ? c.incident_date.substring(0, 10) : '');
      setLocation(c.location || '');
      setSummaryActs(c.summary_acts || '');
      const dmg = c.damage_value ? c.damage_value.toString() : '';
      setDamageValueRaw(dmg);
      setDamageValueFormatted(formatCurrency(dmg));
      setCaseStatus(c.status);
      setInvestigationStage(c.investigation_stage || 'XAC_MINH');
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvestigationLogs = async () => {
    try {
      const res = await api.get(`/api/cases/${caseId}/logs`);
      setInvestigationLogs(res.data);
    } catch (err) {
      console.error('Lỗi tải timeline logs:', err);
    }
  };

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) return;

    try {
      await api.post(`/api/cases/${caseId}/logs`, {
        title: logTitle,
        details: logDetails || null
      });
      setLogTitle('');
      setLogDetails('');
      setShowLogModal(false);
      showToast('Đã thêm sự kiện vào tiến trình điều tra.', 'success');
      loadInvestigationLogs();
    } catch (err) {
      console.error(err);
      showToast('Không thể thêm sự kiện tiến trình.', 'error');
    }
  };

  const handleRemoveLogClick = async (logId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này khỏi tiến trình điều tra?')) {
      try {
        await api.delete(`/api/cases/${caseId}/logs/${logId}`);
        showToast('Đã xóa sự kiện khỏi tiến trình.', 'success');
        loadInvestigationLogs();
      } catch (err) {
        console.error(err);
        showToast('Không thể xóa sự kiện.', 'error');
      }
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await api.get(`/api/cases/${caseId}/documents`);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEvaluation = async () => {
    try {
      const res = await api.get(`/api/v1/cases/${caseId}/evaluate`);
      setEvaluation(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    try {
      if (docFile) {
        const formData = new FormData();
        formData.append('name', docName);
        formData.append('document_type', docType);
        formData.append('file', docFile);
        
        await api.post(`/api/cases/${caseId}/documents/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await api.post(`/api/cases/${caseId}/documents`, {
          name: docName,
          document_type: docType
        });
      }
      setDocName('');
      setDocFile(null);
      setShowDocModal(false);
      showToast('Đã thêm tài liệu tố tụng vào hồ sơ.', 'success');
      loadDocuments();
      loadEvaluation();
    } catch (err) {
      console.error(err);
      showToast('Không thể thêm tài liệu tố tụng.', 'error');
    }
  };

  const handleRemoveDocClick = async (docId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi hồ sơ vụ án?')) {
      try {
        await api.delete(`/api/cases/${caseId}/documents/${docId}`);
        showToast('Đã xóa tài liệu khỏi hồ sơ.', 'success');
        loadDocuments();
        loadEvaluation();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper to format currency VND on typing
  const formatCurrency = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(clean));
  };

  const handleDamageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const cleanVal = inputVal.replace(/\D/g, '');
    setDamageValueRaw(cleanVal);
    setDamageValueFormatted(formatCurrency(cleanVal));
  };

  // Calculate age at incident date using JS
  const calculateAgeAtIncident = (dobStr: string | null, incidentDateStr: string | null) => {
    if (!dobStr || !incidentDateStr) return 'Không rõ';
    
    // Parse YYYY-MM-DD dob
    const dobParts = dobStr.split('-');
    if (dobParts.length !== 3) return 'Không rõ';
    
    const dob = new Date(Number(dobParts[0]), Number(dobParts[1]) - 1, Number(dobParts[2]));
    const incident = new Date(incidentDateStr);
    
    if (isNaN(dob.getTime()) || isNaN(incident.getTime())) return 'Lỗi định dạng';
    
    let age = incident.getFullYear() - dob.getFullYear();
    const m = incident.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && incident.getDate() < dob.getDate())) {
      age--;
    }
    
    return age >= 0 ? `${age} tuổi` : 'Chưa sinh';
  };

  // Case edit submission
  const handleCaseUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    const payload = {
      case_name: caseName,
      incident_date: incidentDate || null,
      location: location || null,
      summary_acts: summaryActs || null,
      damage_value: damageValueRaw ? parseFloat(damageValueRaw) : 0,
      status: caseStatus,
      investigation_stage: investigationStage,
    };

    try {
      await updateCase(caseId, payload);
      setIsEditingCase(false);
      showToast('Cập nhật hồ sơ vụ án thành công.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Open suspect modal
  const handleOpenSuspectModal = (s: Suspect | null = null) => {
    if (s) {
      setEditingSuspect(s);
      setSuspectName(s.full_name);
      setSuspectDob(s.dob || '');
      setSuspectCccd(s.identity_card || '');
      
      // Parse involvement from address/conviction field if structured (e.g. "[Chủ mưu] Tiền án...")
      const addressVal = s.prior_convictions || s.address || '';
      const matchInvolvement = addressVal.match(/^\[(Chủ mưu|Thực hành|Giúp sức|Xúi giục)\]\s*(.*)/);
      if (matchInvolvement) {
        setSuspectInvolvement(matchInvolvement[1]);
        setSuspectAddress(matchInvolvement[2]);
      } else {
        setSuspectInvolvement('Thực hành');
        setSuspectAddress(addressVal);
      }
      
      setSuspectRole(s.role_in_case);
    } else {
      setEditingSuspect(null);
      setSuspectName('');
      setSuspectDob('');
      setSuspectCccd('');
      setSuspectAddress('');
      setSuspectRole('SUSPECT');
      setSuspectInvolvement('Thực hành');
    }
    setShowSuspectModal(true);
  };

  // Suspect form submission with validations
  const handleSuspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectName.trim()) return;

    // Birthday validation (YYYY-MM-DD)
    if (suspectDob) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(suspectDob)) {
        showToast('Ngày sinh phải có định dạng YYYY-MM-DD (Ví dụ: 1995-08-12).', 'error');
        return;
      }
      const parsedDate = Date.parse(suspectDob);
      if (isNaN(parsedDate)) {
        showToast('Ngày sinh không hợp lệ.', 'error');
        return;
      }
    }

    // Citizen ID (CCCD) validation
    if (suspectCccd) {
      const cccdRegex = /^\d{9}$|^\d{12}$/;
      if (!cccdRegex.test(suspectCccd)) {
        showToast('Số CMND/CCCD phải gồm đúng 9 hoặc 12 số.', 'error');
        return;
      }
    }

    // Build structured address/prior conviction combining the involvement sub-role
    const finalAddress = suspectRole === 'SUSPECT' 
      ? `[${suspectInvolvement}] ${suspectAddress.trim()}`
      : suspectAddress.trim();

    const payload = {
      full_name: suspectName,
      dob: suspectDob || null,
      identity_card: suspectCccd || null,
      prior_convictions: finalAddress || null,
      role_in_case: suspectRole,
    };

    try {
      if (editingSuspect) {
        await updateSuspect(caseId, editingSuspect.id, payload);
        showToast('Cập nhật thông tin đối tượng thành công.', 'success');
      } else {
        await addSuspect(caseId, payload);
        showToast('Đã thêm đối tượng liên quan vào vụ án.', 'success');
      }
      setShowSuspectModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSuspectClick = async (suspectId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng này ra khỏi hồ sơ vụ án?')) {
      try {
        await removeSuspect(caseId, suspectId);
        showToast('Đã xóa đối tượng khỏi hồ sơ.', 'success');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const isLeadershipOrAdmin = user?.role === 'LEADERSHIP' || user?.role === 'ADMIN';

  if (!currentCase) return null;

  return (
    <div className="space-y-6">
      
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 no-print">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-250 px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-sm bg-white"
        >
          <span>← Quay lại danh sách</span>
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onSelectEvaluate(caseId)}
            className="flex items-center gap-2 bg-[#A82424] hover:bg-[#DC2626] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-md transition-all active:scale-95 duration-100 cursor-pointer"
          >
            <Scale size={14} />
            <span>Chạy đối chiếu định tội danh</span>
          </button>

          {!isLeadershipOrAdmin && (
            <button
              type="button"
              onClick={() => setIsEditingCase(!isEditingCase)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              <Edit3 size={14} className="text-slate-500" />
              <span>{isEditingCase ? 'Hủy chỉnh sửa' : 'Cập nhật hồ sơ'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2.5 font-semibold shadow-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Case Details View/Edit Form */}
      {isEditingCase ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
            <Edit3 size={16} className="text-[#A82424]" />
            Cập nhật chi tiết hồ sơ vụ án hình sự
          </h3>

          <form onSubmit={handleCaseUpdateSubmit} className="space-y-4 text-xs text-slate-650 font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Số thụ lý / Quyết định khởi tố *
                </label>
                <input
                  type="text"
                  disabled
                  value={currentCase.case_code}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-lg p-2.5 text-slate-400 cursor-not-allowed font-mono font-semibold"
                />
              </div>
              <div>
                <label htmlFor="edit_case_name" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Tên vụ việc *
                </label>
                <input
                  id="edit_case_name"
                  type="text"
                  required
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit_incident_date" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Thời gian xảy ra *
                </label>
                <input
                  id="edit_incident_date"
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2 text-slate-800 font-mono"
                />
              </div>
              <div>
                <label htmlFor="edit_location" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Địa bàn / Nơi xảy ra *
                </label>
                <input
                  id="edit_location"
                  type="text"
                  placeholder="Ví dụ: Quận Hoàn Kiếm, Hà Nội"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="edit_damage_value" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Giá trị tài sản thiệt hại/chiếm đoạt (VNĐ)
                </label>
                <div className="relative">
                  <input
                    id="edit_damage_value"
                    type="text"
                    placeholder="Ví dụ: 120.000.000"
                    value={damageValueFormatted}
                    onChange={handleDamageChange}
                    className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg py-2.5 pl-4 pr-16 text-slate-850 font-mono font-bold"
                  />
                  <span className="absolute right-4 top-3 text-[10px] text-slate-500 font-bold uppercase">VNĐ</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="edit_status" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                Trạng thái điều tra
              </label>
              <select
                id="edit_status"
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800"
              >
                <option value="INVESTIGATING">Đang thụ lý / Tiến hành điều tra</option>
                <option value="SUSPENDED">Tạm đình chỉ vụ án / Tạm đình chỉ giải quyết</option>
                <option value="CLOSED">Đã đóng hồ sơ vụ án (Khởi tố/Chuyển viện kiểm sát)</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit_investigation_stage" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                Giai đoạn điều tra thực tế
              </label>
              <select
                id="edit_investigation_stage"
                value={investigationStage}
                onChange={(e) => setInvestigationStage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800"
              >
                <option value="TIN_BAO">Tiếp nhận & giải quyết tin báo, tố giác tội phạm</option>
                <option value="XAC_MINH">Xác minh điều kiện khởi tố vụ án</option>
                <option value="KHOI_TO_VU_AN">Đã ra quyết định khởi tố vụ án hình sự</option>
                <option value="KHOI_TO_BI_CAN">Đã khởi tố bị can & Tiến hành điều tra</option>
                <option value="KET_LUAN">Đã ban hành bản Kết luận điều tra</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit_summary_acts" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                Tóm tắt diễn biến hành vi vi phạm *
              </label>
              <textarea
                id="edit_summary_acts"
                rows={6}
                value={summaryActs}
                onChange={(e) => setSummaryActs(e.target.value)}
                placeholder="Nhập chi tiết quá trình gây án, hành vi thực tế của đối tượng..."
                className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800 resize-none leading-relaxed font-sans"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditingCase(false)}
                className="bg-slate-50 border border-slate-250 hover:bg-slate-100 px-4 py-2.5 rounded-lg cursor-pointer text-xs font-bold text-slate-650"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-[#A82424] hover:bg-[#DC2626] border border-[#A82424] text-white px-5 py-2.5 rounded-lg cursor-pointer font-bold text-xs uppercase tracking-wider shadow-sm"
              >
                Lưu cập nhật vụ án
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-[#A82424] font-mono uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-sm">
                Số thụ lý: {currentCase.case_code}
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-2">
                {currentCase.case_name}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                currentCase.status === 'CLOSED' 
                  ? 'bg-green-50 border-green-200 text-[#196F3D]' 
                  : currentCase.status === 'SUSPENDED'
                  ? 'bg-orange-50 border-orange-200 text-[#D35400]'
                  : 'bg-blue-50 border-blue-200 text-[#1E3E62]'
              }`}>
                {currentCase.status === 'CLOSED' ? 'Đã đóng' : currentCase.status === 'SUSPENDED' ? 'Tạm đình chỉ' : 'Đang điều tra'}
              </span>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-50 border-purple-200 text-purple-700 uppercase tracking-wider">
                Giai đoạn: {
                  currentCase.investigation_stage === 'TIN_BAO' ? 'Tin báo tố giác' :
                  currentCase.investigation_stage === 'XAC_MINH' ? 'Xác minh khởi tố' :
                  currentCase.investigation_stage === 'KHOI_TO_VU_AN' ? 'Khởi tố vụ án' :
                  currentCase.investigation_stage === 'KHOI_TO_BI_CAN' ? 'Khởi tố bị can' :
                  currentCase.investigation_stage === 'KET_LUAN' ? 'Kết luận điều tra' : 'Không rõ'
                }
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-slate-200 py-4 text-xs text-slate-700 bg-slate-50/50 px-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-slate-450 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-550 block uppercase font-bold">Thời gian xảy ra</span>
                <span className="text-slate-800 font-mono font-semibold">
                  {currentCase.incident_date ? new Date(currentCase.incident_date).toLocaleString('vi-VN') : 'Không rõ'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-slate-450 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-550 block uppercase font-bold">Địa bàn / Nơi xảy ra</span>
                <span className="text-slate-800 font-semibold">{currentCase.location || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Coins size={15} className="text-slate-450 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-550 block uppercase font-bold">Thiệt hại tài sản</span>
                <span className="text-[#A82424] font-mono font-bold">
                  {currentCase.damage_value ? `${currentCase.damage_value.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">
              Tóm tắt diễn biến hành vi phạm tội
            </span>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg leading-relaxed text-slate-700 text-xs whitespace-pre-line font-serif shadow-inner">
              {currentCase.summary_acts || 'Chưa cập nhật mô tả diễn biến hành vi gây án.'}
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 gap-6 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'info'
              ? 'border-[#126DA6] text-[#126DA6]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thông tin chung & Đối tượng ({currentSuspects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-[#126DA6] text-[#126DA6]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Tài liệu & Giám sát Tố tụng ({documents.length})</span>
          {evaluation?.procedural_warnings?.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'timeline'
              ? 'border-[#126DA6] text-[#126DA6]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tiến trình điều tra ({investigationLogs.length})
        </button>
      </div>

      {activeTab === 'info' ? (
        /* Suspects list section */
        <div className="space-y-4">
          <div className="flex justify-between items-center no-print">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                DANH SÁCH BỊ CAN / ĐỐI TƯỢNG LIÊN QUAN ({currentSuspects.length})
              </h3>
              <p className="text-[10px] text-slate-450">
                Nhân thân đối tượng thụ lý; tự động tính toán tuổi để đánh giá năng lực chịu TNHS tại thời điểm xảy ra vụ việc
              </p>
            </div>

            {!isLeadershipOrAdmin && (
              <button
                type="button"
                onClick={() => handleOpenSuspectModal()}
                className="flex items-center gap-1.5 bg-white border border-slate-250 text-slate-750 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer shadow-sm hover:bg-slate-50"
              >
                <UserPlus size={14} className="text-[#126DA6]" />
                <span>Thêm đối tượng</span>
              </button>
            )}
          </div>

          {currentSuspects.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-450 shadow-sm font-semibold">
              <p className="text-xs">Chưa có đối tượng liên quan nào được lưu trong hồ sơ vụ việc</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Ngày sinh</th>
                      <th className="p-4">Tuổi khi xảy ra án</th>
                      <th className="p-4">Số CCCD / CMND</th>
                      <th className="p-4">Vai trò tham gia</th>
                      <th className="p-4">Tiền án tiền sự / Nơi cư trú</th>
                      {!isLeadershipOrAdmin && <th className="p-4 text-right no-print">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {currentSuspects.map((s) => {
                      const ageAtIncident = calculateAgeAtIncident(s.dob, currentCase.incident_date);
                      
                      let roleDisplay: string = s.role_in_case;
                      let involvementDisplay = '';
                      let cleanConvictions = s.prior_convictions || s.address || '';
                      
                      if (s.role_in_case === 'SUSPECT') {
                        roleDisplay = 'Bị can';
                        const match = cleanConvictions.match(/^\[(Chủ mưu|Thực hành|Giúp sức|Xúi giục)\]\s*(.*)/);
                        if (match) {
                          involvementDisplay = match[1];
                          cleanConvictions = match[2] || 'Không ghi nhận';
                        } else {
                          involvementDisplay = 'Thực hành';
                        }
                      } else if (s.role_in_case === 'VICTIM') {
                        roleDisplay = 'Bị hại';
                      } else if (s.role_in_case === 'WITNESS') {
                        roleDisplay = 'Nhân chứng';
                      } else {
                        roleDisplay = 'Khác';
                      }

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors duration-100">
                          <td className="p-4 font-bold text-slate-900">
                            <MaskedText text={s.full_name} type="name" />
                          </td>
                          <td className="p-4 font-mono text-slate-500 font-semibold">{s.dob || 'Chưa rõ'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              ageAtIncident.includes('14') || ageAtIncident.includes('15')
                                ? 'bg-amber-50 border-amber-200 text-[#D35400]'
                                : ageAtIncident.includes('Chưa sinh') || ageAtIncident.includes('tuổi') && parseInt(ageAtIncident) < 14
                                ? 'bg-red-50 border-red-200 text-red-650'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              {ageAtIncident}
                            </span>
                          </td>
                          <td className="p-4">
                            <MaskedText text={s.identity_card || ''} type="cccd" />
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className={`w-max text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                                s.role_in_case === 'SUSPECT' 
                                  ? 'bg-red-50 border-red-200 text-red-650' 
                                  : s.role_in_case === 'VICTIM'
                                  ? 'bg-green-50 border-green-200 text-[#196F3D]'
                                  : 'bg-slate-50 border-slate-250 text-slate-600'
                              }`}>
                                {roleDisplay}
                              </span>
                              {involvementDisplay && (
                                <span className="text-[10px] text-slate-655 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C09A36] animate-pulse"></span>
                                  {involvementDisplay}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 max-w-xs truncate text-slate-550 font-semibold" title={cleanConvictions}>
                            {cleanConvictions || 'Không ghi nhận'}
                          </td>
                          
                          {!isLeadershipOrAdmin && (
                            <td className="p-4 text-right no-print">
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSuspectModal(s)}
                                  className="p-1 rounded hover:bg-slate-100 hover:text-[#126DA6] text-slate-450 transition-colors duration-100 cursor-pointer border border-transparent hover:border-slate-200"
                                  title="Sửa đối tượng"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSuspectClick(s.id)}
                                  className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-slate-450 transition-colors duration-100 cursor-pointer border border-transparent hover:border-red-200"
                                  title="Xóa đối tượng"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'documents' ? (
        /* Documents and evaluation timeline tab */
        <div className="space-y-6">
          
          {/* Rule Engine Warnings */}
          {evaluation?.procedural_warnings?.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider block">
                Cảnh báo giám sát tố tụng khẩn cấp (Rule Engine)
              </span>
              <div className="space-y-2">
                {evaluation.procedural_warnings.map((warn: any, i: number) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-lg border text-xs leading-relaxed flex items-start gap-3 font-semibold shadow-sm ${
                      warn.severity === 'CRITICAL'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-amber-50 border-amber-250 text-amber-800'
                    }`}
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{warn.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist Grid */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                CHECKLIST HỒ SƠ TỐ TỤNG HÌNH SỰ BẮT BUỘC
              </h3>
              <p className="text-[10px] text-slate-450">
                Tự động rà soát sự hiện diện của các văn bản tố tụng theo luật định để đảm bảo tính hợp pháp của hồ sơ đề nghị truy tố
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {evaluation?.procedural_checklist && Object.entries(evaluation.procedural_checklist).map(([name, isPresent]: any) => (
                <div 
                  key={name} 
                  className={`p-3 rounded-lg border flex items-center gap-2.5 shadow-inner ${
                    isPresent 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-red-50 border-red-150 text-red-700'
                  }`}
                >
                  {isPresent ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold block truncate" title={name}>{name}</span>
                    <span className="text-[9px] font-medium opacity-80">
                      {isPresent ? 'Đã bổ sung' : 'Còn thiếu'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center no-print">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  DANH MỤC VĂN BẢN TỐ TỤNG ĐÃ BAN HÀNH ({documents.length})
                </h3>
                <p className="text-[10px] text-slate-450">
                  Các quyết định, biên bản điều tra đã ban hành và lưu trữ trong hồ sơ vụ án
                </p>
              </div>

              {!isLeadershipOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDocName('');
                    setDocType('Quyết định khởi tố vụ án hình sự');
                    setShowDocModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#126DA6] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer shadow-sm transition-colors"
                >
                  <Plus size={14} />
                  <span>Ban hành văn bản</span>
                </button>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-450 shadow-sm font-semibold">
                <p className="text-xs">Chưa ghi nhận văn bản, quyết định tố tụng nào trong vụ án</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-md animate-in fade-in duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                        <th className="p-4">Ký hiệu / Số hiệu văn bản</th>
                        <th className="p-4">Loại văn bản tố tụng</th>
                        <th className="p-4">Ngày ban hành</th>
                        {!isLeadershipOrAdmin && <th className="p-4 text-right no-print">Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors duration-100">
                          <td className="p-4 font-bold text-slate-900">
                            {doc.file_path ? (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 text-left"
                                title="Xem trước bản scan / PDF"
                              >
                                <FileText size={14} className="text-[#2563EB]" />
                                <span>{doc.name}</span>
                              </button>
                            ) : (
                              <div className="font-bold text-slate-700 flex items-center gap-2">
                                <FileText size={14} className="text-slate-400" />
                                <span>{doc.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] rounded-md font-semibold text-[10px]">
                              {doc.document_type}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-500 font-semibold">
                            {new Date(doc.created_at).toLocaleString('vi-VN')}
                          </td>
                          {!isLeadershipOrAdmin && (
                            <td className="p-4 text-right no-print">
                              <button
                                type="button"
                                onClick={() => handleRemoveDocClick(doc.id)}
                                className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-slate-450 transition-colors duration-100 cursor-pointer border border-transparent hover:border-red-200"
                                title="Thu hồi / Xóa văn bản"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Investigation logs timeline section */
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                NHẬT KÝ TIẾN TRÌNH ĐIỀU TRA ({investigationLogs.length})
              </h3>
              <p className="text-[10px] text-slate-450 mt-1">
                Ghi nhận các mốc sự kiện quan trọng trong quá trình tố tụng và điều tra hiện trường, hỏi cung
              </p>
            </div>

            {!isLeadershipOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  setLogTitle('');
                  setLogDetails('');
                  setShowLogModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#126DA6] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer shadow-sm transition-colors"
              >
                <Plus size={14} />
                <span>Ghi nhận tiến trình</span>
              </button>
            )}
          </div>

          {investigationLogs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-450 shadow-sm font-semibold font-sans">
              <p className="text-xs">Chưa ghi nhận hoạt động điều tra nào cho vụ việc này.</p>
              {!isLeadershipOrAdmin && (
                <button
                  type="button"
                  onClick={() => setShowLogModal(true)}
                  className="mt-3 text-xs text-[#126DA6] hover:underline cursor-pointer font-bold"
                >
                  Bắt đầu ghi nhận tiến trình ngay
                </button>
              )}
            </div>
          ) : (
            <div className="relative border-l-2 border-[#126DA6]/35 ml-4 pl-6 space-y-6 font-sans">
              {investigationLogs.map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline point */}
                  <span className="absolute -left-[31px] top-1 flex items-center justify-center w-4 h-4 rounded-full bg-white border-2 border-[#126DA6] shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#126DA6]"></span>
                  </span>
                  
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2 hover:shadow-md transition-shadow duration-150 relative group">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-800">{log.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500 font-bold">
                          {new Date(log.log_date).toLocaleString('vi-VN')}
                        </span>
                        {!isLeadershipOrAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLogClick(log.id)}
                            className="p-1 text-slate-450 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer border border-transparent hover:bg-slate-50"
                            title="Xóa sự kiện"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    {log.details && (
                      <p className="text-[11px] leading-relaxed text-slate-700 font-serif whitespace-pre-wrap mt-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUSPECT ADD / EDIT MODAL POPUP */}
      {showSuspectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowSuspectModal(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <UserPlus size={18} className="text-[#A82424]" />
              {editingSuspect ? 'Cập nhật nhân thân đối tượng' : 'Thêm đối tượng thụ lý liên quan'}
            </h3>

            <form onSubmit={handleSuspectSubmit} className="space-y-4 text-xs text-slate-650 font-semibold">
              <div>
                <label htmlFor="modal_suspect_name" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Họ và tên đối tượng *
                </label>
                <input
                  id="modal_suspect_name"
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={suspectName}
                  onChange={(e) => setSuspectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal_suspect_dob" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Ngày sinh (YYYY-MM-DD) *
                  </label>
                  <input
                    id="modal_suspect_dob"
                    type="text"
                    required
                    placeholder="Ví dụ: 1995-08-12"
                    value={suspectDob}
                    onChange={(e) => setSuspectDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 font-normal">Định dạng 4 số năm - 2 số tháng - 2 số ngày</span>
                </div>

                <div>
                  <label htmlFor="modal_suspect_cccd" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Số CCCD / CMND *
                  </label>
                  <input
                    id="modal_suspect_cccd"
                    type="text"
                    required
                    placeholder="Ví dụ: 079095012345"
                    value={suspectCccd}
                    onChange={(e) => setSuspectCccd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 font-normal">Yêu cầu nhập đúng 9 hoặc 12 chữ số</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal_suspect_role" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                    Vai trò trong vụ án
                  </label>
                  <select
                    id="modal_suspect_role"
                    value={suspectRole}
                    onChange={(e) => setSuspectRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800"
                  >
                    <option value="SUSPECT">Bị can (Nghi phạm)</option>
                    <option value="VICTIM">Bị hại (Người bị hại)</option>
                    <option value="WITNESS">Nhân chứng (Người làm chứng)</option>
                    <option value="OTHER">Đối tượng liên quan khác</option>
                  </select>
                </div>

                {suspectRole === 'SUSPECT' && (
                  <div>
                    <label htmlFor="modal_suspect_involvement" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                      Vị thế đồng phạm
                    </label>
                    <select
                      id="modal_suspect_involvement"
                      value={suspectInvolvement}
                      onChange={(e) => setSuspectInvolvement(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800"
                    >
                      <option value="Chủ mưu">Chủ mưu (Ringleader)</option>
                      <option value="Thực hành">Thực hành (Principal)</option>
                      <option value="Giúp sức">Giúp sức (Accomplice)</option>
                      <option value="Xúi giục">Xúi giục (Instigator)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="modal_suspect_address" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Tiền án tiền sự / Nơi cư trú
                </label>
                <textarea
                  id="modal_suspect_address"
                  rows={3}
                  placeholder="Ghi nhận tiền án tiền sự trước đây, các mối quan hệ xã hội hoặc địa chỉ cư trú của đối tượng..."
                  value={suspectAddress}
                  onChange={(e) => setSuspectAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#A82424] focus:ring-1 focus:ring-[#A82424] focus:outline-none rounded-lg p-2.5 text-slate-800 resize-none leading-relaxed font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSuspectModal(false)}
                  className="bg-slate-50 border border-slate-250 hover:bg-slate-100 px-4 py-2.5 rounded-lg cursor-pointer text-xs font-bold text-slate-650"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#126DA6] hover:bg-[#1D4ED8] border border-[#126DA6] text-white px-5 py-2.5 rounded-lg cursor-pointer font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-150"
                >
                  {editingSuspect ? 'Cập nhật đối tượng' : 'Thêm đối tượng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DOCUMENT ADD MODAL POPUP */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowDocModal(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>
 
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <FileText size={18} className="text-[#126DA6]" />
              Ban hành văn bản tố tụng mới
            </h3>
 
            <form onSubmit={handleAddDocSubmit} className="space-y-4 text-xs text-slate-650 font-semibold">
              <div>
                <label htmlFor="modal_doc_name" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Số hiệu / Ký hiệu văn bản *
                </label>
                <input
                  id="modal_doc_name"
                  type="text"
                  required
                  placeholder="Ví dụ: Quyết định số 102/QĐ-CQĐT"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800"
                />
              </div>
 
              <div>
                <label htmlFor="modal_doc_type" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Loại văn bản tố tụng *
                </label>
                <select
                  id="modal_doc_type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800"
                >
                  <option value="Quyết định khởi tố vụ án hình sự">Quyết định khởi tố vụ án hình sự</option>
                  <option value="Quyết định khởi tố bị can">Quyết định khởi tố bị can</option>
                  <option value="Biên bản khám nghiệm hiện trường">Biên bản khám nghiệm hiện trường</option>
                  <option value="Biên bản hỏi cung bị can">Biên bản hỏi cung bị can</option>
                  <option value="Quyết định tạm giữ">Quyết định tạm giữ</option>
                  <option value="Quyết định trưng cầu giám định">Quyết định trưng cầu giám định</option>
                </select>
              </div>
 
              <div>
                <label htmlFor="modal_doc_file" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Đính kèm bản scan / PDF văn bản (Tùy chọn)
                </label>
                <input
                  id="modal_doc_file"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border border-slate-250 focus:outline-none rounded-lg p-2 text-slate-800 text-xs cursor-pointer"
                />
              </div>
 
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="bg-slate-50 border border-slate-250 hover:bg-slate-100 px-4 py-2.5 rounded-lg cursor-pointer text-xs font-bold text-slate-650"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#126DA6] hover:bg-[#1D4ED8] border border-[#126DA6] text-white px-5 py-2.5 rounded-lg cursor-pointer font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-150"
                >
                  Ban hành văn bản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVESTIGATION LOG ADD MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-750 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3 font-sans">
              <Calendar size={18} className="text-[#126DA6]" />
              Ghi nhận tiến trình điều tra mới
            </h3>

            <form onSubmit={handleAddLogSubmit} className="space-y-4 text-xs text-slate-650 font-semibold font-sans">
              <div>
                <label htmlFor="modal_log_title" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Tiêu đề sự kiện *
                </label>
                <input
                  id="modal_log_title"
                  type="text"
                  required
                  placeholder="Ví dụ: Lấy lời khai đối tượng Nguyễn Văn A lần thứ nhất"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="modal_log_details" className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Chi tiết nội dung sự việc
                </label>
                <textarea
                  id="modal_log_details"
                  rows={4}
                  placeholder="Mô tả cụ thể hoạt động xác minh, các chứng cứ thu thập được hoặc tóm tắt lời khai..."
                  value={logDetails}
                  onChange={(e) => setLogDetails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="bg-slate-50 border border-slate-250 hover:bg-slate-100 px-4 py-2.5 rounded-lg cursor-pointer text-xs font-bold text-slate-650"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#126DA6] hover:bg-[#1D4ED8] border border-[#126DA6] text-white px-5 py-2.5 rounded-lg cursor-pointer font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-150"
                >
                  Ghi nhận sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-4xl w-full h-[85vh] relative flex flex-col animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-750 cursor-pointer"
            >
              <X size={18} />
            </button>
 
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <FileText size={18} className="text-[#2563EB]" />
              Xem trước bản scan: {previewDoc.name} ({previewDoc.document_type})
            </h3>

            <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
              {previewDoc.file_path ? (
                <iframe 
                  src={`${previewDoc.file_path.startsWith('http') ? previewDoc.file_path : `${import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''}${previewDoc.file_path}`}`} 
                  className="w-full h-full border-none"
                  title={previewDoc.name}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 italic">
                  Không có bản scan đính kèm.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CaseFileDetailView;
