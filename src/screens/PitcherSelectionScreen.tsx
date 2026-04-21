import { useStore } from '../store/useStore';
import type { PitchDirection } from '../types';
import { PITCH_DIRECTION_LABELS } from '../types';

const DIRECTION_COLORS: Record<PitchDirection, string> = {
  straight: 'bg-blue-100 text-blue-700',
  slider:   'bg-purple-100 text-purple-700',
  curve:    'bg-green-100 text-green-700',
  fork:     'bg-orange-100 text-orange-700',
  sinker:   'bg-teal-100 text-teal-700',
  shoot:    'bg-pink-100 text-pink-700',
};

export function PitcherSelectionScreen() {
  const { pitchers, startGame, setScreen, game } = useStore();

  const handleSelect = (pitcherId: string) => {
    if (game) {
      useStore.setState(s => ({
        game: s.game ? { ...s.game, pitcherId } : null,
        screen: 'batter-selection',
      }));
    } else {
      startGame(pitcherId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => setScreen(game ? 'batter-selection' : 'menu')} className="text-white/70 hover:text-white text-lg">←</button>
        <h1 className="text-lg font-bold">投手を選択</h1>
      </div>

      <div className="flex-1 p-4">
        {pitchers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">投手データがありません</p>
            <p className="text-gray-400 text-sm mt-2">「データ」から投手を登録してください</p>
            <button onClick={() => setScreen('data')} className="mt-6 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold">
              データ登録へ
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pitchers.map(pitcher => (
              <button
                key={pitcher.id}
                onClick={() => handleSelect(pitcher.id)}
                className="bg-white rounded-2xl p-4 shadow flex items-center gap-4 text-left active:bg-gray-50 transition-colors"
              >
                <div className="w-14 h-14 bg-navy-800 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-xs opacity-70">{pitcher.pitcherHand === 'left' ? '左' : '右'}</span>
                  <span className="text-xl font-bold">⚾</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-800">{pitcher.name}</div>
                  <div className="text-xs text-gray-400 mb-1.5">
                    {pitcher.pitcherHand === 'left' ? '左投げ' : '右投げ'} / {pitcher.pitchTypes.length}球種
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pitcher.pitchTypes.map(p => (
                      <span key={p.name}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.direction ? (DIRECTION_COLORS[p.direction] ?? 'bg-gray-100 text-gray-600') : 'bg-blue-100 text-blue-700'
                        }`}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-gray-300 text-xl">›</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
