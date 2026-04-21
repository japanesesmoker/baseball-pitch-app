import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Screen,
  Pitcher,
  GameSession,
  BatterResult,
  BatterHandedness,
  PatternResult,
} from '../types';

interface GameState {
  pitcherId: string;
  sessionId: string;
  batterIndex: number;
  currentHandedness: BatterHandedness;
  currentPatternId: number;
  currentPitchIndex: number; // 0-9
  currentBatterResult: BatterResult;
  pastBatters: BatterResult[];
}

interface Store {
  // Persistent
  pitchers: Pitcher[];
  sessions: GameSession[];

  // Navigation
  screen: Screen;
  viewingPitcherId: string | null;

  // Active game
  game: GameState | null;

  // Actions
  setScreen: (s: Screen) => void;
  setViewingPitcher: (id: string | null) => void;

  addPitcher: (p: Pitcher) => void;
  updatePitcher: (p: Pitcher) => void;
  deletePitcher: (id: string) => void;

  startGame: (pitcherId: string) => void;
  startBatter: (handedness: BatterHandedness) => void;
  nextPitch: () => void;
  prevPitch: () => void;
  goToPrevBatter: () => void;
  recordResult: (result: 'hit' | 'out' | 'homerun') => void;
  changePitcher: () => void;
  endGame: () => void;
  addPatternResult: (pitcherId: string, patternId: number, result: PatternResult) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      pitchers: [],
      sessions: [],
      screen: 'menu',
      viewingPitcherId: null,
      game: null,

      setScreen: (screen) => set({ screen }),
      setViewingPitcher: (id) => set({ viewingPitcherId: id }),

      addPitcher: (pitcher) =>
        set((state) => ({ pitchers: [...state.pitchers, pitcher] })),
      updatePitcher: (pitcher) =>
        set((state) => ({
          pitchers: state.pitchers.map((p) => (p.id === pitcher.id ? pitcher : p)),
        })),
      deletePitcher: (id) =>
        set((state) => ({ pitchers: state.pitchers.filter((p) => p.id !== id) })),

      startGame: (pitcherId) => {
        const sessionId = crypto.randomUUID();
        const session: GameSession = {
          id: sessionId,
          pitcherId,
          batterResults: [],
          startTime: new Date().toISOString(),
          endTime: null,
        };
        set((state) => ({
          sessions: [...state.sessions, session],
          screen: 'batter-selection',
          game: {
            pitcherId,
            sessionId,
            batterIndex: 0,
            currentHandedness: 'right',
            currentPatternId: 1,
            currentPitchIndex: 0,
            currentBatterResult: {
              id: crypto.randomUUID(),
              handedness: 'right',
              patternId: 1,
              result: null,
              pitchCount: 0,
              date: new Date().toISOString(),
            },
            pastBatters: [],
          },
        }));
      },

      startBatter: (handedness) => {
        const state = get();
        if (!state.game) return;
        const pitcher = state.pitchers.find((p) => p.id === state.game!.pitcherId);
        if (!pitcher) return;
        // Pick a random pattern
        const patternId = Math.floor(Math.random() * 20) + 1;
        set({
          screen: 'pitch-display',
          game: {
            ...state.game,
            currentHandedness: handedness,
            currentPatternId: patternId,
            currentPitchIndex: 0,
            currentBatterResult: {
              id: crypto.randomUUID(),
              handedness,
              patternId,
              result: null,
              pitchCount: 0,
              date: new Date().toISOString(),
            },
          },
        });
      },

      nextPitch: () => {
        const state = get();
        if (!state.game) return;
        const nextIndex = (state.game.currentPitchIndex + 1) % 10;
        set({
          game: {
            ...state.game,
            currentPitchIndex: nextIndex,
            currentBatterResult: {
              ...state.game.currentBatterResult,
              pitchCount: state.game.currentBatterResult.pitchCount + 1,
            },
          },
        });
      },

      prevPitch: () => {
        const state = get();
        if (!state.game) return;
        if (state.game.currentPitchIndex === 0) {
          // Go back to previous batter's result
          get().goToPrevBatter();
          return;
        }
        set({
          game: {
            ...state.game,
            currentPitchIndex: state.game.currentPitchIndex - 1,
          },
        });
      },

      goToPrevBatter: () => {
        const state = get();
        if (!state.game) return;
        const past = state.game.pastBatters;
        if (past.length === 0) return;
        const prevBatter = past[past.length - 1];
        set({
          screen: 'result-selection',
          game: {
            ...state.game,
            currentBatterResult: prevBatter,
            currentPatternId: prevBatter.patternId,
            currentHandedness: prevBatter.handedness,
            currentPitchIndex: prevBatter.pitchCount % 10,
            pastBatters: past.slice(0, past.length - 1),
          },
        });
      },

      recordResult: (result) => {
        const state = get();
        if (!state.game) return;
        const { pitcherId, sessionId, currentBatterResult, pastBatters, currentPatternId } = state.game;
        const updatedBatter: BatterResult = {
          ...currentBatterResult,
          result,
        };

        // Save result to pitcher pattern
        const patternResult: PatternResult = {
          id: crypto.randomUUID(),
          patternId: currentPatternId,
          batterHandedness: currentBatterResult.handedness,
          result,
          date: new Date().toISOString(),
        };
        get().addPatternResult(pitcherId, currentPatternId, patternResult);

        // Update session
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, batterResults: [...sess.batterResults, updatedBatter] }
              : sess
          ),
          screen: 'batter-selection',
          game: {
            ...s.game!,
            batterIndex: s.game!.batterIndex + 1,
            pastBatters: [...pastBatters, updatedBatter],
            currentBatterResult: {
              id: crypto.randomUUID(),
              handedness: 'right',
              patternId: 1,
              result: null,
              pitchCount: 0,
              date: new Date().toISOString(),
            },
          },
        }));
      },

      changePitcher: () => {
        const state = get();
        if (!state.game) return;
        // Save current batter as incomplete if needed
        set({ screen: 'pitcher-selection' });
      },

      endGame: () => {
        const state = get();
        if (!state.game) return;
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === s.game!.sessionId
              ? { ...sess, endTime: new Date().toISOString() }
              : sess
          ),
          game: null,
          screen: 'menu',
        }));
      },

      addPatternResult: (pitcherId, patternId, result) => {
        set((state) => ({
          pitchers: state.pitchers.map((p) => {
            if (p.id !== pitcherId) return p;
            return {
              ...p,
              patterns: p.patterns.map((pat) => {
                if (pat.id !== patternId) return pat;
                return { ...pat, results: [...pat.results, result] };
              }),
            };
          }),
        }));
      },
    }),
    {
      name: 'baseball-pitch-app-v1',
    }
  )
);
