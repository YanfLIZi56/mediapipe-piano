import { useRef, useCallback } from 'react';
import { Note, ChordType, getChordFrequencies } from '@/lib/chords';

// 播放单个频率的简短测试音，用于验证音频是否工作
function playTestBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
  console.log('[音频] 测试音已播放，AudioContext state:', ctx.state);
}

export function useChordSynth() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const activeChordKeyRef = useRef<string | null>(null);
  const unlockedRef = useRef(false);

  const getCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
      console.log('[音频] 新建 AudioContext，state:', audioCtxRef.current.state);
    }
    return audioCtxRef.current;
  }, []);

  const unlockAudio = useCallback(async () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('[音频] AudioContext resumed，state:', ctx.state);
    }
    unlockedRef.current = true;
    playTestBeep(ctx);
  }, [getCtx]);

  const releaseAll = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const { osc, gain } of activeNodesRef.current) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.stop(now + 1.3);
      } catch (_) { /* 节点已停止 */ }
    }
    activeNodesRef.current = [];
    activeChordKeyRef.current = null;
  }, []);

  const playChord = useCallback(
    (note: Note, chordType: ChordType) => {
      const chordKey = `${note}${chordType}`;
      if (activeChordKeyRef.current === chordKey) return; // 幂等

      console.log('[和弦] 触发:', chordKey, '| 音频已解锁:', unlockedRef.current);

      if (!unlockedRef.current) {
        console.warn('[和弦] 音频未解锁，跳过播放');
        return;
      }

      const ctx = getCtx();
      if (ctx.state !== 'running') {
        console.warn('[和弦] AudioContext 未 running，当前 state:', ctx.state);
        ctx.resume().then(() => {
          console.log('[和弦] AudioContext resume 完成，重新触发');
          playChord(note, chordType);
        });
        return;
      }

      releaseAll();

      const frequencies = getChordFrequencies(note, chordType);
      const now = ctx.currentTime;

      // 简单混响 IR
      const irLen = ctx.sampleRate * 2;
      const irBuf = ctx.createBuffer(2, irLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = irBuf.getChannelData(ch);
        for (let i = 0; i < irLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
        }
      }
      const convolver = ctx.createConvolver();
      convolver.buffer = irBuf;

      const master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);

      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      wet.connect(ctx.destination);
      convolver.connect(wet);

      const newNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

      for (const freq of frequencies) {
        for (const detune of [0, 5]) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          osc.detune.value = detune;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.45, now + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.28, now + 0.4);
          osc.connect(gain);
          gain.connect(master);
          gain.connect(convolver);
          osc.start(now);
          newNodes.push({ osc, gain });
        }
      }

      activeNodesRef.current = newNodes;
      activeChordKeyRef.current = chordKey;
      console.log('[和弦] 播放成功:', chordKey, '| 频率:', frequencies);
    },
    [getCtx, releaseAll],
  );

  const stopChord = useCallback(() => {
    if (!activeChordKeyRef.current) return;
    console.log('[和弦] 停止:', activeChordKeyRef.current);
    releaseAll();
  }, [releaseAll]);

  return { playChord, stopChord, unlockAudio };
}