import { useStore } from '../store/useStore';

export function DataViewScreen() {
  const { pitchers, setScreen, setViewingPitcher } = useStore();

  const handleView = (id: string) => {
    setViewingPitcher(id);
    setScreen('data-view-patterns');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => setScreen('data')} className="text-white/70 hover:text-white text-lg">←</button>
        <h1 className="text-lg font-bold">投手データの閲覧</h1>
      </div>

      <div className="flex-1 p-4">
        {pitchers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500">登録された投手データがありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pitchers.map((pitcher) => {
              const totalResults = pitcher.patterns.flatMap((p) => p.results);
              const outCount = totalResults.filter((r) => r.result === 'out').length;
              const total = totalResults.length;
              const outRate = total > 0 ? Math.round((outCount / total) * 100) : null;

              return (
                <button
                  key={pitcher.id}
                  onClick={() => handleView(pitcher.id)}
                  className="bg-white rounded-2xl p-4 shadow flex items-center gap-4 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-white font-bold">
                    {pitcher.number}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{pitcher.name}</div>
                    <div className="text-sm text-gray-500">{pitcher.team}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {total > 0 ? `${total}打者 / アウト率 ${outRate}%` : '試合データなし'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">
                      {outRate !== null ? `${outRate}%` : '—'}
                    </div>
                    <div className="text-xs text-gray-400">アウト率</div>
                  </div>
                  <div className="text-gray-300 text-xl">›</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
