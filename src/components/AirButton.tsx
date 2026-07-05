import React, { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AirButtonProps {
  label: string;
  isActive: boolean;
  onMount?: (rect: DOMRect) => void;
}

export const AirButton: React.FC<AirButtonProps> = ({ label, isActive, onMount }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !onMount) return;

    const notify = () => {
      if (!ref.current) return;
      onMount(ref.current.getBoundingClientRect());
    };

    // requestAnimationFrame 确保父容器完成挂载并赋值 ref 后再测量
    const rafId = requestAnimationFrame(notify);
    window.addEventListener('resize', notify);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', notify);
    };
  // onMount 每次 render 都是新函数引用，刻意只依赖 label 避免无限触发
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex items-center justify-center',
        'w-16 h-11 md:w-20 md:h-12',
        'border text-sm md:text-base font-bold tracking-wider select-none',
        'glass-panel',
        isActive
          ? 'border-primary bg-primary text-primary-foreground scale-105'
          : 'border-primary/40 text-primary/70',
      )}
      style={{
        fontFamily: 'monospace',
        borderRadius: '2px',
        boxShadow: isActive
          ? '0 0 16px hsl(168 100% 50% / 0.9), 0 0 32px hsl(168 100% 50% / 0.5)'
          : undefined,
        transition: 'box-shadow 0.05s, transform 0.05s',
      }}
    >
      {label}
    </div>
  );
};