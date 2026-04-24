import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Pitcher } from '../types';

function generateAllPitchersText(pitchers: Pitcher[]): string {
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
    '【全投手 配球データ分析依頼】',
    '各投手ごとに有効な配球パターンを分析し、アウトを取りやすい球種・コースの組み合わせを提案してください。',
    '',
  ];

  pitchers.forEach((pitcher) => {
    const totalResults = pitcher.patterns.flatMap(p => p.results);
    const totalOuts = totalResults.filter(r => r.result === 'out' || r.result === 'strikeout').length;
    const totalRate = totalResults.length > 0
      ? Math.round(totalOuts / totalResults.length * 100) : 0;

    lines.push(`${'='.repeat(40)}`);
    lines.push(`投手: ${pitcher.name}（${pitcher.pitcherHand === 'left' ? '左投げ' : '右投げ'}）`);
    lines.push(`球種: ${pitcher.pitchTypes.map(p => p.name).join('、')}`);
    lines.push(`総合: ${totalResults.length}打者 / アウト率${totalRate}%`);
    lines.push('');

    const patternsWithData = pitcher.patterns.filter(p =>
      p.results.some(r => r.pitchSequence && r.pitchSequence.length > 0)
    );

    if (patternsWithData.length === 0) {
      lines.push('  ※ まだ投球シーケンスデータがありません');
    } else {
      patternsWithData.forEach((pattern) => {
        const results = pattern.results;
        const outs = results.filter(r => r.result === 'out').length;
        const outRate = results.length > 0 ? Math.round(outs / results.length * 100) : 0;

        lines.push(`  ▼ パターン${pattern.id}（アウト率: ${outRate}% / ${results.length}打者）`);

        results.filter(r => r.pitchSequence && r.pitchSequence.length > 0).forEach((r) => {
          const seq = r.pitchSequence!.map(p => `${p.pitchType}${zn(p.zone)}`).join(' → ');
          const hand = r.batterHandedness === 'right' ? '対右' : '対左';
          lines.push(`    [${resultLabel[r.result]}] ${hand}: ${seq}`);
        });
        lines.push('');
      });
    }
    lines.push('');
  });

  return lines.join('\n');
}

export function DataViewScreen() {
  const { pitchers, setScreen, setViewingPitcher } = useStore();
  const [copied, setCopied] = useState(false);

  const handleView = (id: string) => {
    setViewingPitcher(id);
    setScreen('data-view-patterns');
  };

  const handleCopyAll = () => {
    const text = generateAllPitchersText(pitchers);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy-800 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => setScreen('data')} className="text-white/70 hover:text-white text-lg">←</button>
        <h1 className="text-lg font-bold flex-1">投手データの閲覧</h1>
        {pitchers.length > 0 && (
          <button
            onClick={handleCopyAll}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors flex-shrink-0 ${
              copied ? 'bg-green-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {copied ? '✓ コピー済み' : '全投手\nAI分析用'}
          </button>
        )}
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
              const outCount = totalResults.filter((r) => r.result === 'out' || r.result === 'strikeout').length;
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
