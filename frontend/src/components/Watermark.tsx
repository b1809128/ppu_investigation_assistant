import React, { useEffect, useState } from 'react';

interface WatermarkProps {
  username: string;
  ipAddress?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ username, ipAddress = 'LAN CỤC BỘ' }) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate a repeating grid of watermark labels
  const watermarkText = `${username} | ${ipAddress} | ${currentTime}`;
  const items = Array.from({ length: 48 });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none opacity-[0.04] grid grid-cols-4 gap-8 p-4">
      {items.map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-center font-mono text-[10px] sm:text-xs text-slate-100 whitespace-nowrap"
          style={{
            transform: 'rotate(-25deg)',
            margin: '2rem 1rem',
          }}
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
};
