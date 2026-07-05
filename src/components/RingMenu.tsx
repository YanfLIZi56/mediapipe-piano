import React, { useLayoutEffect, useRef } from 'react';
import { SectorHitArea } from '@/hooks/useButtonHitTest';

interface RingMenuProps {
  /** 按钮标签数组 */
  items: string[];
  /** 激活的标签（命中的那个） */
  activeItem: string | null;
  /** 圆环外径（px，CSS 尺寸） */
  outerRadius?: number;
  /** 圆环内径（px，CSS 尺寸） */
  innerRadius?: number;
  /** 角度偏移（弧度），默认从 -π/2（顶部）开始 */
  angleOffset?: number;
  /** 容器 ref，用于计算归一化坐标 */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 每个扇区注册回调 */
  onSectorMount: (label: string, area: SectorHitArea) => void;
}

/** 将角度 + 半径转换为 SVG 坐标 */
function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

/** 生成扇形 SVG path（圆环扇区） */
function sectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const gap = 0.03; // 扇区之间的间隙角度（弧度）
  const s = startAngle + gap / 2;
  const e = endAngle - gap / 2;
  const largeArc = e - s > Math.PI ? 1 : 0;

  const p1 = polar(cx, cy, outerR, s);
  const p2 = polar(cx, cy, outerR, e);
  const p3 = polar(cx, cy, innerR, e);
  const p4 = polar(cx, cy, innerR, s);

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export const RingMenu: React.FC<RingMenuProps> = ({
  items,
  activeItem,
  outerRadius = 120,
  innerRadius = 58,
  angleOffset = -Math.PI / 2,
  containerRef,
  onSectorMount,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const size = outerRadius * 2 + 4; // SVG 尺寸（留 2px 边距）
  const cx = size / 2;
  const cy = size / 2;
  const n = items.length;
  const step = (2 * Math.PI) / n;

  // 注册每个扇区的碰撞区域
  useLayoutEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const svg = svgRef.current;
      const container = containerRef.current;
      if (!svg || !container) return;

      const svgRect = svg.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // SVG 圆心的像素位置（相对容器左上角）
      const absCx = svgRect.left - containerRect.left + cx;
      const absCy = svgRect.top - containerRect.top + cy;

      // 缩放比（SVG 实际像素 / SVG 逻辑像素）
      const scaleX = svgRect.width / size;

      items.forEach((label, i) => {
        const startAngle = angleOffset + i * step;
        const endAngle = angleOffset + (i + 1) * step;
        const area: SectorHitArea = {
          cx: absCx,
          cy: absCy,
          innerR: innerRadius * scaleX,
          outerR: outerRadius * scaleX,
          startAngle,
          endAngle,
          containerW: containerRect.width,
          containerH: containerRect.height,
        };
        onSectorMount(label, area);
      });
    });

    const handleResize = () => {
      // resize 后重新注册（通过再次触发 rAF）
      requestAnimationFrame(() => {
        const svg = svgRef.current;
        const container = containerRef.current;
        if (!svg || !container) return;
        const svgRect = svg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const absCx = svgRect.left - containerRect.left + cx;
        const absCy = svgRect.top - containerRect.top + cy;
        const scaleX = svgRect.width / size;
        items.forEach((label, i) => {
          const startAngle = angleOffset + i * step;
          const endAngle = angleOffset + (i + 1) * step;
          const area: SectorHitArea = {
            cx: absCx,
            cy: absCy,
            innerR: innerRadius * scaleX,
            outerR: outerRadius * scaleX,
            startAngle,
            endAngle,
            containerW: containerRect.width,
            containerH: containerRect.height,
          };
          onSectorMount(label, area);
        });
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.join(',')]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {items.map((label, i) => {
        const startAngle = angleOffset + i * step;
        const endAngle = angleOffset + (i + 1) * step;
        const midAngle = (startAngle + endAngle) / 2;
        const textR = (innerRadius + outerRadius) / 2;
        const textPos = polar(cx, cy, textR, midAngle);
        const isActive = activeItem === label;
        const path = sectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle);

        return (
          <g key={label}>
            <path
              d={path}
              fill={isActive ? 'hsl(168 100% 50% / 0.25)' : 'hsl(168 100% 50% / 0.06)'}
              stroke="hsl(168 100% 50%)"
              strokeWidth={isActive ? 2 : 1}
              style={{ transition: 'fill 0.08s, stroke-width 0.08s' }}
            />
            <text
              x={textPos.x}
              y={textPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isActive ? 'hsl(168 100% 50%)' : 'hsl(168 100% 50% / 0.7)'}
              fontSize={outerRadius < 140 ? 11 : 15}
              fontFamily="monospace"
              fontWeight={isActive ? 'bold' : 'normal'}
              style={{
                pointerEvents: 'none',
                textShadow: isActive ? '0 0 8px hsl(168 100% 50%)' : undefined,
              }}
            >
              {label}
            </text>
          </g>
        );
      })}
      {/* 中心孔（装饰圆） */}
      <circle
        cx={cx}
        cy={cy}
        r={innerRadius - 6}
        fill="none"
        stroke="hsl(168 100% 50% / 0.2)"
        strokeWidth={1}
      />
    </svg>
  );
};
