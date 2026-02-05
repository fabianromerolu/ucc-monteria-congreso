export default function Hero() {
  return (
    <div className="relative overflow-visible">
      <section
        className="relative z-10 overflow-hidden rounded-3xl border"
        style={{ borderColor: "var(--congreso-border)" }}
      >
        <div className="grid md:grid-cols-2">
          {/* PANEL IZQUIERDO — IMAGEN */}
          <div
            className="
              relative flex items-center justify-center
              px-5 py-6 md:px-8 md:py-7
              min-h-[410px] md:min-h-[414px]
            "
            style={{ background: "#ffffff" }}
          >
            <div className="w-full max-w-[560px]">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[460px]">
                <img
                  src="/title-event.jpeg"
                  alt="Título del evento"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ filter: "contrast(1.02) saturate(1.02)" }}
                />
              </div>
            </div>

            <div
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-px md:block"
              style={{ background: "rgba(0,0,0,0.08)" }}
            />
          </div>

          {/* PANEL DERECHO — MORADO */}
          <div
            className="
              relative flex items-center
              px-6 py-7 md:px-10 md:py-7
              min-h-[410px] md:min-h-[414px]
            "
            style={{ background: "var(--congreso-primary)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 25%, rgba(255,255,255,.35), transparent 48%), radial-gradient(circle at 85% 80%, rgba(255,255,255,.20), transparent 52%)",
              }}
            />

            <div className="relative max-w-xl text-white">
              <p className="text-xs/6 tracking-wide uppercase opacity-95">
                Universidad Cooperativa de Colombia • Campus Montería
              </p>

              <p className="mt-4 md:text-lg opacity-85">
                Espacio académico para la socialización de proyectos de investigación desarrollados por
                docentes investigadores, semilleros, estudiantes de pregrado y posgrado, jóvenes investigadores
                y demás actores vinculados a las instituciones adscritas al Nodo Región Caribe.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#inscripciones" className="btn hero-btn-primary">
                  Inscribirme
                </a>
                <a href="#cronograma" className="btn hero-btn-outline">
                  Ver cronograma
                </a>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .hero-btn-primary {
            background: #ffffff;
            color: var(--congreso-primary);
            border: 2px solid #ffffff;
          }
          .hero-btn-primary:hover {
            background: var(--congreso-primary);
            color: #ffffff;
            border-color: #ffffff;
          }

          .hero-btn-outline {
            background: transparent;
            color: #ffffff;
            border: 2px solid rgba(255, 255, 255, 0.65);
          }
          .hero-btn-outline:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: #ffffff;
          }

          @media (max-width: 767px) {
            section { border-radius: 24px; }
          }
        `}</style>
      </section>
    </div>
  );
}
