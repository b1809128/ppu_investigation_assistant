import React, { useEffect, useState } from 'react';
import { useCasesStore } from '../store/cases';
import { CaseMatchingWorkbench } from '../components/CaseMatchingWorkbench';
import { 
  Scale, 
  ChevronRight, 
  Search
} from 'lucide-react';

interface LegalMatchProps {
  preselectedCaseId?: number | null;
}

export const LegalMatch: React.FC<LegalMatchProps> = ({ preselectedCaseId = null }) => {
  const { cases, fetchCases } = useCasesStore();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch case files list
  useEffect(() => {
    fetchCases();
  }, []);

  // Sync preselected case id if passed from Cases tab
  useEffect(() => {
    if (preselectedCaseId) {
      setSelectedCaseId(preselectedCaseId);
    }
  }, [preselectedCaseId]);

  // Filter cases list based on search term
  const filteredCases = React.useMemo(() => {
    if (!searchTerm.trim()) return cases;
    const term = searchTerm.toLowerCase().trim();
    return cases.filter(c => 
      c.case_code.toLowerCase().includes(term) ||
      c.case_name.toLowerCase().includes(term) ||
      (c.location && c.location.toLowerCase().includes(term))
    );
  }, [cases, searchTerm]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-73px)]">
      {selectedCaseId ? (
        <CaseMatchingWorkbench 
          caseId={selectedCaseId} 
          onBack={() => setSelectedCaseId(null)}
        />
      ) : (
        /* Sleek case selector dashboard */
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-[#F8FAFC] no-print">
          
          {/* Header section */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 font-sans">
                <Scale size={20} className="text-[#1c75bb]" />
                Động cơ Đối chiếu & Đề xuất định tội
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Lựa chọn một hồ sơ vụ việc đang thụ lý dưới đây để chạy phân tích Rule Engine đối sánh với Bộ luật Hình sự 2015
              </p>
            </div>
          </div>
 
          {/* Search bar */}
          <div className="max-w-md relative">
            <input
              type="text"
              placeholder="Tìm kiếm vụ án (Số thụ lý, tên vụ việc, địa bàn)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] focus:border-[#1c75bb] focus:ring-1 focus:ring-[#1c75bb] focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-xs text-slate-800 font-semibold shadow-sm transition-all"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
          </div>
 
          {/* Cases grid */}
          {filteredCases.length === 0 ? (
            <div className="p-12 border border-[#E2E8F0] bg-white rounded-lg text-center text-slate-500 text-xs font-semibold shadow-sm">
              Không tìm thấy hồ sơ vụ án nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCaseId(c.id)}
                  className="p-5 bg-white border border-[#E2E8F0] hover:border-[#1c75bb]/40 rounded-lg text-left transition-all duration-150 group shadow-sm hover:shadow-md flex flex-col justify-between h-44 cursor-pointer"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-[#EF4444] font-mono uppercase bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded-lg shadow-sm">
                        {c.case_code}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm ${
                        c.status === 'CLOSED'
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                          : c.status === 'SUSPENDED'
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                          : 'bg-[#ebf4fa] border-[#BFDBFE] text-[#1c75bb]'
                      }`}>
                        {c.status === 'CLOSED' ? 'Đã đóng' : c.status === 'SUSPENDED' ? 'Tạm đình' : 'Đang xử lý'}
                      </span>
                    </div>
 
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#1c75bb] transition-colors line-clamp-2 leading-relaxed">
                        {c.case_name}
                      </h4>
                      {c.location && (
                        <span className="text-[10px] text-slate-500 font-semibold block mt-1 truncate">
                          Địa bàn: {c.location}
                        </span>
                      )}
                    </div>
                  </div>
 
                  <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-3 w-full text-[10px]">
                    <span className="text-slate-700 font-bold font-mono">
                      Thiệt hại: {c.damage_value ? `${c.damage_value.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                    </span>
                    <span className="text-[#1c75bb] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Phân tích
                      <ChevronRight size={12} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
 
        </div>
      )}
    </div>
  );
};
