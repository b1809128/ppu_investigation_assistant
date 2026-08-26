import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { 
  FileSpreadsheet, 
  Search, 
  ShieldAlert, 
  RefreshCw, 
  AlertCircle,
  Database,
  Eye
} from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id: number | null;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  details: any;
  created_at: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/audit');
      setLogs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể tải nhật ký kiểm toán hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on search term (filters by action, username, or IP)
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase().trim();
    return logs.filter(log => 
      (log.action || '').toLowerCase().includes(term) ||
      (log.username || '').toLowerCase().includes(term) ||
      (log.ip_address || '').toLowerCase().includes(term) ||
      (log.resource_type || '').toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-[#126DA6]" />
            NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Theo dõi vết lịch sử truy vấn dữ liệu nhạy cảm, thay đổi hệ thống của cán bộ và điều tra viên
          </p>
        </div>
 
        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Tải lại dữ liệu</span>
        </button>
      </div>
 
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#991B1B] text-sm flex items-start gap-2.5 font-semibold">
          <AlertCircle className="shrink-0 mt-0.5 text-[#991B1B]" size={16} />
          <span>{error}</span>
        </div>
      )}
 
      {/* Filter and stats */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-sm no-print">
        <label htmlFor="audit-search-input" className="sr-only">Tìm kiếm lịch sử logs</label>
        <div className="relative max-w-sm w-full">
          <input
            id="audit-search-input"
            type="text"
            placeholder="Tìm theo điều tra viên, hoạt động, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 font-semibold transition-all"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
 
        <div className="text-xs text-slate-500 font-mono flex items-center gap-4 font-bold">
          <span>Tổng log: <strong className="text-slate-800">{logs.length}</strong></span>
          {searchTerm && <span>Khớp lọc: <strong className="text-[#EF4444]">{filteredLogs.length}</strong></span>}
        </div>
      </div>
 
      {/* Audit Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#126DA6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center text-slate-500 shadow-sm font-semibold">
          <Database size={48} className="mx-auto mb-4 opacity-35 text-slate-400" />
          <p className="text-sm">Không tìm thấy bản ghi nhật ký kiểm toán nào phù hợp</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm border-collapse">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-800 uppercase tracking-wider font-bold">
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Hoạt động (Action)</th>
                  <th className="p-4">Cán bộ thực hiện</th>
                  <th className="p-4">Địa chỉ IP</th>
                  <th className="p-4">Đối tượng tác động</th>
                  <th className="p-4 text-right no-print">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-slate-850 font-mono font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]/55 transition-colors duration-100">
                    <td className="p-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider shadow-sm ${
                        log.action.includes('FAILED') || log.action.includes('DELETE') || log.action.includes('REMOVE')
                          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]' 
                          : log.action.includes('CREATE') || log.action.includes('ADD')
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                          : log.action.includes('UPDATE')
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                          : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#126DA6]'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 font-bold">{log.username || 'HỆ THỐNG'}</td>
                    <td className="p-4 text-slate-600">{log.ip_address || 'LAN CỤC BỘ'}</td>
                    <td className="p-4">
                      <span className="text-slate-700 font-semibold">{log.resource_type}</span>
                      {log.resource_id && <span className="text-[10px] text-slate-500 ml-1 font-bold">#{log.resource_id}</span>}
                    </td>
                    <td className="p-4 text-right no-print">
                      <button
                        key={log.id}
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#126DA6] text-slate-700 transition-colors duration-150 cursor-pointer inline-flex items-center gap-1 font-bold shadow-sm"
                      >
                        <Eye size={12} />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
 
      {/* DETAILS VIEW MODAL (JSON DISPLAY) */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-2xl p-6 max-w-xl w-full relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-700 cursor-pointer text-xs font-bold"
            >
              Đóng
            </button>
 
            <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2 font-sans">
              <ShieldAlert size={18} className="text-[#126DA6]" />
              Chi tiết Audit Log #{selectedLog.id}
            </h3>
 
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-[#E2E8F0] pb-3 font-semibold">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Hoạt động</span>
                  <span className="text-slate-800 font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Người thực hiện</span>
                  <span className="text-slate-800 font-bold">{selectedLog.username || 'HỆ THỐNG'}</span>
                </div>
              </div>
 
              <div>
                <span className="text-xs text-slate-500 block uppercase mb-1.5 font-bold">Tham số / Dữ liệu kèm theo</span>
                <pre className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-slate-800 overflow-x-auto max-h-[350px] font-mono leading-relaxed shadow-inner">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
