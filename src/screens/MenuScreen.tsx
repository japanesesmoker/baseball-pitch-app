import { useStore } from '../store/useStore';

export function MenuScreen() {
  const { setScreen } = useStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-800 to-navy-900 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-2">⚾</div>
        <h1 className="text-3xl font-bold text-white tracking-wider">配球アドバイザー</h1>
        <p className="text-blue-300 text-sm mt-1">パワプロ 配球サポート</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => setScreen('pitcher-selection')}
          className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg transition-colors"
        >
          スタート
        </button>
        <button
          onClick={() => setScreen('data')}
          className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg transition-colors border border-white/20"
        >
          データ
        </button>
        <button
          onClick={() => setScreen('settings')}
          className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg transition-colors border border-white/20"
        >
          設定
        </button>
      </div>
    </div>
  );
}
