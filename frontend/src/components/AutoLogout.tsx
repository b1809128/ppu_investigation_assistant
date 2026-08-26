import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

interface AutoLogoutProps {
  timeoutMinutes?: number;
}

export const AutoLogout: React.FC<AutoLogoutProps> = ({ timeoutMinutes = 15 }) => {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = timeoutMs - 60 * 1000; // Show warning 60 seconds before logout

  const lastActivityRef = useRef<number>(Date.now());
  const logoutTimerRef = useRef<any | null>(null);
  const warningTimerRef = useRef<any | null>(null);
  const countdownTimerRef = useRef<any | null>(null);

  // Reset timer on user interaction
  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    
    if (showWarning) {
      setShowWarning(false);
    }
    
    // Clear existing timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    // Set new timers if user is authenticated
    if (isAuthenticated) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        setSecondsRemaining(60);
      }, warningMs);

      logoutTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, timeoutMs);
    }
  };

  const handleAutoLogout = () => {
    // Clear all timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    
    setShowWarning(false);
    logout();
    alert('Hệ thống tự động khóa màn hình và đăng xuất do không phát hiện tương tác trong 15 phút.');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setShowWarning(false);
      return;
    }

    // Bind event listeners for activity tracking
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      // Don't reset if warning is shown (user must click the action button to extend session)
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Initialize timers
    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isAuthenticated, showWarning]);

  // Handle countdown when warning is active
  useEffect(() => {
    if (showWarning) {
      countdownTimerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleAutoLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-navy-900 border border-slate-700/80 rounded-lg shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-amber via-accent-gold to-accent-amber animate-pulse" />
        
        <div className="w-16 h-16 bg-amber-950/40 border border-accent-amber/40 rounded-full flex items-center justify-center mx-auto mb-6 text-accent-gold animate-bounce">
          <ShieldAlert size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-slate-100 mb-2">CẢNH BÁO BẢO MẬT</h3>
        <p className="text-sm text-slate-400 mb-6">
          Hệ thống phát hiện bạn không hoạt động. Để bảo vệ dữ liệu nghiệp vụ nhạy cảm, màn hình sẽ tự động khóa sau{' '}
          <span className="text-accent-gold font-bold text-lg">{secondsRemaining}</span> giây.
        </p>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setShowWarning(false);
              resetTimer();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-navy-800 to-navy-700 hover:from-navy-700 hover:to-navy-600 border border-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium shadow-md transition-all active:scale-95 duration-100 cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Tiếp tục làm việc</span>
          </button>
          
          <button
            type="button"
            onClick={handleAutoLogout}
            className="flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 text-red-400 py-3 px-4 rounded-lg font-medium transition-all active:scale-95 duration-100 cursor-pointer"
            title="Đăng xuất ngay lập tức"
          >
            <LogOut size={16} />
            <span>Khóa ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
