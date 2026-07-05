import React from 'react';
import { FingerPosition } from '@/hooks/useHandTracking';

interface FingerCursorProps {
  position: FingerPosition | null;
  label: string;
  color: string;
}

export const FingerCursor: React.FC<FingerCursorProps> = ({ position, label, color }) => {
  if (!position) return null;

  // 将归一化坐标转为百分比（x 需要镜像）
  const left = `${(1 - position.x) * 100}%`;
  const top = `${position.y * 100}%`;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left,
        top,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* 十字准星 */}
      <div
        className="relative w-8 h-8 md:w-10 md:h-10"
        style={{ color }}
      >
        {/* 水平线 */}
        <div
          className="absolute top-1/2 left-0 w-full h-[1px]"
          style={{ backgroundColor: color, opacity: 0.8 }}
        />
        {/* 垂直线 */}
        <div
          className="absolute left-1/2 top-0 h-full w-[1px]"
          style={{ backgroundColor: color, opacity: 0.8 }}
        />
        {/* 中心圆 */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      {/* 标签 */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 text-[10px] font-mono whitespace-nowrap"
        style={{
          backgroundColor: 'rgba(0,0,0,0.7)',
          color,
          border: `1px solid ${color}`,
          borderRadius: '2px',
        }}
      >
        {label}
      </div>
    </div>
  );
};