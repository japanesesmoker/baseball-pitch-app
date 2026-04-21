import { useStore } from '../store/useStore';

export function DataScreen() {
  const { setScreen } = useStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => setScreen('menu')} className="text-white/70 hover:text-white text-lg">←</button>
        <h1 className="text-lg font-bold">データ</h1>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        <button
          onClick={() => setScreen('data-load')}
          className="bg-white rounded-2xl p-5 shadow flex items-center gap-4 text-left active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl">📸</div>
          <div>
            <div className="font-bold text-gray-800">投手データの登録</div>
            <div className="text-sm text-gray-500 mt-0.5">選手名と球種を入力して投手を登録</div>
          </div>
          <div className="ml-auto text-gray-300 text-xl">›</div>
        </button>

        <button
          onClick={() => setScreen('data-view')}
          className="bg-white rounded-2xl p-5 shadow flex items-center gap-4 text-left active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl">📊</div>
          <div>
            <div className="font-bold text-gray-800">投手データの閲覧</div>
            <div className="text-sm text-gray-500 mt-0.5">配球パターンと成績を確認</div>
          </div>
          <div className="ml-auto text-gray-300 text-xl">›</div>
        </button>
      </div>
    </div>
  );
}
