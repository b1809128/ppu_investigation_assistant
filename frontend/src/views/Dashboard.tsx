import React, { useEffect, useState } from 'react';
import { useCasesStore } from '../store/cases';
import { useAuthStore } from '../store/auth';
import { 
  LayoutDashboard, 
  FolderLock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Activity
} from 'lucide-react';
import api from '../services/api';

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  suspendedCases: number;
  closedCases: number;
  totalDamage: number;
  totalSuspects: number;
  recentLogs: any[];
}

export const Dashboard: React.FC = () => {
  const { fetchCases } = useCasesStore();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    suspendedCases: 0,
    closedCases: 0,
    totalDamage: 0,
    totalSuspects: 0,
    recentLogs: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await fetchCases();
      
      // Calculate stats based on fetched cases
      const fetchedCases = useCasesStore.getState().cases;
      const totalCases = fetchedCases.length;
      const activeCases = fetchedCases.filter(c => c.status === 'INVESTIGATING').length;
      const suspendedCases = fetchedCases.filter(c => c.status === 'SUSPENDED').length;
      const closedCases = fetchedCases.filter(c => c.status === 'CLOSED').length;
      const totalDamage = fetchedCases.reduce((sum, c) => sum + (c.damage_value || 0), 0);
      
      // Attempt to load recent audit activities only if user is Leadership or Admin
      let recentLogs = [];
      if (user?.role === 'LEADERSHIP' || user?.role === 'ADMIN') {
        try {
          const logResponse = await api.get('/api/audit');
          recentLogs = logResponse.data.slice(0, 5);
        } catch (err) {
          console.warn('Không thể load audit logs', err);
        }
      }

      setStats({
        totalCases,
        activeCases,
        suspendedCases,
        closedCases,
        totalDamage,
        totalSuspects: 0, // Mock or fetch suspects count if needed
        recentLogs
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-base font-bold tracking-wide text-[#126DA6] flex items-center gap-2 font-sans uppercase">
          <LayoutDashboard size={20} className="text-[#126DA6]" />
          BẢNG ĐIỀU KHIỂN NGHIỆP VỤ (DASHBOARD)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tổng quan số liệu thụ lý hồ sơ án hình sự và hoạt động giám sát mạng LAN
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#126DA6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Cases */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tổng án thụ lý</span>
                <span className="text-2xl font-extrabold text-[#126DA6] block font-mono leading-none">{stats.totalCases}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Hồ sơ đã nhập hệ thống</span>
              </div>
              <FolderLock size={32} className="text-[#126DA6]/10 group-hover:text-[#126DA6]/20 transition-colors duration-150 shrink-0" />
            </div>

            {/* Investigating Cases */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Đang điều tra</span>
                <span className="text-2xl font-extrabold text-[#126DA6] block font-mono leading-none">{stats.activeCases}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Tích cực giải quyết</span>
              </div>
              <Activity size={32} className="text-[#126DA6]/10 group-hover:text-[#126DA6]/20 transition-colors duration-150 shrink-0" />
            </div>

            {/* Suspended Cases */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tạm đình chỉ</span>
                <span className="text-2xl font-extrabold text-[#126DA6] block font-mono leading-none">{stats.suspendedCases}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Đang tạm ngừng xác minh</span>
              </div>
              <AlertTriangle size={32} className="text-[#126DA6]/10 group-hover:text-[#126DA6]/20 transition-colors duration-150 shrink-0" />
            </div>

            {/* Closed Cases */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Đã kết luận / Đóng</span>
                <span className="text-2xl font-extrabold text-[#126DA6] block font-mono leading-none">{stats.closedCases}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Đã có kết quả giải quyết</span>
              </div>
              <CheckCircle2 size={32} className="text-[#126DA6]/10 group-hover:text-[#126DA6]/20 transition-colors duration-150 shrink-0" />
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Total Damage statistics */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                  Thiệt hại tài sản tích lũy
                </h3>
                
                <div className="py-6">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Tổng giá trị định lượng</span>
                  <span className="text-xl font-bold text-[#EF4444] font-mono tracking-wide block mt-1">
                    {stats.totalDamage.toLocaleString('vi-VN')} VND
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-4 italic">
                    Giá trị thiệt hại tài sản là căn cứ quan trọng để Động cơ Đối chiếu tự động định khung điều khoản khởi tố của Bộ luật Hình sự 2015.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-lg leading-relaxed font-semibold">
                <TrendingUp size={16} className="shrink-0" />
                <span>CSDL Luật Hình sự được lưu trữ cục bộ RAM O(1).</span>
              </div>
            </div>

            {/* Recent audit trails list */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                Hoạt động kiểm toán an ninh mạng LAN (Audit logs)
              </h3>

              {stats.recentLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Chỉ tài khoản Lãnh đạo hoặc Quản trị viên mới được quyền truy cập giám sát nhật ký.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {stats.recentLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{log.username}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg uppercase font-mono">
                            {log.action}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">{log.resource_type} #{log.resource_id || ''}</span>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <span className="text-[10px] text-slate-500 font-mono block font-semibold">
                          {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                        </span>
                        <span className="text-[9px] text-slate-450 font-bold block">{log.ip_address || 'LAN'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};
export default Dashboard;
