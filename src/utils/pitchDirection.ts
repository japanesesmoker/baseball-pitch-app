import type { PitchDirection } from '../types';
import { ALL_DIRECTIONS } from '../types';

export interface PitchDefinition {
  name: string;
  direction: PitchDirection;
}

// Complete pitch list for Jikkyou Power Pro Baseball
export const PITCH_LIST: PitchDefinition[] = [
  // ストレート系
  { name: 'ストレート',         direction: 'straight' },
  { name: '全力ストレート',      direction: 'straight' },
  { name: 'ツーシームファスト',  direction: 'straight' },
  { name: 'ムービングファスト',  direction: 'straight' },
  { name: '超スローボール',      direction: 'straight' },
  // スライダー系
  { name: 'スライダー',   direction: 'slider' },
  { name: 'Hスライダー',  direction: 'slider' },
  { name: 'カットボール', direction: 'slider' },
  // カーブ系
  { name: 'カーブ',         direction: 'curve' },
  { name: 'スローカーブ',    direction: 'curve' },
  { name: 'ドロップカーブ',  direction: 'curve' },
  { name: 'スラーブ',       direction: 'curve' },
  { name: 'ナックルカーブ',  direction: 'curve' },
  { name: 'パワーカーブ',    direction: 'curve' },
  { name: 'ドロップ',       direction: 'curve' },
  // フォーク系
  { name: 'フォーク',       direction: 'fork' },
  { name: 'SFF',           direction: 'fork' },
  { name: 'チェンジアップ',  direction: 'fork' },
  { name: 'Vスライダー',    direction: 'fork' },
  { name: 'パーム',         direction: 'fork' },
  { name: 'ナックル',       direction: 'fork' },
  // シンカー系
  { name: 'シンカー/スクリュー', direction: 'sinker' },
  { name: 'Hシンカー',          direction: 'sinker' },
  { name: 'サークルチェンジ',    direction: 'sinker' },
  // シュート系
  { name: 'シュート',           direction: 'shoot' },
  { name: 'Hシュート',          direction: 'shoot' },
  { name: 'シンキングツーシーム', direction: 'shoot' },
];

export const PITCH_LIST_BY_DIRECTION = Object.fromEntries(
  ALL_DIRECTIONS.map(dir => [dir, PITCH_LIST.filter(p => p.direction === dir)])
) as Record<PitchDirection, PitchDefinition[]>;

export function detectPitchDirection(pitchName: string): PitchDirection {
  // Exact match first (handles all game pitch names)
  const found = PITCH_LIST.find(p => p.name === pitchName);
  if (found) return found.direction;

  // Fallback for OCR slight name variations
  if (/フォーク|SFF|パーム|ナックル|チェンジアップ|Vスライダー/.test(pitchName)) return 'fork';
  if (/シンカー|スクリュー|Hシンカー|サークルチェンジ/.test(pitchName)) return 'sinker';
  if (/シュート|Hシュート|シンキング/.test(pitchName)) return 'shoot';
  if (/スライダー|カットボール/.test(pitchName)) return 'slider';
  if (/カーブ|ドロップ|スラーブ/.test(pitchName)) return 'curve';
  return 'straight';
}
