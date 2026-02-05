export default function Hero() {
  return (
    <div className="relative mt-10 overflow-visible md:mt-12">
      {/* Medallón + líneas decorativas */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-[90] -translate-x-1/2 -translate-y-[42%]">
        <div className="relative flex items-center justify-center">
          {/* Líneas izquierda */}
          <div className="absolute right-full mr-6 flex flex-col items-end gap-2">
            <span className="h-[2px] w-40 rounded-full bg-white/80" />
            <span className="h-[2px] w-28 rounded-full bg-white/60" />
            <span className="h-[2px] w-16 rounded-full bg-white/40" />
          </div>

          {/* Medallón central */}
          <div
            className="relative grid place-items-center rounded-full"
            style={{
              width: "clamp(88px, 9vw, 128px)",
              height: "clamp(88px, 9vw, 128px)",
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,.98) 0%, rgba(245,230,213,.96) 55%, rgba(255,255,255,.96) 100%)",
              border: "1px solid rgba(0,0,0,.12)",
              boxShadow: "0 14px 28px rgba(0,0,0,.18)",
            }}
          >
            <div
              className="absolute inset-[9px] rounded-full"
              style={{
                border: "1px solid rgba(0,0,0,.10)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.35)",
              }}
            />
            <img
              src="/logo-evento.png"
              alt="Logo del evento"
              className="object-contain"
              style={{
                width: "78%",
                height: "78%",
                imageRendering: "auto",
                filter: "contrast(1.08) saturate(1.05)",
              }}
            />
          </div>

          {/* Líneas derecha */}
          <div className="absolute left-full ml-6 flex flex-col items-start gap-2">
            <span className="h-[2px] w-40 rounded-full bg-white/80" />
            <span className="h-[2px] w-28 rounded-full bg-white/60" />
            <span className="h-[2px] w-16 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* HERO */}
      <section
        className="group relative z-10 overflow-hidden rounded-3xl border"
        style={{
          borderColor: "var(--congreso-border)",
          color: "var(--congreso-text)",
        }}
      >
        {/* Glow alrededor */}
        <div
          className="pointer-events-none absolute -inset-[10px] rounded-[28px] opacity-70 blur-[18px]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(31,114,123,.55) 0%, rgba(135,154,156,.45) 45%, rgba(203,128,81,.55) 100%)",
            backgroundSize: "220% 220%",
            animation: "heroGlow 8s ease-in-out infinite",
          }}
        />

        {/* Fondo vivo */}
        <div
          className="absolute inset-0 bg-[length:220%_220%] opacity-95"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--congreso-secondary) 0%, var(--congreso-quaternary) 45%, var(--congreso-tertiary) 100%)",
            animation: "heroGradient 8s ease-in-out infinite",
          }}
        />

        {/* Textura */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 15%, rgba(255,255,255,.55), transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,.35), transparent 40%)",
          }}
        />

        {/* Contenido */}
        <div className="relative px-6 pb-16 pt-16 md:px-10 md:pb-14 md:pt-20 text-center">
          <p className="text-xs/6 tracking-wide uppercase opacity-90">
            Universidad Cooperativa de Colombia • Campus Montería
          </p>

          <h1 className="mx-auto mt-3 max-w-4xl text-3xl font-bold tracking-tight md:text-5xl">
            XX Encuentro del Nodo Caribe de la Red de Investigación Jurídica y Socio jurídica
          </h1>

          <p className="mx-auto mt-4 max-w-3xl opacity-90 md:text-lg">
            Espacio académico para la socialización de proyectos de investigación desarrollados por docentes
            investigadores, semilleros, estudiantes de pregrado y posgrado, jóvenes investigadores y demás
            actores vinculados a las instituciones adscritas al Nodo Región Caribe.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="#inscripciones"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-95"
              style={{
                background: "var(--congreso-primary)",
                color: "var(--congreso-secondary)",
              }}
            >
              Inscribirme
            </a>

            <a
              href="#cronograma"
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,.35)" }}
            >
              Ver cronograma
            </a>
          </div>
        </div>

        {/* Glow inferior */}
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        <style>{`
          @keyframes heroGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes heroGlow {
            0% { background-position: 0% 50%; opacity: .60; }
            50% { background-position: 100% 50%; opacity: .78; }
            100% { background-position: 0% 50%; opacity: .60; }
          }
        `}</style>
      </section>
    </div>
  );
}
