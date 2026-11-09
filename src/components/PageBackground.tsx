export function PageBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute right-[-12rem] top-48 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute bottom-[-10rem] left-[-8rem] h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
    </div>
  );
}
