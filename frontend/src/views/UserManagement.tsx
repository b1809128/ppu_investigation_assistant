import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Lock, 
  User, 
  ShieldCheck, 
  AlertCircle,
  X,
  UserCheck,
  UserX
} from 'lucide-react';

interface SystemUser {
  id: number;
  badge_id: string;
  full_name: string;
  role: 'ADMIN' | 'LEADERSHIP' | 'INVESTIGATOR';
  is_active: boolean;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  
  // Form states
  const [badgeId, setBadgeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'LEADERSHIP' | 'INVESTIGATOR'>('INVESTIGATOR');
  const [isActive, setIsActive] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể tải danh sách tài khoản.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (u: SystemUser | null = null) => {
    if (u) {
      setEditingUser(u);
      setBadgeId(u.badge_id);
      setFullName(u.full_name);
      setPassword(''); // Password empty by default when editing
      setRole(u.role);
      setIsActive(u.is_active);
    } else {
      setEditingUser(null);
      setBadgeId('');
      setFullName('');
      setPassword('');
      setRole('INVESTIGATOR');
      setIsActive(true);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeId.trim() || !fullName.trim()) return;

    setError(null);
    try {
      if (editingUser) {
        // Update user
        const payload: any = {
          full_name: fullName,
          role,
          is_active: isActive
        };
        // Only send password if updated
        if (password.trim()) {
          payload.password = password;
        }
        await api.put(`/api/auth/users/${editingUser.id}`, payload);
      } else {
        // Create user
        if (!password.trim()) {
          setError('Mật khẩu là bắt buộc khi tạo tài khoản mới.');
          return;
        }
        const payload = {
          badge_id: badgeId,
          full_name: fullName,
          password,
          role,
          is_active: isActive
        };
        await api.post('/api/auth/users', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi cập nhật tài khoản.');
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50/20">
      
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-800 flex items-center gap-2">
            <Users className="text-[#126DA6]" />
            QUẢN TRỊ TÀI KHOẢN NGƯỜI DÙNG
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Đăng ký, phân quyền vai trò (RBAC) và quản lý trạng thái tài khoản điều tra viên
          </p>
        </div>
 
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#126DA6] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
        >
          <UserPlus size={16} />
          <span>Đăng ký tài khoản mới</span>
        </button>
      </div>
 
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#991B1B] text-sm flex items-start gap-2.5 font-semibold">
          <AlertCircle className="shrink-0 mt-0.5 text-[#991B1B]" size={16} />
          <span>{error}</span>
        </div>
      )}
 
      {/* Users List Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#126DA6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-800 uppercase tracking-wider font-bold">
                  <th className="p-4">Số hiệu / Tài khoản</th>
                  <th className="p-4">Họ và tên</th>
                  <th className="p-4">Vai trò (Role)</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-right no-print">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-slate-800 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC]/55 transition-colors duration-100">
                    <td className="p-4 font-mono font-bold text-[#126DA6]">{u.badge_id}</td>
                    <td className="p-4 font-bold text-slate-800">{u.full_name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shadow-sm ${
                        u.role === 'ADMIN' 
                          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]' 
                          : u.role === 'LEADERSHIP'
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                          : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#126DA6]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      {u.is_active ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <UserCheck size={14} className="text-emerald-600" />
                          <span>Đang hoạt động</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500">
                          <UserX size={14} />
                          <span>Bị khóa</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-500 font-bold">
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right no-print">
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleOpenModal(u)}
                        className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#126DA6] text-slate-700 transition-colors duration-150 cursor-pointer inline-flex items-center gap-1 font-bold shadow-sm"
                      >
                        <Edit3 size={12} />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
 
      {/* USER REGISTRATION / UPDATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-2xl p-6 max-w-md w-full relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>
 
            <h3 className="text-base font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2 font-sans">
              <ShieldCheck size={18} className="text-[#126DA6]" />
              {editingUser ? 'Cập nhật tài khoản' : 'Đăng ký tài khoản mới'}
            </h3>
 
            <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-800">
              <div>
                <label htmlFor="user_badge_input" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Số hiệu CAND / Tài khoản (Badge ID)
                </label>
                <div className="relative">
                  <input
                    id="user_badge_input"
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder="Ví dụ: dtv_quochuy"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-slate-800 disabled:opacity-50 font-mono font-semibold"
                  />
                  <User className="absolute left-3 top-3 text-slate-400" size={16} />
                </div>
              </div>
 
              <div>
                <label htmlFor="user_name_input" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Họ và tên điều tra viên / Cán bộ
                </label>
                <input
                  id="user_name_input"
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Quốc Huy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800 font-semibold"
                />
              </div>
 
              <div>
                <label htmlFor="user_pass_input" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Mật khẩu đăng nhập {editingUser && '(Để trống nếu không muốn đổi)'}
                </label>
                <div className="relative">
                  <input
                    id="user_pass_input"
                    type="password"
                    required={!editingUser}
                    placeholder="Mật khẩu bảo mật"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-slate-800 font-mono font-semibold"
                  />
                  <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                </div>
              </div>
 
              <div>
                <label htmlFor="user_role_input" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Vai trò hệ thống (RBAC)
                </label>
                <select
                  id="user_role_input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#126DA6] focus:ring-1 focus:ring-[#126DA6] focus:outline-none rounded-lg p-2.5 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  <option value="INVESTIGATOR">INVESTIGATOR (Điều tra viên nghiệp vụ)</option>
                  <option value="LEADERSHIP">LEADERSHIP (Lãnh đạo cơ quan điều tra)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên hệ thống)</option>
                </select>
              </div>
 
              {editingUser && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="user_active_checkbox"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg text-[#126DA6] focus:ring-[#126DA6] focus:ring-offset-white cursor-pointer"
                  />
                  <label htmlFor="user_active_checkbox" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                    Tài khoản hoạt động bình thường
                  </label>
                </div>
              )}
 
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] px-4 py-2.5 rounded-lg cursor-pointer font-bold text-xs text-slate-600 transition-colors shadow-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#126DA6] hover:bg-[#1D4ED8] border border-[#126DA6] text-white px-5 py-2.5 rounded-lg cursor-pointer font-bold text-xs transition-colors shadow-sm"
                >
                  {editingUser ? 'Lưu cập nhật' : 'Đăng ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
