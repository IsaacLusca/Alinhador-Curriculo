export function AppFooter() {
  return (
    <footer className="relative border-t border-slate-200/80 bg-white/60 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <p>
          O .docx é lido no seu navegador; apenas o texto extraído é enviado
          ao Gemini para a análise.
        </p>
        <p>Currículo adaptado sempre com revisão humana antes de enviar.</p>
      </div>
    </footer>
  );
}
