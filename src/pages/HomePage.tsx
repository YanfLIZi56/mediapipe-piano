import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useChordSynth } from '@/hooks/useChordSynth';
import { useButtonHitTest, SectorHitArea } from '@/hooks/useButtonHitTest';
import { NOTES, CHORD_TYPES, Note, ChordType, getChordName } from '@/lib/chords';
import { RingMenu } from '@/components/RingMenu';

const HomePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { leftIndex, rightIndex, isReady, error } = useHandTracking(videoRef, canvasRef);
  const { playChord, stopChord, unlockAudio } = useChordSynth();
  const { registerLeftButton, registerRightButton, getActiveButtons } = useButtonHitTest();

  const prevChordRef = useRef<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // 同步 canvas 尺寸与容器
  useEffect(() => {
    const syncCanvas = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    syncCanvas();
    const ro = new ResizeObserver(syncCanvas);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 和弦触发逻辑
  useEffect(() => {
    if (!leftIndex && !rightIndex) {
      stopChord();
      prevChordRef.current = null;
      return;
    }

    const { activeNote, activeChordType } = getActiveButtons(leftIndex, rightIndex);

    if (activeNote && activeChordType) {
      const chordName = getChordName(activeNote, activeChordType);
      if (chordName !== prevChordRef.current) {
        playChord(activeNote, activeChordType);
        prevChordRef.current = chordName;
      }
    } else {
      stopChord();
      prevChordRef.current = null;
    }
  }, [leftIndex, rightIndex, getActiveButtons, playChord, stopChord]);

  // 扇区注册回调
  const handleChordSector = useCallback(
    (label: string, area: SectorHitArea) => {
      registerLeftButton(label as ChordType, area);
    },
    [registerLeftButton],
  );

  const handleNoteSector = useCallback(
    (label: string, area: SectorHitArea) => {
      registerRightButton(label as Note, area);
    },
    [registerRightButton],
  );

  const { activeNote, activeChordType } = getActiveButtons(leftIndex, rightIndex);
  const currentChordName =
    activeNote && activeChordType ? getChordName(activeNote, activeChordType) : null;

  const handleUnlockAudio = useCallback(async () => {
    await unlockAudio();
    setAudioUnlocked(true);
  }, [unlockAudio]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* 摄像头 + canvas 容器 */}
      <div ref={containerRef} className="video-container absolute inset-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          autoPlay
          playsInline
          muted
        />
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        />

        {/* 左侧 CHORD 圆环 */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
          <span
            className="text-[10px] font-mono tracking-widest"
            style={{ color: 'hsl(168 100% 50% / 0.5)' }}
          >
            CHORD
          </span>
          <RingMenu
            items={[...CHORD_TYPES]}
            activeItem={activeChordType}
            outerRadius={155}
            innerRadius={74}
            containerRef={containerRef}
            onSectorMount={handleChordSector}
          />
        </div>

        {/* 右侧 NOTE 圆环 */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
          <span
            className="text-[10px] font-mono tracking-widest"
            style={{ color: 'hsl(168 100% 50% / 0.5)' }}
          >
            NOTE
          </span>
          <RingMenu
            items={[...NOTES]}
            activeItem={activeNote}
            outerRadius={165}
            innerRadius={80}
            containerRef={containerRef}
            onSectorMount={handleNoteSector}
          />
        </div>
      </div>

      {/* 顶部状态栏 */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between pt-4 px-5">
        {/* 品牌标题 */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-base font-bold font-mono tracking-widest"
            style={{ color: 'hsl(168 100% 50%)', textShadow: '0 0 10px hsl(168 100% 50% / 0.8)' }}
          >
            MidiPipe
          </span>
          <span className="text-[9px] font-mono text-primary/40 leading-none self-end mb-0.5">
            powered by MediaPipe
          </span>
        </div>

        {/* 状态信息 */}
        <div className="glass-panel border border-primary/40 px-4 py-2 flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${isReady ? 'bg-primary' : 'bg-destructive'}`}
              style={{
                boxShadow: isReady
                  ? '0 0 6px hsl(168 100% 50%)'
                  : '0 0 6px hsl(24 100% 50%)',
              }}
            />
            <span className="text-xs font-mono text-primary/80">
              {error ?? (isReady ? 'TRACKING' : 'INITIALIZING...')}
            </span>
          </div>
          {currentChordName && (
            <div className="border-l border-primary/30 pl-3">
              <span
                className="text-base font-bold font-mono text-primary"
                style={{ textShadow: '0 0 10px hsl(168 100% 50%)' }}
              >
                {currentChordName}
              </span>
            </div>
          )}
          {!audioUnlocked && (
            <div className="border-l border-primary/30 pl-3">
              <span className="text-xs font-mono text-destructive animate-pulse">
                ⚠ 点击解锁音频
              </span>
            </div>
          )}
        </div>

        {/* 占位，保持 justify-between 对称 */}
        <div className="w-24" />
      </div>

      {/* 音频解锁 overlay */}
      {!audioUnlocked && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer"
          onClick={handleUnlockAudio}
        >
          <div className="glass-panel border border-primary/60 px-8 py-6 flex flex-col items-center gap-3 text-center">
            <div className="text-4xl">🎵</div>
            <div className="text-primary font-bold text-xl font-mono tracking-wider">
              点击启动音频
            </div>
            <div className="text-primary/60 text-xs font-mono">
              点击后会听到一声提示音，表示音频已就绪
            </div>
          </div>
        </div>
      )}

      {/* 底部提示 */}
      {audioUnlocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap">
          <div className="glass-panel border border-primary/20 px-4 py-1.5 text-[10px] font-mono text-primary/50 text-center">
            左手食指 → 左侧CHORD圆环 &nbsp;|&nbsp; 右手食指 → 右侧NOTE圆环 &nbsp;|&nbsp; 双指同时悬停演奏和弦
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
