import { useStore } from '../store/useStore';
import type { BatterHandedness } from '../types';

export function BatterSelectionScreen() {
  const { startBatter, game, pitchers, setScreen } = useStore();
  const pitcher = pitchers.find((p) => p.id === game?.pitcherId);

  const handleSelect = (h: BatterHandedness) => {
    startBatter(h);
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

        <button
          onClick={() => setScreen('pitcher-selection')}
          className="text-gray-400 text-sm mt-4"
        >
          投手を変更する
        </button>
      </div>
    </div>
  );
}
