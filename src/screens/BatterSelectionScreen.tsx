import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { BatterHandedness } from '../types';

export function BatterSelectionScreen() {
  const { startBatter, game, pitchers, changePitcher, endGame } = useStore();
  const pitcher = pitchers.find((p) => p.id === game?.pitcherId);
  const [showIppatsushobu, setShowIppatsushobu] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Find the pattern with the highest out rate across all results
  const bestPatternId = (() => {
    if (!pitcher) return null;
    let bestId: number | null = null;
    let bestRate = -1;
    for (const pat of pitcher.patterns) {
      const total = pat.results.length;
      if (total === 0) continue;
      const outs = pat.results.filter(r => r.result === 'out').length;
      const rate = outs / total;
      if (rate > bestRate) { bestRate = rate; bestId = pat.id; }
    }
    return bestId;
  })();

  const handleSelect = (h: BatterHandedness) => {
    startBatter(h);
  };

  const handleIppatsushobu = (h: BatterHandedness) => {
    const pid = bestPatternId ?? Math.floor(Math.random() * 20) + 1;
    startBatter(h, pid);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4">
        <div className="text-xs text-blue-300 mb-1">
          {pitcher?.name} / 第{(game?.batterIndex ?? 0) + 1}打者
        </div>
        <h1 className="text-lg font-bold">打者の打席を選択</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <p className="text-gray-600 text-base font-medium">相手打者はどちら？</p>

        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => handleSelect('right')}
            className="flex-1 bg-white border-2 border-blue-500 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-md active:bg-blue-50 transition-colors"
          >
            <span className="text-4xl">🏏</span>
            <span className="font-bold text-xl text-navy-800">右打ち</span>
            <span className="text-sm text-gray-400">Right-handed</span>
          </button>

          <button
            onClick={() => handleSelect('left')}
            className="flex-1 bg-white border-2 border-red-400 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-md active:bg-red-50 transition-colors"
          >
            <span className="text-4xl" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🏏</span>
            <span className="font-bold text-xl text-navy-800">左打ち</span>
            <span className="text-sm text-gray-400">Left-handed</span>
          </button>
        </div>

        {/* 一発勝負 */}
        <div className="w-full max-w-sm">
          {!showIppatsushobu ? (
            <button
              onClick={() => setShowIppatsushobu(true)}
              className="w-full bg-yellow-400 rounded-2xl py-4 font-bold text-white text-lg shadow-md active:bg-yellow-500 transition-colors"
            >
              ⚡ 一発勝負
            </button>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 flex flex-col gap-3">
              <div className="text-center">
                <p className="font-bold text-yellow-700 text-sm">最高アウト率パターンで勝負！</p>
                {bestPatternId !== null ? (
                  <p className="text-xs text-yellow-600 mt-0.5">パターン {bestPatternId} を使用</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">データなし→ランダム選択</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleIppatsushobu('right')}
                  className="flex-1 bg-yellow-400 rounded-xl py-3 font-bold text-white active:bg-yellow-500"
                >
                  右打ち
                </button>
                <button
                  onClick={() => handleIppatsushobu('left')}
                  className="flex-1 bg-yellow-400 rounded-xl py-3 font-bold text-white active:bg-yellow-500"
                >
                  左打ち
                </button>
              </div>
              <button
                onClick={() => setShowIppatsushobu(false)}
                className="text-xs text-gray-400 text-center py-1"
              >
                キャンセル
              </button>
            </div>
          )}
        </div>

        {/* Game controls */}
        <div className="w-full max-w-sm flex flex-col gap-2 mt-2">
          <button
            onClick={() => changePitcher()}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 font-bold text-gray-700 shadow flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
          >
            <span>🔄</span> 投手交代
          </button>
          {confirmEnd ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm font-bold text-center mb-2">試合を終了しますか？</p>
              <div className="flex gap-2">
                <button
                  onClick={() => endGame()}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold"
                >
                  終了する
                </button>
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmEnd(true)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 font-bold text-gray-400 shadow flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
            >
              <span>🏁</span> 試合終了
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
