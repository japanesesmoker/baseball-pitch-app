import type { Pitcher, PitchPattern, PitchCall, ZonePos, PitchDirection } from '../types';

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function weightedRandom<T>(items: [T, number][], rng: () => number): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return items[0][0];
  let r = rng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

// ─── Pitch speed table ────────────────────────────────────────────────────────

const PITCH_SPEED: Record<string, number> = {
  'ストレート': 15, '全力ストレート': 15,
  'ツーシームファスト': 14,
  'ムービングファスト': 13, 'Hスライダー': 13, 'カットボール': 13,
  'Hシュート': 13, 'シンキングツーシーム': 13,
  'SFF': 12, 'シュート': 12,
  'Vスライダー': 11, 'Hシンカー': 11,
  'スライダー': 10, 'スラーブ': 10, 'パワーカーブ': 10, 'フォーク': 10,
  'ドロップカーブ': 9, 'ナックルカーブ': 9, 'ドロップ': 9, 'シンカー/スクリュー': 9,
  'チェンジアップ': 8, 'パーム': 8, 'サークルチェンジ': 8,
  'カーブ': 7, 'ナックル': 7,
  'スローカーブ': 5,
  '超スローボール': 1,
};

function getSpeed(name: string): number {
  return PITCH_SPEED[name] ?? 10;
}

// ─── Zone analysis ────────────────────────────────────────────────────────────

type Height = 'high' | 'mid' | 'low';
type Column = 'inner' | 'center' | 'outer';

function zoneHeight(z: ZonePos): Height {
  if (typeof z === 'number') return z <= 3 ? 'high' : z <= 6 ? 'mid' : 'low';
  if (z.startsWith('high')) return 'high';
  if (z.startsWith('low')) return 'low';
  return 'mid';
}

function zoneColumn(z: ZonePos): Column {
  if (typeof z === 'number') {
    if (z % 3 === 1) return 'inner'; // 1,4,7
    if (z % 3 === 0) return 'outer'; // 3,6,9
    return 'center'; // 2,5,8
  }
  if (z.includes('inner')) return 'inner';
  if (z.includes('outer')) return 'outer';
  return 'center';
}

function isBallZone(z: ZonePos): boolean {
  return typeof z === 'string';
}

// ─── Candidate zones per pitch direction ──────────────────────────────────────

// Returns zones appropriate for this pitch's natural break direction.
// Zone 5 (true center) is NEVER included anywhere.
function candidateZones(dir: PitchDirection, hand: 'right' | 'left'): ZonePos[] {
  const rh = hand === 'right';
  switch (dir) {
    case 'straight':
      // Fastball: corners and high/inner are preferred. Never center.
      return [1, 3, 4, 6, 7, 9, 2, 8, 'high-inner', 'high-outer', 'inner', 'outer', 'high'];
    case 'slider':
      // RHP slides away from RHB → outer side (zones 3,6,9)
      return rh
        ? [3, 6, 9, 1, 4, 7, 'outer', 'low-outer', 'high-outer', 'low']
        : [1, 4, 7, 3, 6, 9, 'inner', 'low-inner', 'high-inner', 'low'];
    case 'curve':
      // Big downward break → start high, land low
      return [1, 2, 3, 7, 8, 9, 'high', 'low', 'low-outer', 'high-outer', 'high-inner'];
    case 'fork':
      // Drops straight down → low and ball-low are prime
      return [7, 8, 9, 4, 6, 'low', 'low-inner', 'low-outer'];
    case 'sinker':
      // Down + arm side (RHP arm → inner = zones 1,4,7)
      return rh
        ? [7, 4, 8, 1, 9, 'low', 'low-inner', 'inner']
        : [9, 6, 8, 3, 7, 'low', 'low-outer', 'outer'];
    case 'shoot':
      // Runs toward same-side batter (RHP → inner = zones 1,4,7)
      return rh
        ? [1, 4, 7, 3, 6, 'inner', 'low-inner', 'high-inner']
        : [3, 6, 9, 1, 4, 'outer', 'low-outer', 'high-outer'];
    default:
      return [1, 3, 4, 6, 7, 9, 'inner', 'outer', 'high', 'low'];
  }
}

// ─── Strategic zone selection ─────────────────────────────────────────────────

function selectZone(
  dir: PitchDirection,
  hand: 'right' | 'left',
  history: PitchCall[],
  rng: () => number
): ZonePos {
  const prev  = history[history.length - 1];
  const prev2 = history[history.length - 2];

  const prevH  = prev  ? zoneHeight(prev.zone)  : null;
  const prevC  = prev  ? zoneColumn(prev.zone)  : null;
  const prev2H = prev2 ? zoneHeight(prev2.zone) : null;
  const prev2C = prev2 ? zoneColumn(prev2.zone) : null;

  const bases = candidateZones(dir, hand);

  const weighted: [ZonePos, number][] = bases.map(z => {
    let w = 1.0;
    const h = zoneHeight(z);
    const c = zoneColumn(z);

    // Zone 5 absolute ban (should already be excluded, but guard here too)
    if (z === 5) return [z, 0];

    // Never same zone as previous pitch
    if (prev && z === prev.zone) return [z, 0];

    // ── Height rules ──────────────────────────────────────────────────────
    if (prevH) {
      if (h === prevH) {
        // Same height as previous: heavily penalise
        w *= 0.15;
        // Three in a row same height: forbidden
        if (prev2H === prevH) return [z, 0];
      } else {
        // Different height: bonus
        if (prevH === 'high' && h === 'low')  w *= 3.5; // high→low: strongest pattern
        if (prevH === 'low'  && h === 'high') w *= 2.5; // low→high: strong
        if (prevH === 'mid')                   w *= 1.8; // from mid: any change is good
      }
    }

    // ── Column rules ──────────────────────────────────────────────────────
    if (prevC) {
      if (c === prevC && c !== 'center') {
        w *= 0.3;
        // Three in a row same column: forbidden
        if (prev2C === prevC) return [z, 0];
      } else if (c !== prevC && c !== 'center') {
        w *= 1.6; // switching inner/outer is good
      }
    }

    // ── General penalties/bonuses ─────────────────────────────────────────

    // Avoid dead center column (zones 2, 8, 'high', 'low' without inner/outer spec)
    if (c === 'center') w *= 0.25;

    // Corners are prime pitching locations
    if (typeof z === 'number' && [1, 3, 7, 9].includes(z)) w *= 1.4;

    // Ball zones: use occasionally for disruption (waste pitch strategy)
    // Give them reasonable weight but not as high as strike zones
    if (isBallZone(z)) {
      // After 2+ consecutive strikes, ball zone is attractive
      const recentBalls = history.slice(-2).filter(p => isBallZone(p.zone)).length;
      w *= recentBalls < 1 ? 0.6 : 0.3;
    }

    return [z, Math.max(0, w)];
  });

  // Fallback: if all weights are zero, pick any non-center zone
  const fallback: ZonePos[] = [1, 3, 7, 9, 4, 6];
  const allZero = weighted.every(([, w]) => w <= 0);
  if (allZero) return fallback[Math.floor(rng() * fallback.length)];

  return weightedRandom(weighted, rng);
}

// ─── Pitch rank system ────────────────────────────────────────────────────────

type PitchRank = 'straight' | 'zenryoku' | 'A' | 'B' | 'C' | 'D' | 'other';

const RANK_A = new Set(['カットボール', 'Hスライダー', 'Hシュート', 'SFF', 'フォーク']);
const RANK_B = new Set(['Vスライダー', 'Hシンカー', 'チェンジアップ', 'シュート', 'スライダー', 'シンカー/スクリュー', 'シンキングツーシーム']);
const RANK_C = new Set(['パーム', 'ナックルカーブ', 'サークルチェンジ', 'カーブ', 'スローカーブ', 'ドロップ', 'ドロップカーブ', 'スラーブ']);

function getPitchRank(name: string): PitchRank {
  if (name === 'ストレート') return 'straight';
  if (name === '全力ストレート') return 'zenryoku';
  if (RANK_A.has(name)) return 'A';
  if (RANK_B.has(name)) return 'B';
  if (RANK_C.has(name)) return 'C';
  if (name === 'ナックル') return 'D';
  return 'other';
}

// ─── Strategic pitch selection ────────────────────────────────────────────────
//
// 10球の使用制限:
//   通常ストレート: 3球以上  全力ストレート: 0〜1球
//   Aランク: 2〜3球  Bランク: 2〜3球  C/Dランク: 各0〜1球
// 連続ルール:
//   同球種3連投禁止（通常ストレート除く）
//   C/D連続禁止  C/D使用後は次をストレートorAに固定

function selectPitch(
  pitchTypes: Pitcher['pitchTypes'],
  pitchIndex: number,
  history: PitchCall[],
  zenryokuUsed: boolean,
  rng: () => number
): Pitcher['pitchTypes'][number] {
  const prev  = history[history.length - 1];
  const prev2 = history[history.length - 2];
  const prevName  = prev?.pitchType;
  const prev2Name = prev2?.pitchType;
  const prevSpeed = prev ? getSpeed(prev.pitchType) : null;
  const prevRank  = prev ? getPitchRank(prev.pitchType) : null;

  // Count current usage by rank
  const counts: Record<PitchRank, number> = { straight: 0, zenryoku: 0, A: 0, B: 0, C: 0, D: 0, other: 0 };
  for (const p of history) counts[getPitchRank(p.pitchType)]++;

  const hasRank = (r: PitchRank) => pitchTypes.some(p => getPitchRank(p.name) === r);
  const remaining = 10 - pitchIndex; // slots remaining including this pitch

  // How many of each we still need to meet minimums
  const straightNeeded = Math.max(0, 3 - counts.straight);
  const aNeeded = hasRank('A') ? Math.max(0, 2 - counts.A) : 0;
  const bNeeded = hasRank('B') ? Math.max(0, 2 - counts.B) : 0;
  const totalNeeded = straightNeeded + aNeeded + bNeeded;

  const weighted: [Pitcher['pitchTypes'][number], number][] = pitchTypes.map(p => {
    const rank = getPitchRank(p.name);
    const speed = getSpeed(p.name);
    let w = 1.0;

    // ── Hard constraints ──────────────────────────────────────────────────

    // 全力ストレート: max 1, only from pitch 6+
    if (rank === 'zenryoku') {
      if (zenryokuUsed) return [p, 0];
      if (pitchIndex < 5) return [p, 0];
    }

    // Max count limits per rank
    if (rank === 'A' && counts.A >= 3) return [p, 0];
    if (rank === 'B' && counts.B >= 3) return [p, 0];
    if (rank === 'C' && counts.C >= 1) return [p, 0];
    if (rank === 'D' && counts.D >= 1) return [p, 0];

    // After C or D: next must be ストレート or A rank
    if (prevRank === 'C' || prevRank === 'D') {
      if (rank !== 'straight' && rank !== 'A') return [p, 0];
    }

    // C and D cannot be used consecutively
    if ((rank === 'C' || rank === 'D') && (prevRank === 'C' || prevRank === 'D')) {
      return [p, 0];
    }

    // No 3 in a row same pitch (ストレート is exempt)
    if (rank !== 'straight' && prevName === p.name && prev2Name === p.name) return [p, 0];

    // First pitch must always be ストレート
    if (pitchIndex === 0 && rank !== 'straight') return [p, 0];

    // Minimum enforcement: when all remaining slots must fill needed pitches
    if (totalNeeded >= remaining) {
      const isNeeded = (rank === 'straight' && straightNeeded > 0)
                    || (rank === 'A' && aNeeded > 0)
                    || (rank === 'B' && bNeeded > 0);
      if (!isNeeded) return [p, 0];
    }

    // Force straight when it's the only way to meet the minimum
    if (straightNeeded >= remaining && rank !== 'straight') return [p, 0];

    // Avoid C/D in the first 3 pitches
    if ((rank === 'C' || rank === 'D') && pitchIndex < 3) return [p, 0];

    // ── Soft weights ─────────────────────────────────────────────────────

    // Boost pitches needed to meet minimums
    if (rank === 'straight' && straightNeeded > 0) w *= 4.0;
    if (rank === 'A' && aNeeded > 0) w *= 3.0;
    if (rank === 'B' && bNeeded > 0) w *= 2.5;

    // Suppress C/D — they are accent pitches used sparingly
    if (rank === 'C' || rank === 'D') w *= 0.35;

    // Speed variation
    if (prevSpeed !== null) {
      const diff = Math.abs(speed - prevSpeed);
      if (diff >= 6) w *= 3.0;
      if (diff >= 4) w *= 1.8;
      if (diff <= 1) w *= 0.4;
      if (diff === 0) w *= 0.2;
      if (prevSpeed >= 13 && speed <= 10) w *= 2.0;
      if (prevSpeed <= 9  && speed >= 13) w *= 2.0;
    }

    // Same pitch consecutive penalty (ストレート exempt)
    if (rank !== 'straight' && prevName === p.name) w *= 0.1;

    return [p, Math.max(0, w)];
  });

  const allZero = weighted.every(([, w]) => w <= 0);
  if (allZero) {
    return pitchTypes.find(p => p.name === 'ストレート') ?? pitchTypes[0];
  }

  return weightedRandom(weighted, rng);
}

// ─── Main pattern generator ───────────────────────────────────────────────────

export function generatePatterns(pitcher: Pitcher): PitchPattern[] {
  const patterns: PitchPattern[] = [];
  const hand = pitcher.pitcherHand ?? 'right';

  // Unique seed per pitcher + pattern index
  const nameSeed = pitcher.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  for (let i = 0; i < 20; i++) {
    const seed = nameSeed * 137 + i * 53 + 1234567;
    const rng = seededRandom(seed);

    const pitches: PitchCall[] = [];
    let zenryokuUsed = false;

    for (let j = 0; j < 10; j++) {
      const pt = selectPitch(pitcher.pitchTypes, j, pitches, zenryokuUsed, rng);
      if (pt.name === '全力ストレート') zenryokuUsed = true;

      const zone = selectZone(pt.direction, hand, pitches, rng);

      pitches.push({ pitchNumber: j + 1, pitchType: pt.name, zone });
    }

    patterns.push({ id: i + 1, pitches, results: [] });
  }

  return patterns;
}
