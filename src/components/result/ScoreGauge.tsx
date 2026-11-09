import { LEVEL_STYLES } from "@/components/result/badges";
import type { AlignmentLevel } from "@/lib/schemas";

interface ScoreGaugeProps {
  score: number;
  nivel: AlignmentLevel;
}

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score, nivel }: ScoreGaugeProps) {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  const color = LEVEL_STYLES[nivel].stroke;

  return (
    <div
      className="relative flex h-44 w-44 shrink-0 items-center justify-center"
      role="img"
      aria-label={`Score de alinhamento: ${score} de 100`}
    >
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight text-slate-900">
          {score}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          de 100
        </span>
      </div>
    </div>
  );
}
