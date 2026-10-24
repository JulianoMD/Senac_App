import { useId } from "react";

export type Ring = { label: string; value: number; from: string; to: string };

const SIZE = 136;
const STROKE = 14;
const GAP = 3;

// Anéis concêntricos que se completam ao entrar na tela (inspirados nos anéis de atividade).
export default function ActivityRings({ rings }: { rings: Ring[] }) {
  const id = useId();

  return (
    <svg
      className="rings"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={rings.map((ring) => `${ring.label}: ${Math.round(ring.value * 100)}% da meta`).join(", ")}
    >
      <defs>
        {rings.map((ring, index) => (
          <linearGradient key={ring.label} id={`${id}-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ring.from} />
            <stop offset="100%" stopColor={ring.to} />
          </linearGradient>
        ))}
      </defs>
      {rings.map((ring, index) => {
        const radius = (SIZE - STROKE) / 2 - index * (STROKE + GAP);
        const length = 2 * Math.PI * radius;
        return (
          <g key={ring.label}>
            <circle className="ring-track" cx={SIZE / 2} cy={SIZE / 2} r={radius} stroke={ring.from} strokeWidth={STROKE} />
            <circle
              className="ring-value"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={radius}
              stroke={`url(#${id}-${index})`}
              strokeWidth={STROKE}
              strokeDasharray={length}
              strokeDashoffset={length * (1 - Math.min(1, ring.value))}
              style={{ "--len": length, animationDelay: `${200 + index * 140}ms` } as React.CSSProperties}
            />
          </g>
        );
      })}
    </svg>
  );
}
