import { useState } from 'react';
import { useStore } from '../store/useStore';

export function SettingsScreen() {
  const { setScreen, pitchers, deletePitcher } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deletePitcher(id);
    setConfirmDeleteId(null);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => setScreen('menu')} className="text-white/70 hover:text-white text-lg">←</button>
        <h1 className="text-lg font-bold">設定</h1>
      </div>

      <div className="flex-1 p-4">
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="font-bold text-gray-800 mb-3">投手データ管理</h2>
          {pitchers.length === 0 ? (
            <p className="text-gray-400 text-sm">投手データがありません</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pitchers.map(pitcher => (
                <div key={pitcher.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-navy-800 rounded-lg flex items-center justify-center text-white text-lg">⚾</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{pitcher.name}</div>
                      <div className="text-xs text-gray-400">
                        {pitcher.pitcherHand === 'left' ? '左投げ' : '右投げ'} / {pitcher.pitchTypes.map(p => p.name).join('・')}
                      </div>
                    </div>
                  </div>

                  {editingId === pitcher.id && (
                    <div className="mt-3 flex flex-col gap-2">
                      {confirmDeleteId === pitcher.id ? (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-red-600 text-sm mb-2 font-medium">本当に削除しますか？</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete(pitcher.id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold">削除する</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(pitcher.id)}
                          className="w-full bg-red-50 border border-red-200 text-red-600 font-medium py-2 rounded-lg text-sm"
                        >
                          🗑 削除
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setEditingId(editingId === pitcher.id ? null : pitcher.id)}
                    className="mt-2 w-full text-center text-xs text-blue-500 py-1"
                  >
                    {editingId === pitcher.id ? '閉じる' : '編集・削除'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
