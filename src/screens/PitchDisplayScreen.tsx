import { useStore } from '../store/useStore';
import { StrikeZone } from '../components/StrikeZone';

function zoneLabel(zone: import('../types').ZonePos, handedness: import('../types').BatterHandedness): string {
  if (typeof zone === 'number') {
    const row = zone <= 3 ? '高め' : zone <= 6 ? '真ん中' : '低め';
    const col = zone % 3 === 1
      ? (handedness === 'right' ? '内角' : '外角')
      : zone % 3 === 0
      ? (handedness === 'right' ? '外角' : '内角')
      : '真ん中';
    return `${row}${col === '真ん中真ん中' ? '真ん中' : col}`;
  }
  const labels: Record<string, string> = {
    'high': '高め（ボール）',
    'low': '低め（ボール）',
    'inner': 'インコース（ボール）',
    'outer': 'アウトコース（ボール）',
    'high-inner': '高めインコース（ボール）',
    'high-outer': '高めアウトコース（ボール）',
    'low-inner': '低めインコース（ボール）',
    'low-outer': '低めアウトコース（ボール）',
  };
  return labels[zone] ?? zone;
}

export function PitchDisplayScreen() {
  const { game, pitchers, nextPitch, prevPitch, setScreen } = useStore();

  const pitcher = pitchers.find((p) => p.id === game?.pitcherId);
  if (!pitcher || !game) return null;

  const pattern = pitcher.patterns.find((p) => p.id === game.currentPatternId);
  if (!pattern) return null;

  const pitchIndex = game.currentPitchIndex;
  const pitchCall = pattern.pitches[pitchIndex];
  const handedness = game.currentHandedness;
  const isBall = typeof pitchCall.zone === 'string';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy-800 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-blue-300">
            {pitcher.name} / 第{(game.batterIndex ?? 0) + 1}打者（{handedness === 'right' ? '右' : '左'}）
          </div>
          <div className="text-sm font-medium">
            パターン {game.currentPatternId} / {pitchIndex + 1}球目
          </div>
        </div>
        <div className="flex gap-1">
          {pattern.pitches.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === pitchIndex ? 'bg-white scale-125' : i < pitchIndex ? 'bg-blue-400' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-between py-4 px-4">
        {/* Pitch type */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${isBall ? 'text-orange-500' : 'text-navy-800'}`}>
            {pitchCall.pitchType}
          </div>
          <div className={`text-sm mt-1 px-3 py-1 rounded-full inline-block font-medium ${
            isBall ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-700'
          }`}>
            {isBall ? 'ボール球' : 'ストライクゾーン'}
          </div>
        </div>

        {/* Strike zone visual */}
        <div className="flex flex-col items-center gap-3">
          {/* Handedness indicator */}
          <div className="flex gap-4 text-xs text-gray-400 w-full justify-between" style={{ width: '280px' }}>
            <span>{handedness === 'right' ? '← インコース' : '← アウトコース'}</span>
            <span>{handedness === 'right' ? 'アウトコース →' : 'インコース →'}</span>
          </div>

          <StrikeZone zone={pitchCall.zone} handedness={handedness} />

          <div className="text-center">
            <p className="text-gray-700 font-semibold text-base">
              {zoneLabel(pitchCall.zone, handedness)}
            </p>
          </div>
        </div>

        {/* Home plate illustration */}
        <div className="flex flex-col items-center opacity-30">
          <svg width="60" height="40" viewBox="0 0 60 40">
            <polygon
              points="0,0 60,0 60,25 30,40 0,25"
              fill="none"
              stroke="#1a2b4a"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={prevPitch}
            className="flex-1 bg-white border border-gray-200 rounded-xl py-4 font-bold text-gray-600 shadow active:bg-gray-100 transition-colors"
          >
            ‹ 戻る
          </button>
          <button
            onClick={() => setScreen('result-selection')}
            className="flex-1 bg-navy-800 rounded-xl py-4 font-bold text-white shadow-lg active:bg-navy-900 transition-colors flex items-center justify-center gap-2"
          >
            <span>📊</span> 結果
          </button>
          <button
            onClick={nextPitch}
            className="flex-1 bg-white border border-gray-200 rounded-xl py-4 font-bold text-gray-600 shadow active:bg-gray-100 transition-colors"
          >
            次 ›
          </button>
        </div>
      </div>
    </div>
  );
}
