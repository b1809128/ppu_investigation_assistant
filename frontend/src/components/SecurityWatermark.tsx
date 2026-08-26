import React, { useEffect, useState } from 'react';

interface SecurityWatermarkProps {
  fullName: string;
  ipAddress?: string;
}

export const SecurityWatermark: React.FC<SecurityWatermarkProps> = ({ 
  fullName, 
  ipAddress = '127.0.0.1' 
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const watermarkText = `MẬT - ${fullName} - ${ipAddress} - ${timeStr}`;
  const gridItems = Array.from({ length: 40 });

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none opacity-[0.05] grid grid-cols-2 md:grid-cols-4 gap-x-16 gap-y-24 p-8">
      {gridItems.map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-center font-mono text-[9px] md:text-xs text-slate-350 whitespace-nowrap tracking-wider font-semibold"
          style={{
            transform: 'rotate(-25deg)',
            margin: '3rem 1.5rem',
          }}
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
};
export default SecurityWatermark;
