import { Sparkles } from "lucide-react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { AppHeader } from "@/components/AppHeader";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute right-[-12rem] top-48 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
      </div>

      <AppHeader />

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Análise com IA, sem inventar experiência
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Seu currículo,{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              alinhado à vaga certa
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Envie seu currículo mestre em .docx, cole a descrição da vaga e
            receba um diagnóstico honesto, um currículo enxugado só com o que
            importa e um plano do que desenvolver para fechar as lacunas.
          </p>
        </section>

        <AnalyzeForm />
      </main>

      <footer className="relative border-t border-slate-200/80 bg-white/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            O arquivo .docx é lido no seu navegador. Nada é armazenado em
            servidores.
          </p>
          <p>Currículo adaptado sempre com revisão humana antes de enviar.</p>
        </div>
      </footer>
    </div>
  );
}
