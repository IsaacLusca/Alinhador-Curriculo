import { MatchStatusBadge } from "@/components/result/badges";
import { REQUIREMENT_TYPE_LABEL } from "@/lib/labels";
import type { RequirementMatch } from "@/lib/schemas";

interface RequirementsListProps {
  requisitos: RequirementMatch[];
}

const BORDER_BY_STATUS: Record<RequirementMatch["status"], string> = {
  atende: "border-emerald-200 bg-emerald-50/30",
  parcial: "border-amber-200 bg-amber-50/30",
  ausente: "border-red-200 bg-red-50/30",
};

export function RequirementsList({ requisitos }: RequirementsListProps) {
  const attended = requisitos.filter(
    (requisito) => requisito.status === "atende",
  ).length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Requisitos da vaga
          </h2>
          <p className="text-sm text-slate-500">
            O que a vaga pede e como seu currículo responde.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {attended} de {requisitos.length} atendidos
        </span>
      </header>

      {requisitos.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Nenhum requisito objetivo foi identificado na vaga.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {requisitos.map((requisito, index) => (
            <li
              key={`${requisito.descricao}-${index}`}
              className={`rounded-2xl border p-4 ${BORDER_BY_STATUS[requisito.status]}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <MatchStatusBadge status={requisito.status} />
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  {REQUIREMENT_TYPE_LABEL[requisito.tipo]}
                </span>
                {requisito.obrigatorio && (
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Obrigatório
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {requisito.descricao}
              </p>
              {requisito.evidencia ? (
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">
                    Evidência:
                  </span>{" "}
                  “{requisito.evidencia}”
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  Sem evidência no currículo mestre.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
