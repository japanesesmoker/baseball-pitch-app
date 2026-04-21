import type { ZonePos, BatterHandedness } from '../types';

interface Props {
  zone: ZonePos;
  handedness: BatterHandedness;
  small?: boolean;
}

function zoneToCell(zone: ZonePos, handedness: BatterHandedness): [number, number] {
  const flip = handedness === 'left';
  const strikeCells: Record<number, [number, number]> = {
    1: [1, 1], 2: [2, 1], 3: [3, 1],
    4: [1, 2], 5: [2, 2], 6: [3, 2],
    7: [1, 3], 8: [2, 3], 9: [3, 3],
  };
  if (typeof zone === 'number') {
    return strikeCells[zone];
  }
  const ballCells: Record<string, [number, number]> = {
    'high':       [2, 0],
    'low':        [2, 4],
    'inner':      flip ? [4, 2] : [0, 2],
    'outer':      flip ? [0, 2] : [4, 2],
    'high-inner': flip ? [4, 0] : [0, 0],
    'high-outer': flip ? [0, 0] : [4, 0],
    'low-inner':  flip ? [4, 4] : [0, 4],
    'low-outer':  flip ? [0, 4] : [4, 4],
  };
  return ballCells[zone] ?? [2, 2];
}

function zoneLabel(zone: ZonePos, handedness: BatterHandedness): string {
  if (typeof zone === 'number') {
    const row = zone <= 3 ? '高め' : zone <= 6 ? '真ん中' : '低め';
    const colNum = zone % 3;
    const col =
      colNum === 1 ? (handedness === 'right' ? '内角' : '外角') :
      colNum === 0 ? (handedness === 'right' ? '外角' : '内角') :
      '真ん中';
    return `${row}${col === '真ん中' && row === '真ん中' ? '' : col}`;
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

const CELL_SIZE = 56;
const SMALL_CELL_SIZE = 30;

export function StrikeZone({ zone, handedness, small = false }: Props) {
  const [activeCol, activeRow] = zoneToCell(zone, handedness);
  const label = zoneLabel(zone, handedness);
  const cs = small ? SMALL_CELL_SIZE : CELL_SIZE;
  const totalSize = cs * 5;
  const strikeStart = cs;
  const strikeSize = cs * 3;
  const dotR = small ? 8 : 12;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={totalSize}
        height={totalSize}
        style={{ display: 'block' }}
      >
        {/* Background cells */}
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => {
            const isStrike = col >= 1 && col <= 3 && row >= 1 && row <= 3;
            const isActive = col === activeCol && row === activeRow;
            return (
              <g key={`${col}-${row}`}>
                <rect
                  x={col * cs}
                  y={row * cs}
                  width={cs}
                  height={cs}
                  fill={isActive ? '#fee2e2' : isStrike ? '#f9fafb' : '#f1f5f9'}
                  stroke={isStrike ? '#d1d5db' : 'none'}
                  strokeWidth={0.5}
                  strokeDasharray={isStrike ? '4,2' : 'none'}
                />
                {isActive && (
                  <circle
                    cx={col * cs + cs / 2}
                    cy={row * cs + cs / 2}
                    r={dotR}
                    fill="#ef4444"
                  />
                )}
              </g>
            );
          })
        )}

        {/* Strike zone border */}
        <rect
          x={strikeStart}
          y={strikeStart}
          width={strikeSize}
          height={strikeSize}
          fill="none"
          stroke="#132040"
          strokeWidth={2.5}
        />

        {/* Inner grid lines (dashed) */}
        {[1, 2].map((i) => (
          <g key={i}>
            <line
              x1={strikeStart + i * cs}
              y1={strikeStart}
              x2={strikeStart + i * cs}
              y2={strikeStart + strikeSize}
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <line
              x1={strikeStart}
              y1={strikeStart + i * cs}
              x2={strikeStart + strikeSize}
              y2={strikeStart + i * cs}
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
          </g>
        ))}
      </svg>

      {!small && (
        <p className="text-sm font-semibold text-gray-600">{label}</p>
      )}
    </div>
  );
}
