import React, { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Lock, User as UserIcon, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import axios from 'axios';


export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginStore = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLocalError('Vui lòng nhập đầy đủ số hiệu Công an và mật khẩu nghiệp vụ.');
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);

    try {
      // API expects OAuth2 password form (form-url-encoded)
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post('/api/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      await loginStore(access_token);
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      const errMsg = err.response?.data?.detail || 'Sai số hiệu hoặc mật khẩu nghiệp vụ CAND.';
      setLocalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-75" />

      {/* Decorative Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-650/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#C09A36]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white border-[3px] border-[#C09A36] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-xl">
            <img src="/image/t05.png" alt="Logo PPU" className="w-14 h-14 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] select-none" />
          </div>
          <h1 className="text-lg font-black tracking-widest text-[#1c75bb] uppercase">
            TRƯỜNG ĐẠI HỌC CẢNH SÁT NHÂN DÂN
          </h1>
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mt-1.5">
            KHOA CẢNH SÁT ĐIỀU TRA
          </h2>
          <p className="text-[10px] text-[#C09A36] uppercase font-bold tracking-widest mt-1">
            HỆ THỐNG TRỢ LÝ ĐIỀU TRA NGHIỆP VỤ & TRA CỨU LUẬT HÌNH SỰ
          </p>
        </div>
 
        {/* Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xl p-7 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[#1c75bb] via-[#C09A36] to-[#155d95]" />
          
          <h2 className="text-sm font-bold text-slate-800 text-center mb-6 uppercase tracking-wider">
            XÁC THỰC NGHIỆP VỤ SĨ QUAN CAND
          </h2>
 
          {localError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="shrink-0 mt-0.5" size={15} />
              <span>{localError}</span>
            </div>
          )}
 
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="badge_id" className="block text-[10px] font-bold text-slate-650 uppercase tracking-wider mb-2">
                Tài khoản / Số hiệu CAND *
              </label>
              <div className="relative">
                <input
                  id="badge_id"
                  type="text"
                  placeholder="Nhập số hiệu CAND hoặc tài khoản"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#1c75bb] focus:ring-1 focus:ring-[#1c75bb] focus:outline-none rounded-lg py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all font-semibold"
                  disabled={isSubmitting}
                  autoComplete="username"
                  required
                />
                <UserIcon className="absolute left-4 top-3.5 text-slate-400" size={16} />
              </div>
            </div>
 
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-650 uppercase tracking-wider mb-2">
                Mật khẩu mật tối cao *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu truy cập"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#1c75bb] focus:ring-1 focus:ring-[#1c75bb] focus:outline-none rounded-lg py-3 pl-11 pr-11 text-sm text-slate-900 placeholder-slate-400 transition-all"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
 
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1c75bb] hover:bg-[#155d95] text-white py-3 rounded-lg font-bold shadow-md cursor-pointer transition-all active:scale-95 duration-100 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang kiểm tra an ninh...</span>
                  </>
                ) : (
                  <span>Xác thực truy cập nghiệp vụ</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info - Security Alert */}
        <div className="bg-red-50/50 border border-red-200/80 rounded-lg p-3.5 mt-5 text-[10px] text-red-800 flex items-start gap-2.5 leading-relaxed shadow-sm">
          <ShieldAlert className="shrink-0 text-red-650 mt-0.5" size={14} />
          <div className="space-y-1 font-semibold">
            <p className="font-extrabold uppercase">CẢNH BÁO AN NINH QUỐC GIA</p>
            <p className="text-red-700">Mọi hành vi truy cập trái phép hoặc cố tình khai thác lỗ hổng mạng LAN nội bộ đều vi phạm pháp luật hình sự và sẽ bị xử lý nghiêm. Hoạt động của bạn đang được kiểm toán và giám sát tự động 24/7.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

