interface Props {
  cerrando: boolean;
  reintentar: () => void;
}

export function CierreSesionPendiente({ cerrando, reintentar }: Props) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl object-contain flex-shrink-0" />
          <span className="text-lg font-bold tracking-tight text-slate-900">PersonalHR</span>
        </div>
        {cerrando ? <p role="status" className="text-sm text-slate-700">Cerrando sesión…</p> : <>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Cierre de sesión pendiente</h1>
          <p role="alert" className="mt-3 text-sm text-slate-700">No pudimos confirmar el cierre de sesión. Revisa tu conexión y vuelve a intentarlo antes de dejar este dispositivo.</p>
          <button type="button" onClick={reintentar} className="mt-6 min-h-11 w-full rounded-xl bg-[#57CCB7] px-4 text-sm font-bold text-slate-900 hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57CCB7] focus-visible:ring-offset-2 disabled:opacity-60">Reintentar</button>
        </>}
      </section>
    </main>
  );
}
