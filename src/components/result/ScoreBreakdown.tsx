import { CATEGORY_LABEL } from "@/lib/labels";
import type { CategoryScores } from "@/lib/schemas";

interface ScoreBreakdownProps {
  categorias: CategoryScores;
}

const CATEGORY_ORDER: (keyof CategoryScores)[] = [
  "skills",
  "experiencias",
  "senioridade",
  "formacaoIdiomas",
  "keywords",
];

const CATEGORY_WEIGHT: Record<keyof CategoryScores, string> = {
  skills: "40%",
  experiencias: "25%",
  senioridade: "15%",
  formacaoIdiomas: "10%",
  keywords: "10%",
};

function barColor(value: number): string {
  if (value >= 75) return "bg-emerald-500";
  if (value >= 45) return "bg-amber-500";
  return "bg-red-500";
}

export function ScoreBreakdown({ categorias }: ScoreBreakdownProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {CATEGORY_ORDER.map((key) => {
        const value = Math.min(100, Math.max(0, Math.round(categorias[key])));

        return (
          <div key={key}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                {CATEGORY_LABEL[key]}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {value}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
              peso {CATEGORY_WEIGHT[key]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
