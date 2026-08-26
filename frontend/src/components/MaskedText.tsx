import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface MaskedTextProps {
  text: string;
  type?: 'cccd' | 'phone' | 'name' | 'address' | 'general';
}

export const MaskedText: React.FC<MaskedTextProps> = ({ text, type = 'general' }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const getMaskedValue = (val: string) => {
    if (!val) return '';
    if (type === 'cccd') {
      // 12 digit CCCD: show first 3 and last 3 digits, mask middle
      if (val.length >= 6) {
        return `${val.slice(0, 3)}••••••${val.slice(-3)}`;
      }
      return '••••••••••••';
    }
    if (type === 'phone') {
      // Phone: show first 3 and last 2
      if (val.length >= 5) {
        return `${val.slice(0, 3)}•••••${val.slice(-2)}`;
      }
      return '••••••••';
    }
    if (type === 'name') {
      // Name: show first character of each word or just mask last part of name
      const parts = val.split(' ');
      if (parts.length > 1) {
        const lastName = parts[parts.length - 1];
        const maskedLastName = lastName[0] + '•'.repeat(lastName.length - 1);
        return [...parts.slice(0, -1), maskedLastName].join(' ');
      }
      return `${val[0] || ''}•••••`;
    }
    if (type === 'address') {
      // Address: show only first city/province and ward
      if (val.length > 10) {
        return `${val.slice(0, 6)}... (Đã ẩn địa chỉ chi tiết)`;
      }
      return '••••••••••••';
    }
    // General
    return '••••••••';
  };

  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      <span className={isRevealed ? "text-slate-100 font-medium" : "text-slate-400 select-none font-bold tracking-wider"}>
        {isRevealed ? text : getMaskedValue(text)}
      </span>
      <button
        type="button"
        onClick={() => setIsRevealed(!isRevealed)}
        className="p-1 rounded text-slate-400 hover:text-accent-gold hover:bg-navy-800 transition-colors duration-150"
        title={isRevealed ? "Ẩn thông tin nhạy cảm" : "Xem thông tin nhạy cảm (Yêu cầu quyền truy cập)"}
      >
        {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      {isRevealed && (
        <span className="flex items-center text-[10px] text-accent-amber animate-pulse bg-amber-950/30 border border-amber-900/50 px-1 py-0.5 rounded gap-0.5 select-none" title="Truy cập thông tin nhạy cảm đã được ghi nhận trong audit log">
          <ShieldAlert size={10} />
          <span>Đang Hiện</span>
        </span>
      )}
    </span>
  );
};
