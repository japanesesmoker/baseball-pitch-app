import { useState } from 'react';
import { useStore } from '../store/useStore';
import { createPitcher } from '../utils/imageAnalyzer';
import { PITCH_LIST_BY_DIRECTION } from '../utils/pitchDirection';
import type { PitchType, PitchDirection } from '../types';
import { ALL_DIRECTIONS, PITCH_DIRECTION_LABELS } from '../types';

const DIRECTION_COLORS: Record<PitchDirection, { badge: string; btn: string; header: string }> = {
  straight: { badge: 'bg-blue-100 text-blue-700',    btn: 'bg-blue-50 border-blue-200 text-blue-700',    header: 'text-blue-700' },
  slider:   { badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-50 border-purple-200 text-purple-700', header: 'text-purple-700' },
  curve:    { badge: 'bg-green-100 text-green-700',   btn: 'bg-green-50 border-green-200 text-green-700',   header: 'text-green-700' },
  fork:     { badge: 'bg-orange-100 text-orange-700', btn: 'bg-orange-50 border-orange-200 text-orange-700', header: 'text-orange-700' },
  sinker:   { badge: 'bg-teal-100 text-teal-700',     btn: 'bg-teal-50 border-teal-200 text-teal-700',     header: 'text-teal-700' },
  shoot:    { badge: 'bg-pink-100 text-pink-700',     btn: 'bg-pink-50 border-pink-200 text-pink-700',     header: 'text-pink-700' },
};

interface SelectedPitch {
  name: string;
  breakAmount: number;
  direction: PitchDirection;
}

function PitchPicker({
  selected,
  onSelect,
}: {
  selected: SelectedPitch[];
  onSelect: (name: string, direction: PitchDirection) => void;
}) {
  const [openDir, setOpenDir] = useState<PitchDirection | null>('slider');
  const selectedNames = new Set(selected.map(p => p.name));

  return (
    <div className="flex flex-col gap-2">
      {ALL_DIRECTIONS.map(dir => {
        const pitches = PITCH_LIST_BY_DIRECTION[dir];
        const colors = DIRECTION_COLORS[dir];
        const isOpen = openDir === dir;
        const addedCount = pitches.filter(p => selectedNames.has(p.name)).length;

        return (
          <div key={dir} className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setOpenDir(isOpen ? null : dir)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white"
            >
              <span className={`font-bold text-sm ${colors.header}`}>{PITCH_DIRECTION_LABELS[dir]}</span>
              <div className="flex items-center gap-2">
                {addedCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                    {addedCount}追加済み
                  </span>
                )}
                <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 bg-gray-50 flex flex-wrap gap-1.5">
                {pitches.map(p => {
                  const isAdded = selectedNames.has(p.name);
                  return (
                    <button
                      key={p.name}
                      onClick={() => !isAdded && onSelect(p.name, dir)}
                      disabled={isAdded}
                      className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${
                        isAdded
                          ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-default'
                          : `${colors.btn} border active:scale-95`
                      }`}
                    >
                      {isAdded ? `✓ ${p.name}` : p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DataLoadScreen() {
  const { setScreen, addPitcher } = useStore();
  const [name, setName] = useState('');
  const [pitcherHand, setPitcherHand] = useState<'right' | 'left'>('right');
  const [pitches, setPitches] = useState<SelectedPitch[]>([
    { name: 'ストレート',     breakAmount: 0, direction: 'straight' },
    { name: '全力ストレート', breakAmount: 0, direction: 'straight' },
  ]);
  const [showPicker, setShowPicker] = useState(false);

  const addPitch = (pitchName: string, direction: PitchDirection) => {
    setPitches(prev => [...prev, { name: pitchName, breakAmount: 3, direction }]);
  };

  const removePitch = (i: number) => {
    setPitches(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateBreak = (i: number, val: number) => {
    setPitches(prev => prev.map((p, idx) => idx === i ? { ...p, breakAmount: val } : p));
  };

  const handleSave = () => {
    if (!name.trim()) { alert('選手名を入力してください'); return; }
    if (pitches.length === 0) { alert('球種を1つ以上選択してください'); return; }

    const pitchTypes: PitchType[] = pitches.map(p => ({
      name: p.name,
      breakAmount: p.breakAmount,
      direction: p.direction,
    }));
    addPitcher(createPitcher({ name: name.trim(), pitcherHand, pitchTypes }));
    setScreen('data');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => setScreen('data')} className="text-white/70 hover:text-white text-lg">←</button>
        <h1 className="text-lg font-bold">投手データの登録</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {/* Basic info */}
        <div className="bg-white rounded-2xl p-4 shadow flex flex-col gap-3">
          <h3 className="font-bold text-gray-700">基本情報</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">選手名 *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：松坂"
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">投げ腕 *</label>
            <div className="flex gap-3">
              {(['right', 'left'] as const).map(hand => (
                <button
                  key={hand}
                  onClick={() => setPitcherHand(hand)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors border-2 ${
                    pitcherHand === hand
                      ? 'bg-navy-800 text-white border-navy-800'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {hand === 'right' ? '右投げ' : '左投げ'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pitch types */}
        <div className="bg-white rounded-2xl p-4 shadow flex flex-col gap-3">
          <h3 className="font-bold text-gray-700">球種</h3>
          <p className="text-xs text-gray-400">変化量はパワプロの変化チャートの目盛り数（変化球は1〜7）</p>

          <div className="flex flex-col gap-2">
            {pitches.map((p, i) => {
              const colors = DIRECTION_COLORS[p.direction];
              const isFixed = p.name === 'ストレート' || p.name === '全力ストレート';
              return (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mr-1.5 ${colors.badge}`}>
                      {PITCH_DIRECTION_LABELS[p.direction]}
                    </span>
                    <span className="text-sm font-bold text-gray-800">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-400">変化量</span>
                    {isFixed ? (
                      <span className="w-16 text-center text-sm font-bold text-gray-400 bg-gray-100 border border-gray-200 rounded-lg py-1">
                        0（固定）
                      </span>
                    ) : (
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateBreak(i, Math.max(1, p.breakAmount - 1))}
                          className="w-7 h-8 text-gray-500 text-base font-bold active:bg-gray-100"
                        >−</button>
                        <span className="w-6 text-center text-sm font-bold text-gray-800">{p.breakAmount}</span>
                        <button
                          onClick={() => updateBreak(i, Math.min(7, p.breakAmount + 1))}
                          className="w-7 h-8 text-gray-500 text-base font-bold active:bg-gray-100"
                        >＋</button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removePitch(i)}
                    className="text-red-300 hover:text-red-500 text-xl w-7 flex-shrink-0"
                  >×</button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowPicker(!showPicker)}
            className={`w-full py-3 rounded-xl font-bold text-sm border-2 border-dashed transition-colors ${
              showPicker
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            {showPicker ? '▲ 閉じる' : '＋ 球種を追加'}
          </button>

          {showPicker && (
            <PitchPicker selected={pitches} onSelect={addPitch} />
          )}
        </div>

        <button
          onClick={handleSave}
          className="bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg text-lg"
        >
          ✅ 保存して20パターンを生成
        </button>
      </div>
    </div>
  );
}
