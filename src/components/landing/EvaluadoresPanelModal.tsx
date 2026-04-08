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
  attendanceEnabled: boolean;
  attendanceLoading: boolean;
  togglingAttendance: boolean;
  assigningTardias: boolean;
  onToggleAttendance: () => void;
  onOpenLatePonenciaForm: () => void;
  onAsignarEvaluadoresTardias: () => void;
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
  attendanceEnabled,
  attendanceLoading,
  togglingAttendance,
  assigningTardias,
  onToggleAttendance,
  onOpenLatePonenciaForm,
  onAsignarEvaluadoresTardias,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="panel-modal-card w-full max-w-sm rounded-3xl border p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="panel-title text-base font-bold">
            {isAuthorized ? "Panel de administración" : "Panel protegido"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="panel-close-btn rounded-xl px-3 py-1.5 text-xs font-medium"
          >
            Cerrar
          </button>
        </div>

        {!isAuthorized ? (
          /* ── Login ── */
          <div className="space-y-3">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !validating && code.trim() && onValidate()}
              placeholder="Código de acceso"
              className="panel-input w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={onValidate}
              disabled={validating || !code.trim()}
              className="panel-btn-login inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {validating ? "Validando..." : "Entrar"}
            </button>
          </div>
        ) : (
          /* ── Botones de acción ── */
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onToggleAttendance}
              disabled={attendanceLoading || togglingAttendance}
              data-enabled={String(attendanceEnabled)}
              className="panel-btn-toggle inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {togglingAttendance
                ? "Actualizando..."
                : attendanceEnabled
                ? "Deshabilitar asistencias"
                : "Habilitar asistencias"}
            </button>

            <button
              type="button"
              onClick={onOpenLatePonenciaForm}
              className="panel-btn-late inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white"
            >
              Registrar ponencia atrasada
            </button>

            <button
              type="button"
              onClick={onAsignarEvaluadoresTardias}
              disabled={assigningTardias}
              className="panel-btn-assign inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assigningTardias ? "Asignando evaluadores..." : "Asignar evaluadores tardíos"}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="panel-btn-logout mt-1 inline-flex w-full items-center justify-center rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200"
            >
              Cerrar acceso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
