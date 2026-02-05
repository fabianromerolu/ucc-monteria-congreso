"use client";

import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";

const CONGRESS_NAME =
  "XX Encuentro del Nodo Caribe de la Red de Investigación Jurídica y Socio jurídica";

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        color: "var(--congreso-text-on-dark)",
        background:
          "linear-gradient(to right, var(--congreso-secondary) 0%, #235f66 50%, var(--congreso-secondary) 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo + desc */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="mb-4 inline-block" aria-label="Ir al inicio">
              {/* Vuelve el contenedor con fondo medio blanco + centrado */}
              <div className="mx-auto grid place-items-center rounded-2xl bg-white/85 p-3 shadow-sm ring-1 ring-black/5 md:mx-0">
                <Image
                  src="/icono-ucc.png"
                  alt="Logo UCC"
                  width={160}
                  height={160}
                  priority
                  className="object-contain"
                  style={{
                    imageRendering: "auto",
                    filter: "contrast(1.08) saturate(1.05)",
                  }}
                />
              </div>
            </Link>

            <p className="text-sm text-center md:text-left opacity-95">
              {CONGRESS_NAME}
            </p>
          </div>

          {/* Sobre el evento */}
          <div className="flex flex-col items-center md:items-start">
            <h3
              className="mb-4 text-lg font-bold"
              style={{ color: "var(--congreso-tertiary)" }}
            >
              Sobre el evento
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              <li>
                <a
                  href="#"
                  className="opacity-90 hover:opacity-100 hover:underline"
                  style={{ color: "var(--congreso-text-on-dark)" }}
                >
                  Presentación
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="opacity-90 hover:opacity-100 hover:underline"
                  style={{ color: "var(--congreso-text-on-dark)" }}
                >
                  Agenda (pronto)
                </a>
              </li>
            </ul>
          </div>

          {/* Información útil */}
          <div className="flex flex-col items-center md:items-start">
            <h3
              className="mb-4 text-lg font-bold"
              style={{ color: "var(--congreso-tertiary)" }}
            >
              Información útil
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              <li>
                <a
                  href="#inscripciones"
                  className="opacity-90 hover:opacity-100 hover:underline"
                  style={{ color: "var(--congreso-text-on-dark)" }}
                >
                  Inscripciones
                </a>
              </li>
              <li>
                <a
                  href="#cronograma"
                  className="opacity-90 hover:opacity-100 hover:underline"
                  style={{ color: "var(--congreso-text-on-dark)" }}
                >
                  Cronograma (en construcción)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="opacity-90 hover:opacity-100 hover:underline"
                  style={{ color: "var(--congreso-text-on-dark)" }}
                >
                  Ubicación (pronto)
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="flex flex-col items-center md:items-start">
            <h3
              className="mb-4 text-lg font-bold"
              style={{ color: "var(--congreso-tertiary)" }}
            >
              Contacto
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <span className="opacity-90">Email:</span>
                <a
                  href="mailto:trabajofinal866@gmail.com"
                  className="opacity-90 hover:underline"
                  style={{ color: "var(--congreso-text-on-dark)" }}
                >
                  trabajofinal866@gmail.com
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <span className="opacity-90">Lugar:</span>
                <span className="opacity-90">Montería, Córdoba</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-white/15" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2">
          <p className="text-sm opacity-85">
            © {new Date().getFullYear()} {CONGRESS_NAME}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
