import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { Watermark } from './Watermark';
import { AutoLogout } from './AutoLogout';
import { 
  Shield, 
  FolderLock, 
  Scale, 
  Users, 
  FileSpreadsheet, 
  LogOut,
  User as UserIcon,
  Clock,
  Menu,
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  currentTab, 
  setCurrentTab, 
  children 
}) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [time, setTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('vi-VN'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'cases', label: 'Hồ sơ vụ án', icon: FolderLock, roles: ['ADMIN', 'LEADERSHIP', 'INVESTIGATOR'] },
    { id: 'legal-match', label: 'Đối chiếu luật', icon: Scale, roles: ['ADMIN', 'LEADERSHIP', 'INVESTIGATOR'] },
    { id: 'audit-logs', label: 'Nhật ký kiểm toán', icon: FileSpreadsheet, roles: ['ADMIN', 'LEADERSHIP'] },
    { id: 'users', label: 'Quản lý tài khoản', icon: Users, roles: ['ADMIN'] },
  ];

  const allowedMenuItems = menuItems.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col relative select-text">
      {/* Client-side Security Controls */}
      {user && <Watermark username={user.full_name} />}
      <AutoLogout timeoutMinutes={15} />

      {/* Header */}
      <header className="bg-navy-900 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md no-print">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded hover:bg-navy-800 text-slate-400 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="w-10 h-10 bg-navy-850 border border-slate-700/60 rounded-lg flex items-center justify-center text-accent-gold shadow">
            <Shield size={22} />
          </div>
          
          <div>
            <h1 className="text-base font-bold tracking-wide uppercase text-slate-100 hidden sm:block">
              Hệ thống trợ lý điều tra
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Mạng nội bộ cục bộ
            </span>
          </div>
        </div>

        {/* Live Clock & User Info */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono bg-navy-950/60 border border-slate-850 px-3 py-1.5 rounded-lg">
            <Clock size={14} className="text-accent-gold animate-pulse" />
            <span>{time}</span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-navy-800 border border-slate-700/50 flex items-center justify-center text-slate-300">
                <UserIcon size={16} />
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-semibold text-slate-200 block max-w-[150px] truncate">
                  {user.full_name}
                </span>
                <span className="text-[9px] bg-navy-800 border border-slate-750 text-accent-gold font-bold px-1.5 py-0.5 rounded-lg uppercase tracking-wider block mt-0.5 w-max">
                  {user.role === 'INVESTIGATOR' ? 'ĐTV' : user.role === 'LEADERSHIP' ? 'LÃNH ĐẠO' : 'QUẢN TRỊ'}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex relative">
        
        {/* Sidebar (Desktop) */}
        <aside className="w-64 bg-navy-900 border-r border-slate-850/80 flex flex-col justify-between py-6 sticky top-[73px] h-[calc(100vh-73px)] shrink-0 hidden md:flex no-print">
          <div className="px-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">
              Nghiệp vụ và tra cứu
            </div>
            
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-navy-800 to-navy-750 text-accent-gold border border-slate-700/40 shadow-inner' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/40 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-accent-gold' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-4">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent transition-all duration-150 cursor-pointer"
            >
              <LogOut size={18} />
              <span>Khóa hệ thống</span>
            </button>
          </div>
        </aside>

        {/* Sidebar (Mobile drawer) */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-navy-950/85 backdrop-blur-sm z-40 md:hidden no-print"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 w-64 bg-navy-900 z-50 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250 md:hidden no-print">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Shield className="text-accent-gold" size={20} />
                    <span className="font-bold text-slate-200 uppercase tracking-wide text-xs">Mục lục vụ án</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded hover:bg-navy-800 text-slate-400 cursor-pointer"
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
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                          isActive 
                            ? 'bg-navy-800 text-accent-gold border border-slate-700/50 shadow' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-navy-850'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-accent-gold' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-all duration-150 cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Khóa hệ thống</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Content Container */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#080f1a] relative">
          {children}
        </main>

      </div>
    </div>
  );
};
