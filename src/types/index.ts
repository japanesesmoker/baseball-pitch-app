// Zone positions: 1-9 are strike zone, ball zones are outside
// Strike zone layout (from pitcher's perspective):
// [1][2][3]  high
// [4][5][6]  middle
// [7][8][9]  low
// Left = outside to RHB, Right = inside to RHB
export type StrikeZonePos = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type BallZonePos =
  | 'high'
  | 'low'
  | 'inner'
  | 'outer'
  | 'high-inner'
  | 'high-outer'
  | 'low-inner'
  | 'low-outer';
export type ZonePos = StrikeZonePos | BallZonePos;

// 6 pitch movement directions in PowerPro
export type PitchDirection = 'straight' | 'slider' | 'curve' | 'fork' | 'sinker' | 'shoot';

export const PITCH_DIRECTION_LABELS: Record<PitchDirection, string> = {
  straight: 'ストレート系',
  slider:   'スライダー系',
  curve:    'カーブ系',
  fork:     'フォーク系',
  sinker:   'シンカー系',
  shoot:    'シュート系',
};

export const ALL_DIRECTIONS: PitchDirection[] = [
  'straight', 'slider', 'curve', 'fork', 'sinker', 'shoot',
];

export interface PitchType {
  name: string;
  breakAmount: number; // 0-7
  direction: PitchDirection;
}

export interface PitchCall {
  pitchNumber: number; // 1-10
  pitchType: string;
  zone: ZonePos;
}

export interface PatternResult {
  id: string;
  patternId: number;
  batterHandedness: 'right' | 'left';
  result: 'hit' | 'out' | 'homerun';
  date: string;
}

export interface PitchPattern {
  id: number; // 1-50
  pitches: PitchCall[];
  results: PatternResult[];
}

export interface Pitcher {
  id: string;
  name: string;
  pitcherHand: 'right' | 'left';
  pitchTypes: PitchType[];
  patterns: PitchPattern[];
  createdAt: string;
  // Legacy optional fields (kept for backward compatibility)
  number?: number;
  team?: string;
  speed?: number;
  control?: string;
  controlValue?: number;
  stamina?: string;
  staminaValue?: number;
  specialAbilities?: string[];
}

export type BatterHandedness = 'right' | 'left';

export interface BatterResult {
  id: string;
  handedness: BatterHandedness;
  patternId: number;
  result: 'hit' | 'out' | 'homerun' | null;
  pitchCount: number;
  date: string;
}

export interface GameSession {
  id: string;
  pitcherId: string;
  batterResults: BatterResult[];
  startTime: string;
  endTime: string | null;
}

export type Screen =
  | 'menu'
  | 'pitcher-selection'
  | 'batter-selection'
  | 'pitch-display'
  | 'result-selection'
  | 'data'
  | 'data-load'
  | 'data-view'
  | 'data-view-patterns'
  | 'settings';

