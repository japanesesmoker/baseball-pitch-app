import { useStore } from '../store/useStore';

export function ResultSelectionScreen() {
  const { game, pitchers, recordResult, changePitcher, setScreen } = useStore();

  const pitcher = pitchers.find((p) => p.id === game?.pitcherId);
  if (!game || !pitcher) return null;

  const handedness = game.currentHandedness;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4">
        <div className="text-xs text-blue-300 mb-1">
          {pitcher.name} / 第{(game.batterIndex ?? 0) + 1}打者（{handedness === 'right' ? '右' : '左'}）
        </div>
        <h1 className="text-lg font-bold">この打席の結果は？</h1>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6">
        {/* At-bat result */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">打席結果</p>
          <div className="flex gap-3">
            <button
              onClick={() => recordResult('out')}
              className="flex-1 bg-white border-2 border-green-400 rounded-2xl p-4 flex flex-col items-center gap-2 shadow active:bg-green-50 transition-colors"
            >
              <span className="text-3xl">✅</span>
              <span className="font-bold text-green-600">アウト</span>
            </button>
            <button
              onClick={() => recordResult('hit')}
              className="flex-1 bg-white border-2 border-yellow-400 rounded-2xl p-4 flex flex-col items-center gap-2 shadow active:bg-yellow-50 transition-colors"
            >
              <span className="text-3xl">🟡</span>
              <span className="font-bold text-yellow-600">ヒット</span>
            </button>
            <button
              onClick={() => recordResult('homerun')}
              className="flex-1 bg-white border-2 border-red-400 rounded-2xl p-4 flex flex-col items-center gap-2 shadow active:bg-red-50 transition-colors"
            >
              <span className="text-3xl">🔴</span>
              <span className="font-bold text-red-500">HR</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Game control */}
        <div>
          <button
            onClick={() => changePitcher()}
            className="w-full bg-white border border-gray-200 rounded-xl py-4 px-6 font-bold text-gray-700 shadow flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
          >
            <span>🔄</span> 投手交代
          </button>
        </div>

        {/* Back to pitching */}
        <button
          onClick={() => setScreen('pitch-display')}
          className="text-center text-blue-500 text-sm py-2"
        >
          ← 配球画面に戻る
        </button>
      </div>
    </div>
  );
}
