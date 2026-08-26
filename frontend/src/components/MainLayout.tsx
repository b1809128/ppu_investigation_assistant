import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { AutoLogout } from './AutoLogout';
import { 
  LayoutDashboard, 
  FolderLock, 
  BookOpen, 
  Scale, 
  FileSpreadsheet, 
  LogOut,
  User as UserIcon,
  Clock,
  Menu,
  X,
  Server,
  FileText
} from 'lucide-react';

interface MainLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}


export const MainLayout: React.FC<MainLayoutProps> = ({ 
  currentTab, 
  setCurrentTab, 
  children 
}) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [time, setTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lanIp, setLanIp] = useState('192.168.1.88'); // Standard mock LAN IP for offline net

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('vi-VN'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Resolve dynamic host IP if available
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLanIp(window.location.hostname);
    }
    
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard, roles: ['ADMIN', 'LEADERSHIP', 'INVESTIGATOR'] },
    { id: 'cases', label: 'Hồ sơ vụ án', icon: FolderLock, roles: ['ADMIN', 'LEADERSHIP', 'INVESTIGATOR'] },
    { id: 'laws-lookup', label: 'Tra cứu luật hình sự', icon: BookOpen, roles: ['ADMIN', 'LEADERSHIP', 'INVESTIGATOR'] },
    { id: 'legal-match', label: 'Đối chiếu & Đề xuất định tội', icon: Scale, roles: ['ADMIN', 'LEADERSHIP', 'INVESTIGATOR'] },
    { id: 'investigation-handbook', label: 'Cẩm nang Nghiệp vụ', icon: FileText, roles: ['ADMIN', 'LEADERSHIP', 'INVESTIGATOR'] },
    { id: 'audit-logs', label: 'Nhật ký kiểm toán', icon: FileSpreadsheet, roles: ['ADMIN', 'LEADERSHIP'] },
  ];

  const allowedMenuItems = menuItems.filter(
    item => user && item.roles.includes(user.role)
  );

  const handleLogoutClick = () => {
    if (window.confirm('Xác nhận khóa phiên làm việc nghiệp vụ và đăng xuất?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 flex flex-col relative select-text">
      
      {/* 100% Offline Screen Watermark Protection (Disabled by request) */}
      {/* {user && <SecurityWatermark fullName={user.full_name} ipAddress={lanIp} />} */}
      
      {/* Auto Screen Lock/Logout Timer */}
      <AutoLogout timeoutMinutes={15} />

      {/* Header - Minimalist white style */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm no-print">
        <div className="flex items-center gap-3.5">
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-[#0F172A] cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <img src="/image/t05.png" alt="Logo PPU" className="w-9 h-9 object-contain shrink-0 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] select-none" />
          
          <div>
            <h1 className="text-sm font-bold tracking-wider text-[#0F172A] hidden sm:block font-sans uppercase">
              TRƯỜNG ĐẠI HỌC CẢNH SÁT NHÂN DÂN
            </h1>
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest block mt-0.5">
              KHOA CẢNH SÁT ĐIỀU TRA • HỆ THỐNG TRỢ LÝ NGHIỆP VỤ & TRA CỨU LUẬT HÌNH SỰ
            </span>
          </div>
        </div>

        {/* Live Clock, LAN IP & User Information */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4">
            {/* LAN IP display */}
            <div className="flex items-center gap-1.5 text-xs text-[#334155] font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-full shadow-sm">
              <Server size={12} className="text-[#126DA6]" />
              <span>IP LAN: {lanIp}</span>
            </div>
            
            {/* Clock */}
            <div className="flex items-center gap-2 text-xs text-[#334155] font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-full shadow-sm">
              <Clock size={12} className="text-[#126DA6]" />
              <span>{time}</span>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#126DA6] shadow-sm">
                <UserIcon size={18} />
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold text-[#0F172A] block leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[9px] text-[#64748B] font-mono block font-bold leading-none uppercase">
                  SH: {user.badge_id}
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleLogoutClick}
                className="ml-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-[#FEF2F2] hover:border-[#FEE2E2] hover:text-[#EF4444] transition-colors duration-150 cursor-pointer"
                title="Đăng xuất nghiệp vụ"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebars and Main content */}
      <div className="flex-1 flex relative">
        
        {/* Desktop Sidebar - White Minimalist style */}
        <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between py-6 sticky top-[64px] h-[calc(100vh-64px)] shrink-0 hidden md:flex no-print">
          <div className="px-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3.5 mb-4 font-sans">
              HỒ SƠ NGHIỆP VỤ
            </div>
            
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border-l-4 border-l-[#126DA6] font-bold shadow-sm' 
                      : 'text-[#475569] hover:text-[#126DA6] hover:bg-[#F8FAFC] border-l-4 border-transparent'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#1D4ED8]' : 'text-[#64748B]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-4">
            <div className="text-[9px] text-slate-400 text-center uppercase tracking-widest mb-3 border-t border-slate-100 pt-3 font-semibold font-mono">
              Hệ thống an ninh cục bộ
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden no-print"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-[#E2E8F0] z-50 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250 md:hidden no-print">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <img src="/image/t05.png" alt="Logo PPU" className="w-8 h-8 object-contain shrink-0 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] select-none" />
                    <span className="font-bold text-slate-800 uppercase tracking-wide text-xs">Menu Nghiệp vụ</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {allowedMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                          isActive 
                            ? 'bg-[#EFF6FF] text-[#1D4ED8] border-l-4 border-l-[#126DA6] font-bold shadow-sm' 
                            : 'text-[#475569] hover:text-[#126DA6] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-[#1D4ED8]' : 'text-[#64748B]'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-slate-600 hover:text-[#EF4444] hover:bg-red-50 transition-all duration-150 cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Khóa hệ thống</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] relative overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
};
export default MainLayout;
