export function PantallaCarga() {
  return (
    <main
      role="status"
      aria-label="Cargando PersonalHR"
      className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#f7fbfa] px-6 py-12"
    >
      <div className="flex flex-col items-center text-center">
        <img
          src="/logo.png"
          alt=""
          className="h-28 w-28 shrink-0 rounded-[26px] object-contain shadow-[0_8px_24px_rgba(7,94,79,0.12)] sm:h-32 sm:w-32"
        />
        <h1 className="mt-6 text-[1.75rem] font-bold tracking-tight text-[#087765]">PersonalHR</h1>
        <p className="mt-3 text-sm font-medium text-[#426c65]">Preparando tu espacio…</p>
        <span aria-hidden="true" className="mt-5 h-1 w-10 rounded-full bg-[#57CCB7] motion-safe:animate-pulse" />
      </div>
    </main>
  );
}
