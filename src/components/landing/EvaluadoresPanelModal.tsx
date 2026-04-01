"use client";

import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  code: string;
  setCode: (value: string) => void;
  onValidate: () => void;
  validating: boolean;
  isAuthorized: boolean;
  onLogout: () => void;
};

export default function EvaluadoresPanelModal({
  open,
  onClose,
  code,
  setCode,
  onValidate,
  validating,
  isAuthorized,
  onLogout,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-lg rounded-[28px] border p-6 shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.98)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--congreso-text)" }}
            >
              Panel protegido
            </h3>
            <p className="mt-1 text-sm opacity-75">
              Ingresa el código para habilitar los datos completos de ponentes,
              la vista completa de evaluadores y la exportación completa del
              Excel.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-medium"
            style={{
              background: "rgba(0,0,0,0.06)",
              color: "var(--congreso-text)",
            }}
          >
            Cerrar
          </button>
        </div>

        {!isAuthorized ? (
          <div className="space-y-4">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de acceso"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{
                borderColor: "var(--congreso-border)",
                color: "var(--congreso-text)",
                background: "rgba(255,255,255,0.96)",
              }}
            />

            <button
              type="button"
              onClick={onValidate}
              disabled={validating || !code.trim()}
              className="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, var(--congreso-primary), #5a3fd6)",
              }}
            >
              {validating ? "Validando..." : "Validar código"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-2xl border px-4 py-3 text-sm"
              style={{
                borderColor: "rgba(18, 112, 63, 0.22)",
                background: "rgba(18, 112, 63, 0.08)",
                color: "#12703f",
              }}
            >
              Acceso habilitado. Ya puedes visualizar los datos completos de
              ponentes, los datos completos de evaluadores y exportar el Excel
              sin esas restricciones.
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200"
              style={{
                background: "rgba(217,45,32,0.10)",
                color: "#B42318",
                border: "1px solid rgba(217,45,32,0.18)",
              }}
            >
              Cerrar acceso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
