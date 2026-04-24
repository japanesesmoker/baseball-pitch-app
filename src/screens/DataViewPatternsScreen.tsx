import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { PitchPattern, BatterHandedness } from '../types';

type SortKey = 'id' | 'out-rate' | 'total';
type HandFilter = 'all' | 'right' | 'left';

const HAND_FILTER_LABELS: Record<HandFilter, string> = {
  all:   '合計',
  right: '対右打者',
  left:  '対左打者',
};

function getStats(pattern: PitchPattern, filter: HandFilter) {
  const results = filter === 'all'
    ? pattern.results
    : pattern.results.filter(r => r.batterHandedness === filter);
  const total      = results.length;
  const outs       = results.filter(r => r.result === 'out').length;
  const strikeouts = results.filter(r => r.result === 'strikeout').length;
  const hits       = results.filter(r => r.result === 'hit').length;
  const hrs        = results.filter(r => r.result === 'homerun').length;
  const walks      = results.filter(r => r.result === 'walk').length;
  const outRate = total > 0 ? (outs + strikeouts) / total : 0;
  return { total, outs, strikeouts, hits, hrs, walks, outRate };
}

// Small strike zone as inline SVG (60x60)
function MiniZone({ zone, handedness }: { zone: import('../types').ZonePos; handedness: BatterHandedness }) {
  const flip = handedness === 'left';
  const cs = 12; // cell size
  const total = cs * 5;

  function zoneToCell(z: import('../types').ZonePos): [number, number] {
    const strikeCells: Record<number, [number, number]> = {
      1:[1,1],2:[2,1],3:[3,1],4:[1,2],5:[2,2],6:[3,2],7:[1,3],8:[2,3],9:[3,3],
    };
    if (typeof z === 'number') {
      return strikeCells[z];
    }
    const ballCells: Record<string, [number,number]> = {
      'high':[2,0],'low':[2,4],
      'inner':flip?[4,2]:[0,2],'outer':flip?[0,2]:[4,2],
      'high-inner':flip?[4,0]:[0,0],'high-outer':flip?[0,0]:[4,0],
      'low-inner':flip?[4,4]:[0,4],'low-outer':flip?[0,4]:[4,4],
    };
    return ballCells[z] ?? [2,2];
  }

  const [ac, ar] = zoneToCell(zone);

  return (
    <svg width={total} height={total} style={{ flexShrink: 0 }}>
      {/* Background */}
      <rect width={total} height={total} fill="#f1f5f9" />
      {/* Strike zone cells */}
      {[1,2,3].map(col => [1,2,3].map(row => (
        <rect key={`${col}${row}`} x={col*cs} y={row*cs} width={cs} height={cs} fill="#f9fafb" stroke="#e5e7eb" strokeWidth={0.5} />
      )))}
      {/* Strike zone border */}
      <rect x={cs} y={cs} width={cs*3} height={cs*3} fill="none" stroke="#132040" strokeWidth={1.5} />
      {/* Active dot */}
      <circle cx={ac*cs+cs/2} cy={ar*cs+cs/2} r={4} fill="#ef4444" />
    </svg>
  );
}

function zoneName(zone: import('../types').ZonePos, hand: BatterHandedness): string {
  if (typeof zone === 'number') {
    const r = zone<=3?'高め':zone<=6?'中':' 低め';
    const c = zone%3===1?(hand==='right'?'内':'外'):zone%3===0?(hand==='right'?'外':'内'):'中';
    return `${r}${c}`;
  }
  const m: Record<string,string> = {
    'high':'高ボ','low':'低ボ','inner':'内ボ','outer':'外ボ',
    'high-inner':'高内ボ','high-outer':'高外ボ','low-inner':'低内ボ','low-outer':'低外ボ',
  };
  return m[zone]??zone;
}

function generateAnalysisText(pitcher: import('../types').Pitcher): string {
  const zn = (zone: import('../types').ZonePos): string => {
    if (typeof zone === 'number') {
      const r = zone <= 3 ? '高め' : zone <= 6 ? '中' : '低め';
      const c = zone % 3 === 1 ? '内' : zone % 3 === 0 ? '外' : '中';
      return `${r}${c}`;
    }
    const m: Record<string, string> = {
      'high':'高ボール','low':'低ボール','inner':'内ボール','outer':'外ボール',
      'high-inner':'高内ボール','high-outer':'高外ボール','low-inner':'低内ボール','low-outer':'低外ボール',
    };
    return m[zone] ?? zone;
  };

  const resultLabel: Record<string, string> = { out: 'アウト', hit: 'ヒット', homerun: 'ホームラン', strikeout: '三振', walk: '四球' };

  const lines: string[] = [
    `【配球データ分析依頼】`,
    `投手名: ${pitcher.name}（${pitcher.pitcherHand === 'left' ? '左投げ' : '右投げ'}）`,
    `球種: ${pitcher.pitchTypes.map(p => p.name).join('、')}`,
    ``,
    `以下のデータをもとに、より効果的な配球パターンを分析・提案してください。`,
    ``,
  ];

  pitcher.patterns.forEach((pattern) => {
    const resultsWithSeq = pattern.results.filter(r => r.pitchSequence && r.pitchSequence.length > 0);
    if (resultsWithSeq.length === 0) return;

    const { total, outs, outRate } = getStats(pattern, 'all');
    lines.push(`▼ パターン${pattern.id}（アウト率: ${Math.round(outRate * 100)}% / ${total}打者）`);

    resultsWithSeq.forEach((r) => {
      const seq = r.pitchSequence!.map(p => `${p.pitchType}${zn(p.zone)}`).join(' → ');
      const hand = r.batterHandedness === 'right' ? '対右' : '対左';
      lines.push(`  [${resultLabel[r.result]}] ${hand}: ${seq}`);
    });
    lines.push('');
  });

  const totalResults = pitcher.patterns.flatMap(p => p.results);
  const totalOuts = totalResults.filter(r => r.result === 'out').length;
  lines.push(`総合: ${totalResults.length}打者 / アウト${totalOuts} / アウト率${totalResults.length > 0 ? Math.round(totalOuts / totalResults.length * 100) : 0}%`);

  return lines.join('\n');
}

export function DataViewPatternsScreen() {
  const { pitchers, viewingPitcherId, setScreen } = useStore();
  const pitcher = pitchers.find(p => p.id === viewingPitcherId);
  const [sort, setSort] = useState<SortKey>('id');
  const [handFilter, setHandFilter] = useState<HandFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [zoneHand, setZoneHand] = useState<BatterHandedness>('right');
  const [copied, setCopied] = useState(false);

  if (!pitcher) return null;

  const sorted = [...pitcher.patterns].sort((a, b) => {
    if (sort === 'id') return a.id - b.id;
    if (sort === 'out-rate') return getStats(b, handFilter).outRate - getStats(a, handFilter).outRate;
    if (sort === 'total') return getStats(b, handFilter).total - getStats(a, handFilter).total;
    return 0;
  });

  const handleCopy = () => {
    const text = generateAnalysisText(pitcher);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => setScreen('data-view')} className="text-white/70 hover:text-white text-lg">←</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{pitcher.name} の配球パターン</h1>
          <p className="text-xs text-blue-300">
            {pitcher.pitcherHand === 'left' ? '左投げ' : '右投げ'} / {pitcher.pitchTypes.map(p => p.name).join('・')}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors flex-shrink-0 ${
            copied ? 'bg-green-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
        >
          {copied ? '✓ コピー済み' : 'AI分析用\nコピー'}
        </button>
      </div>

      {/* Hand filter tabs */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-1.5">
        {(['all', 'right', 'left'] as HandFilter[]).map(h => (
          <button key={h} onClick={() => setHandFilter(h)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
              handFilter === h ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {HAND_FILTER_LABELS[h]}
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-1.5">
        <span className="text-xs text-gray-400 flex items-center mr-1">並替:</span>
        {([['id','No.順'],['out-rate','アウト率'],['total','試合数']] as [SortKey,string][]).map(([key,label]) => (
          <button key={key} onClick={() => setSort(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              sort === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Pattern list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {sorted.map(pattern => {
          const { total, outs, strikeouts, hits, hrs, walks, outRate } = getStats(pattern, handFilter);
          const isExpanded = expandedId === pattern.id;

          return (
            <div key={pattern.id} className="bg-white rounded-2xl shadow overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                <div className="w-9 h-9 bg-navy-800 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {pattern.id}
                </div>
                <div className="flex-1 min-w-0">
                  {/* First 5 pitches preview */}
                  <div className="flex flex-wrap gap-0.5 mb-1">
                    {pattern.pitches.slice(0,6).map((p,i) => (
                      <span key={i} className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded">
                        {p.pitchType}
                      </span>
                    ))}
                    {pattern.pitches.length > 6 && <span className="text-xs text-gray-400">...</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    {total > 0
                      ? `${total}打者 / アウト${outs} 三振${strikeouts} ヒット${hits} HR${hrs} 四球${walks}`
                      : 'データなし'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 mr-1">
                  {total > 0 && (
                    <>
                      <div className={`text-base font-bold ${outRate>=0.7?'text-green-500':outRate>=0.4?'text-yellow-500':'text-red-400'}`}>
                        {Math.round(outRate*100)}%
                      </div>
                      <div className="text-xs text-gray-400">アウト率</div>
                    </>
                  )}
                </div>
                <span className={`text-gray-300 transition-transform duration-200 ${isExpanded?'rotate-90':''}`}>›</span>
              </button>

              {/* Expanded: 10 pitches detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-3">
                  {/* Zone display handedness toggle */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400">コース表示:</span>
                    {(['right','left'] as BatterHandedness[]).map(h => (
                      <button key={h} onClick={() => setZoneHand(h)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          zoneHand===h ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {h==='right'?'対右打者':'対左打者'}
                      </button>
                    ))}
                  </div>

                  {/* 10 pitch rows: 2 columns */}
                  <div className="grid grid-cols-2 gap-2">
                    {pattern.pitches.map((pitch, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-2 flex items-center gap-2">
                        {/* Ball number */}
                        <div className="w-5 h-5 bg-navy-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {i+1}
                        </div>
                        {/* Pitch info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-800 truncate">{pitch.pitchType}</div>
                          <div className="text-xs text-gray-400">{zoneName(pitch.zone, zoneHand)}</div>
                        </div>
                        {/* Mini zone */}
                        <MiniZone zone={pitch.zone} handedness={zoneHand} />
                      </div>
                    ))}
                  </div>

                  {/* Results summary */}
                  {total > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-5 gap-1.5 text-center">
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-green-600 font-bold text-lg">{outs}</div>
                        <div className="text-xs text-green-500">アウト</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-blue-600 font-bold text-lg">{strikeouts}</div>
                        <div className="text-xs text-blue-500">三振</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <div className="text-yellow-600 font-bold text-lg">{hits}</div>
                        <div className="text-xs text-yellow-500">ヒット</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <div className="text-red-500 font-bold text-lg">{hrs}</div>
                        <div className="text-xs text-red-400">HR</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <div className="text-purple-600 font-bold text-lg">{walks}</div>
                        <div className="text-xs text-purple-500">四球</div>
                      </div>
                    </div>
                  )}

                  {/* 投球シーケンス履歴 */}
                  {(() => {
                    const filteredResults = (handFilter === 'all'
                      ? pattern.results
                      : pattern.results.filter(r => r.batterHandedness === handFilter)
                    ).filter(r => r.pitchSequence && r.pitchSequence.length > 0);

                    if (filteredResults.length === 0) return null;

                    const resultColor: Record<string, string> = {
                      out:       'bg-green-100 text-green-700',
                      strikeout: 'bg-blue-100 text-blue-700',
                      hit:       'bg-yellow-100 text-yellow-700',
                      homerun:   'bg-red-100 text-red-600',
                      walk:      'bg-purple-100 text-purple-700',
                    };
                    const resultLabel: Record<string, string> = {
                      out: 'アウト', strikeout: '三振', hit: 'ヒット', homerun: 'HR', walk: '四球',
                    };

                    return (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs font-bold text-gray-500 mb-2">投球シーケンス履歴</div>
                        <div className="flex flex-col gap-2">
                          {filteredResults.slice(-10).reverse().map((r) => (
                            <div key={r.id} className="bg-gray-50 rounded-xl p-2">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resultColor[r.result]}`}>
                                  {resultLabel[r.result]}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {r.batterHandedness === 'right' ? '対右' : '対左'} / {new Date(r.date).toLocaleDateString('ja-JP')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {r.pitchSequence!.map((p, idx) => {
                                  const isResult = idx === r.pitchSequence!.length - 1;
                                  return (
                                    <div key={idx} className="flex items-center gap-1">
                                      {idx > 0 && <span className="text-gray-300 text-xs">→</span>}
                                      <div className={`text-xs px-2 py-1 rounded-lg font-medium ${
                                        isResult
                                          ? resultColor[r.result]
                                          : 'bg-white text-gray-600 border border-gray-200'
                                      }`}>
                                        <div>{p.pitchType}</div>
                                        <div className="text-xs opacity-70">{zoneName(p.zone, zoneHand)}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
