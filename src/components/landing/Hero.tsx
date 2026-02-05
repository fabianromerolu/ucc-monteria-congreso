export default function Hero() {
  return (
    <section
      className="group relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: "var(--congreso-border)",
        color: "var(--congreso-text)",
      }}
    >
      {/* “Sombra”/glow alrededor (degradé animado) */}
      <div
        className="pointer-events-none absolute -inset-[10px] rounded-[28px] opacity-70 blur-[18px]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(31,114,123,.55) 0%, rgba(135,154,156,.45) 45%, rgba(203,128,81,.55) 100%)",
          backgroundSize: "220% 220%",
          animation: "heroGlow 8s ease-in-out infinite",
        }}
      />

      {/* Fondo vivo (degradé animado) */}
      <div
        className="absolute inset-0 bg-[length:220%_220%] opacity-95"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--congreso-secondary) 0%, var(--congreso-quaternary) 45%, var(--congreso-tertiary) 100%)",
          animation: "heroGradient 8s ease-in-out infinite",
        }}
      />

      {/* Textura suave */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 15%, rgba(255,255,255,.55), transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,.35), transparent 40%)",
        }}
      />

      {/* Contenido (menos padding arriba/abajo) */}
      <div className="relative px-6 py-10 md:px-10 md:py-14 text-center">
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

      {/* Logo encajado en esquina (más pequeño y SIN tapar botones) */}
      <div
        className="pointer-events-none absolute bottom-0 right-0"
        style={{
          width: "clamp(140px, 14vw, 200px)",
          height: "clamp(96px, 10vw, 140px)",
        }}
      >
        {/* Caja esquinera: solo borde superior + izquierdo */}
        <div
          className="absolute bottom-0 right-0"
          style={{
            width: "100%",
            height: "50%",
            background: "rgba(255,255,255,.92)",
            borderTopLeftRadius: "18px",
            borderTop: "1px solid rgba(0,0,0,.10)",
            borderLeft: "1px solid rgba(0,0,0,.10)",
            boxShadow: "0 12px 26px rgba(0,0,0,.12)",
          }}
        />

        {/* Logo centrado y nítido */}
        <img
          src="/icono-ucc.png"
          alt="Logo UCC"
          className="absolute object-contain"
          style={{
            left: "50%",
            top: "75%",
            transform: "translate(-50%, -50%)",
            width: "clamp(96px, 10vw, 140px)",
            height: "clamp(72px, 8vw, 110px)",
            imageRendering: "auto",
            filter:
              "contrast(1.12) saturate(1.06) drop-shadow(0 7px 14px rgba(0,0,0,.16))",
          }}
        />
      </div>

      {/* CSS inline para animaciones */}
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
  );
}
