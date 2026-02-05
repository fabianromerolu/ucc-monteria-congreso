"use client";

import Image from "next/image";
import Link from "next/link";

const CONGRESS_NAME =
  "XX Encuentro del Nodo Caribe de la Red de Investigación Jurídica y Socio jurídica";

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        color: "var(--congreso-text-on-dark)",
        background: "var(--congreso-primary)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo + desc */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="mb-4 inline-block" aria-label="Ir al inicio">
              <div className="mx-auto grid place-items-center rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5 md:mx-0">
                <Image
                  src="/icono-ucc.png"
                  alt="Logo UCC"
                  width={160}
                  height={160}
                  priority
                  className="object-contain"
                  style={{ filter: "contrast(1.06) saturate(1.04)" }}
                />
              </div>
            </Link>

            <p
              className="text-sm text-center md:text-left"
              style={{ color: "var(--congreso-text-on-dark-muted)" }}
            >
              {CONGRESS_NAME}
            </p>
          </div>

          {/* Sobre el evento */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 text-lg font-bold" style={{ color: "rgba(255,255,255,.95)" }}>
              Sobre el evento
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              <li>
                <a href="#" className="hover:underline" style={{ color: "var(--congreso-text-on-dark-muted)" }}>
                  Presentación
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline" style={{ color: "var(--congreso-text-on-dark-muted)" }}>
                  Agenda (pronto)
                </a>
              </li>
            </ul>
          </div>

          {/* Información útil */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 text-lg font-bold" style={{ color: "rgba(255,255,255,.95)" }}>
              Información útil
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              <li>
                <a href="#inscripciones" className="hover:underline" style={{ color: "var(--congreso-text-on-dark-muted)" }}>
                  Inscripciones
                </a>
              </li>
              <li>
                <a href="#cronograma" className="hover:underline" style={{ color: "var(--congreso-text-on-dark-muted)" }}>
                  Cronograma (en construcción)
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline" style={{ color: "var(--congreso-text-on-dark-muted)" }}>
                  Ubicación (pronto)
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 text-lg font-bold" style={{ color: "rgba(255,255,255,.95)" }}>
              Contacto
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <span style={{ color: "var(--congreso-text-on-dark-muted)" }}>Email:</span>
                <a
                  href="mailto:trabajofinal866@gmail.com"
                  className="hover:underline"
                  style={{ color: "var(--congreso-text-on-dark)" }}
                >
                  trabajofinal866@gmail.com
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <span style={{ color: "var(--congreso-text-on-dark-muted)" }}>Lugar:</span>
                <span style={{ color: "var(--congreso-text-on-dark-muted)" }}>Montería, Córdoba</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-8 border-t border-white/20" />

        <div className="flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--congreso-text-on-dark-muted)" }}>
            © {new Date().getFullYear()} {CONGRESS_NAME}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
