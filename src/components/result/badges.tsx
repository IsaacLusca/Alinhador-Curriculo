import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import {
  ALIGNMENT_LEVEL_LABEL,
  MATCH_STATUS_LABEL,
  PRIORITY_LABEL,
} from "@/lib/labels";
import type {
  AlignmentLevel,
  MatchStatus,
  Priority,
} from "@/lib/schemas";

export const LEVEL_STYLES: Record<
  AlignmentLevel,
  { badge: string; dot: string; stroke: string }
> = {
  bem_alinhado: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    stroke: "#059669",
  },
  parcialmente_alinhado: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    stroke: "#d97706",
  },
  nao_alinhado: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
    stroke: "#dc2626",
  },
};

const STATUS_STYLES: Record<
  MatchStatus,
  { badge: string; icon: typeof CircleCheck; iconClass: string }
> = {
  atende: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CircleCheck,
    iconClass: "text-emerald-600",
  },
  parcial: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: CircleAlert,
    iconClass: "text-amber-600",
  },
  ausente: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    icon: CircleX,
    iconClass: "text-red-600",
  },
};

const PRIORITY_STYLES: Record<Priority, string> = {
  alta: "bg-red-50 text-red-700 ring-red-200",
  media: "bg-amber-50 text-amber-700 ring-amber-200",
  baixa: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function LevelBadge({ nivel }: { nivel: AlignmentLevel }) {
  const styles = LEVEL_STYLES[nivel];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {ALIGNMENT_LEVEL_LABEL[nivel]}
    </span>
  );
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const styles = STATUS_STYLES[status];
  const Icon = styles.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
    >
      <Icon className={`h-3.5 w-3.5 ${styles.iconClass}`} aria-hidden />
      {MATCH_STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ prioridade }: { prioridade: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${PRIORITY_STYLES[prioridade]}`}
    >
      Prioridade {PRIORITY_LABEL[prioridade].toLowerCase()}
    </span>
  );
}
