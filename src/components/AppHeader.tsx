import Link from "next/link";
import { FileSearch2, ShieldCheck } from "lucide-react";

export function AppHeader() {
  return (
    <header className="relative z-10 border-b border-slate-200/80 bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <FileSearch2 className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">
              Alinhador de Currículo
            </span>
            <span className="text-[11px] text-slate-500">
              Currículo certo para cada vaga
            </span>
          </span>
        </Link>

        <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          Seus dados ficam no navegador
        </span>
      </div>
    </header>
  );
}
