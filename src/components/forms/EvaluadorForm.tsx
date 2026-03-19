"use client";

import Link from "next/link";
import { Divider } from "./_fields";

const EVENTO_HREF = "/";

export default function EvaluadorForm() {
  return (
    <section className="grid gap-4 form-shell">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn btn-outline"
          style={{
            borderColor: "rgba(0,0,0,0.18)",
            color: "var(--congreso-text)",
            background: "rgba(255,255,255,0.6)",
          }}
        >
          ← Regresar
        </button>

        <span className="text-xs opacity-75">Proceso finalizado.</span>
      </div>

      <Divider
        title="Inscripciones cerradas"
        desc="El formulario de evaluadores ya no se encuentra disponible."
      />

      <div
        className="rounded-2xl border p-6 text-center"
        style={{
          background: "var(--congreso-surface)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <h2 className="text-2xl font-bold tracking-tight">
          Las inscripciones ya cerraron
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm opacity-80">
          Para verificar el listado de admitidos y consultar la información del
          evento, da clic en el botón en el siguiente botón:
        </p>

        <div className="mt-5 flex justify-center">
          <Link 
            href={EVENTO_HREF} 
            className="btn rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
            style={{
              borderRadius: "0.5rem",
              background: "var(--congreso-primary)",
              color: "white",
            }}
          >
            Consultar evento
          </Link>
        </div>
      </div>
    </section>
  );
}