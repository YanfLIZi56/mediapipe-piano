// 和弦音符映射表
export const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export const CHORD_TYPES = ['maj', 'min', 'add9', 'maj7', 'min7', '7'] as const;

export type Note = typeof NOTES[number];
export type ChordType = typeof CHORD_TYPES[number];

// 各音符对应的根音频率（第4八度）
const ROOT_FREQUENCIES: Record<Note, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.00,
  A: 440.00,
  B: 493.88,
};

// 和弦音程（半音数）
const CHORD_INTERVALS: Record<ChordType, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  add9: [0, 4, 7, 14],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
};

// 半音转频率倍数
function semitoneToRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

// 获取和弦的所有音符频率
export function getChordFrequencies(note: Note, chordType: ChordType): number[] {
  const root = ROOT_FREQUENCIES[note];
  const intervals = CHORD_INTERVALS[chordType];
  return intervals.map((semitone) => root * semitoneToRatio(semitone));
}

// 获取和弦名称
export function getChordName(note: Note, chordType: ChordType): string {
  return `${note}${chordType}`;
}