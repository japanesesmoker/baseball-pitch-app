import type { Pitcher } from '../types';
import { generatePatterns } from './patternGenerator';

export function createPitcher(
  data: Omit<Pitcher, 'id' | 'patterns' | 'createdAt'>
): Pitcher {
  const pitcher: Pitcher = {
    ...data,
    id: crypto.randomUUID(),
    patterns: [],
    createdAt: new Date().toISOString(),
  };
  pitcher.patterns = generatePatterns(pitcher);
  return pitcher;
}
