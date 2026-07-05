import { useCallback, useRef } from 'react';
import { Note, ChordType, NOTES, CHORD_TYPES } from '@/lib/chords';
import { FingerPosition } from './useHandTracking';

/** 扇形碰撞区域（像素坐标系，相对容器左上角） */
export interface SectorHitArea {
  cx: number;        // 圆心 x（像素）
  cy: number;        // 圆心 y（像素）
  innerR: number;    // 内径（像素）
  outerR: number;    // 外径（像素）
  startAngle: number; // 起始角度（弧度，Math.atan2 标准坐标系）
  endAngle: number;   // 结束角度（弧度）
  containerW: number; // 注册时容器宽度（用于还原像素坐标）
  containerH: number; // 注册时容器高度
}

/** 扇形碰撞检测 */
function sectorHitTest(pos: FingerPosition, sector: SectorHitArea): boolean {
  // MediaPipe 坐标镜像后转像素
  const px = (1 - pos.x) * sector.containerW;
  const py = pos.y * sector.containerH;
  const dx = px - sector.cx;
  const dy = py - sector.cy;
  const r = Math.sqrt(dx * dx + dy * dy);
  if (r < sector.innerR || r > sector.outerR) return false;

  let angle = Math.atan2(dy, dx); // -π ~ π

  // 将角度范围统一到同一 2π 区间内比较
  const normalize = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const a = normalize(angle);
  const s = normalize(sector.startAngle);
  let e = normalize(sector.endAngle);
  if (e <= s) e += 2 * Math.PI; // 跨越 0/2π 边界
  const a2 = a < s ? a + 2 * Math.PI : a;
  return a2 >= s && a2 <= e;
}

export function useButtonHitTest() {
  const leftButtonsRef = useRef<Map<ChordType, SectorHitArea>>(new Map());
  const rightButtonsRef = useRef<Map<Note, SectorHitArea>>(new Map());

  const registerLeftButton = useCallback((type: ChordType, area: SectorHitArea) => {
    leftButtonsRef.current.set(type, area);
  }, []);

  const registerRightButton = useCallback((note: Note, area: SectorHitArea) => {
    rightButtonsRef.current.set(note, area);
  }, []);

  const getActiveButtons = useCallback(
    (leftPos: FingerPosition | null, rightPos: FingerPosition | null) => {
      let activeNote: Note | null = null;
      let activeChordType: ChordType | null = null;

      // 用户左手（leftPos）镜像后在屏幕左侧 → 检测左侧 CHORD 圆环
      if (leftPos) {
        for (const type of CHORD_TYPES) {
          const area = leftButtonsRef.current.get(type);
          if (area && sectorHitTest(leftPos, area)) {
            activeChordType = type;
            break;
          }
        }
      }

      // 用户右手（rightPos）镜像后在屏幕右侧 → 检测右侧 NOTE 圆环
      if (rightPos) {
        for (const note of NOTES) {
          const area = rightButtonsRef.current.get(note);
          if (area && sectorHitTest(rightPos, area)) {
            activeNote = note;
            break;
          }
        }
      }

      return { activeNote, activeChordType };
    },
    [],
  );

  return { registerLeftButton, registerRightButton, getActiveButtons };
}