"use client";

import * as React from "react";
import {
  AlertTriangle,
  CalendarPlus,
  ClipboardCheck,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  KeyRound,
  Loader2,
  LogOut,
  Power,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  getAttendanceCertificateDownloadUrl,
  lookupAttendanceCertificate,
} from "@/src/services/attendance.service";
import {
  ATTENDANCE_ROLE_META,
  getAttendanceFullName,
  type AttendanceAdminSummary,
  type AttendanceCertificateFile,
  type AttendanceManualInput,
  type AttendanceRecord,
  type AttendanceRole,
} from "@/src/types/attendance";
import type { TipoDocumento } from "@/src/types/registrations";

const ROLE_ORDER: AttendanceRole[] = ["ponente", "evaluador", "asistente"];

const DOCUMENT_OPTIONS: Array<{ value: TipoDocumento; label: string }> = [
  { value: "CC", label: "Cedula de ciudadania" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "CE", label: "Cedula de extranjeria" },
  { value: "PAS", label: "Pasaporte" },
];

type ManualAttendanceForm = {
  role: AttendanceRole;
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email: string;
  telefono: string;
  ciudad: string;
  universidad: string;
  programa: string;
  semestre: string;
  profesion: string;
  posgrado: string;
  universidadPosgrado: string;
  tituloPonencia: string;
  semillero: string;
};

type CertificateLookupModal = {
  record: AttendanceRecord;
  title: string;
  message: string;
  certificates: AttendanceCertificateFile[];
};

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
  generatingCertificates: boolean;
  deletingCertificates: boolean;
  creatingManualAttendance: boolean;
  assigningTardias: boolean;
  attendanceSummary: AttendanceAdminSummary | null;
  attendanceRecords: AttendanceRecord[];
  regeneratingCertificateId: string | null;
  onToggleAttendance: () => void;
  onGenerateCertificates: () => void;
  onDeleteGeneratedCertificates: () => Promise<void>;
  onCreateManualAttendance: (data: AttendanceManualInput) => Promise<void>;
  onDeleteAndRegenerateCertificate: (record: AttendanceRecord) => Promise<void>;
  onOpenLatePonenciaForm: () => void;
  onAsignarEvaluadoresTardias: () => void;
};

function numberLabel(value?: number | null) {
  return new Intl.NumberFormat("es-CO").format(Number(value ?? 0));
}

function emptyManualForm(role: AttendanceRole = "ponente"): ManualAttendanceForm {
  return {
    role,
    nombres: "",
    apellidos: "",
    tipoDocumento: "CC",
    documento: "",
    email: "",
    telefono: "",
    ciudad: "",
    universidad: "",
    programa: "",
    semestre: "",
    profesion: "",
    posgrado: "",
    universidadPosgrado: "",
    tituloPonencia: "",
    semillero: "",
  };
}

function toUpperInput(value: string) {
  return value.toLocaleUpperCase("es-CO");
}

function getRoleLabel(role: AttendanceRecord["role"] | AttendanceCertificateFile["role"]) {
  if (typeof role === "string" && role in ATTENDANCE_ROLE_META) {
    return ATTENDANCE_ROLE_META[role as AttendanceRole].label;
  }

  return String(role ?? "-");
}

function getManualRoleDescription(role: AttendanceRole) {
  if (role === "ponente") {
    return "Datos de asistencia para ponente. Incluye semillero y ponencia para dejar mejor contexto administrativo.";
  }

  if (role === "evaluador") {
    return "Datos de asistencia para evaluador. Incluye perfil academico para cruzarlo con su registro.";
  }

  return "Datos de asistencia para asistente. Incluye programa y semestre cuando aplique.";
}

function formatCertificateDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO");
}

function PanelSection({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="panel-section rounded-2xl border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="panel-section-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl">
            <Icon size={18} />
          </span>
          <h4 className="truncate text-sm font-bold">{title}</h4>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <div className="panel-stat rounded-2xl border p-4" data-tone={tone}>
      <p className="text-xs font-semibold uppercase">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none">{numberLabel(value)}</p>
    </div>
  );
}

function RoleStat({
  role,
  summary,
}: {
  role: AttendanceRole;
  summary: AttendanceAdminSummary | null;
}) {
  const roleSummary = summary?.byRole?.[role];
  const meta = ATTENDANCE_ROLE_META[role];

  return (
    <div className="panel-role-stat rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{meta.label}s</p>
        <Users size={17} />
      </div>
      <p className="mt-3 text-3xl font-black leading-none">
        {numberLabel(roleSummary?.total)}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <span className="rounded-xl bg-emerald-500/10 px-2 py-2 text-emerald-800">
          {numberLabel(roleSummary?.sent)} gen.
        </span>
        <span className="rounded-xl bg-amber-500/10 px-2 py-2 text-amber-800">
          {numberLabel(roleSummary?.pending)} pend.
        </span>
        <span className="rounded-xl bg-red-500/10 px-2 py-2 text-red-800">
          {numberLabel(roleSummary?.error)} error
        </span>
      </div>
    </div>
  );
}

function PanelActionButton({
  children,
  icon: Icon,
  onClick,
  type = "button",
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "success" | "info" | "danger" | "muted";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className="panel-action-btn inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon size={18} />
      <span>{children}</span>
    </button>
  );
}

function SmallIconButton({
  children,
  icon: Icon,
  onClick,
  disabled,
  variant = "muted",
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  disabled?: boolean;
  variant?: "muted" | "danger" | "success";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className="panel-small-btn inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

function PanelInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
}) {
  const inputId = React.useId();

  return (
    <label htmlFor={inputId} className="grid gap-1 text-xs font-semibold">
      <span>
        {label} {required ? <span className="opacity-60">*</span> : null}
      </span>
      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        placeholder={label}
        className="panel-input h-11 rounded-xl border px-3 text-sm font-medium outline-none"
      />
    </label>
  );
}

function PanelSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  const selectId = React.useId();

  return (
    <label htmlFor={selectId} className="grid gap-1 text-xs font-semibold">
      <span>{label}</span>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="panel-input h-11 rounded-xl border px-3 text-sm font-medium outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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
  generatingCertificates,
  deletingCertificates,
  creatingManualAttendance,
  assigningTardias,
  attendanceSummary,
  attendanceRecords,
  regeneratingCertificateId,
  onToggleAttendance,
  onGenerateCertificates,
  onDeleteGeneratedCertificates,
  onCreateManualAttendance,
  onDeleteAndRegenerateCertificate,
  onOpenLatePonenciaForm,
  onAsignarEvaluadoresTardias,
}: Props) {
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualForm, setManualForm] = React.useState<ManualAttendanceForm>(() =>
    emptyManualForm(),
  );
  const [manualError, setManualError] = React.useState<string | null>(null);
  const [maintenanceError, setMaintenanceError] = React.useState<string | null>(null);
  const [lookupLoadingId, setLookupLoadingId] = React.useState<string | null>(null);
  const [certificateModal, setCertificateModal] =
    React.useState<CertificateLookupModal | null>(null);

  if (!open) return null;

  const totalAttendance = attendanceSummary?.total ?? 0;
  const generatedCertificates = attendanceSummary?.sentCertificates ?? 0;
  const pendingCertificates = attendanceSummary?.pendingCertificates ?? 0;
  const errorCertificates = attendanceSummary?.errorCertificates ?? 0;
  const generatedRecords = attendanceRecords.filter(
    (record) => record.certificateStatus === "sent",
  );

  function updateManualForm<K extends keyof ManualAttendanceForm>(
    key: K,
    value: ManualAttendanceForm[K],
  ) {
    setManualForm((current) => ({ ...current, [key]: value }));
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualError(null);

    const requiredValues = [
      manualForm.nombres,
      manualForm.apellidos,
      manualForm.documento,
      manualForm.email,
      manualForm.telefono,
      manualForm.ciudad,
      manualForm.universidad,
    ];

    if (requiredValues.some((value) => !value.trim())) {
      setManualError("Completa los campos obligatorios del registro manual.");
      return;
    }

    try {
      await onCreateManualAttendance({
        role: manualForm.role,
        nombres: manualForm.nombres,
        apellidos: manualForm.apellidos,
        tipoDocumento: manualForm.tipoDocumento,
        documento: manualForm.documento,
        email: manualForm.email,
        telefono: manualForm.telefono,
        ciudad: manualForm.ciudad,
        institucion: manualForm.universidad,
        universidad: manualForm.universidad,
        programa:
          manualForm.role === "evaluador" ? undefined : manualForm.programa,
        semestre:
          manualForm.role === "asistente" ? manualForm.semestre : undefined,
        profesion:
          manualForm.role === "evaluador" ? manualForm.profesion : undefined,
        posgrado:
          manualForm.role === "evaluador" ? manualForm.posgrado : undefined,
        universidadPosgrado:
          manualForm.role === "evaluador"
            ? manualForm.universidadPosgrado
            : undefined,
        tituloPonencia:
          manualForm.role === "ponente" ? manualForm.tituloPonencia : undefined,
        semillero:
          manualForm.role === "ponente" ? manualForm.semillero : undefined,
        source: "direct",
      });
      setManualForm((current) => emptyManualForm(current.role));
      setManualOpen(false);
    } catch (error) {
      setManualError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el registro manual.",
      );
    }
  }

  async function handleDeleteCertificates() {
    const confirmed = window.confirm(
      "Esta accion borrara todos los certificados generados y dejara las asistencias listas para volver a generar. Deseas continuar?",
    );

    if (!confirmed) return;

    try {
      setMaintenanceError(null);
      await onDeleteGeneratedCertificates();
    } catch (error) {
      setMaintenanceError(
        error instanceof Error
          ? error.message
          : "No se pudieron borrar los certificados generados.",
      );
    }
  }

  async function handleViewCertificate(record: AttendanceRecord) {
    try {
      setLookupLoadingId(record.id);
      const result = await lookupAttendanceCertificate(record.documento);
      setCertificateModal({
        record,
        title:
          result.status === "generated"
            ? "Certificado generado"
            : "Certificado no disponible",
        message: result.message,
        certificates: result.certificates,
      });
    } catch (error) {
      setCertificateModal({
        record,
        title: "No se pudo consultar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo consultar el certificado.",
        certificates: [],
      });
    } finally {
      setLookupLoadingId(null);
    }
  }

  async function handleDeleteAndRegenerate(record: AttendanceRecord) {
    const confirmed = window.confirm(
      `Se borrara el certificado de ${getAttendanceFullName(record)} y se intentara generarlo de nuevo con envio al correo registrado. Deseas continuar?`,
    );

    if (!confirmed) return;

    try {
      setMaintenanceError(null);
      await onDeleteAndRegenerateCertificate(record);
    } catch (error) {
      setMaintenanceError(
        error instanceof Error
          ? error.message
          : "No se pudo borrar y regenerar el certificado seleccionado.",
      );
    }
  }

  function openCertificate(certificate: AttendanceCertificateFile) {
    window.open(
      getAttendanceCertificateDownloadUrl(certificate.downloadUrl),
      "_blank",
      "noopener,noreferrer",
    );
  }

  function downloadCertificate(certificate: AttendanceCertificateFile) {
    const link = document.createElement("a");
    link.href = getAttendanceCertificateDownloadUrl(certificate.downloadUrl);
    link.download = certificate.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 sm:p-5">
      <div className="panel-modal-card max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border shadow-2xl">
        <div className="panel-modal-header flex items-start justify-between gap-4 border-b p-5">
          <div className="min-w-0">
            <p className="panel-eyebrow text-xs font-bold uppercase tracking-[0.16em]">
              {isAuthorized ? "Control del evento" : "Acceso administrativo"}
            </p>
            <h3 className="panel-title mt-1 text-xl font-black md:text-2xl">
              {isAuthorized ? "Panel de administracion" : "Panel protegido"}
            </h3>
            {isAuthorized ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                <span
                  className="panel-status-pill rounded-full px-3 py-1"
                  data-enabled={String(attendanceEnabled)}
                >
                  Asistencias {attendanceEnabled ? "habilitadas" : "cerradas"}
                </span>
                {attendanceLoading ? (
                  <span className="inline-flex items-center gap-1 opacity-70">
                    <Loader2 className="animate-spin" size={14} />
                    Actualizando conteos
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="panel-close-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            title="Cerrar panel"
            aria-label="Cerrar panel"
          >
            <X size={18} />
          </button>
        </div>

        {!isAuthorized ? (
          <div className="p-5">
            <div className="mx-auto grid max-w-md gap-4">
              <div className="panel-section rounded-2xl border p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="panel-section-icon grid h-11 w-11 place-items-center rounded-xl">
                    <KeyRound size={20} />
                  </span>
                  <div>
                    <p className="font-bold">Codigo del panel</p>
                    <p className="text-sm opacity-70">Ingresa la clave administrativa.</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !validating &&
                      code.trim() &&
                      onValidate()
                    }
                    placeholder="Codigo de acceso"
                    className="panel-input w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                  />
                  <PanelActionButton
                    icon={ShieldCheck}
                    onClick={onValidate}
                    disabled={validating || !code.trim()}
                  >
                    {validating ? "Validando..." : "Entrar"}
                  </PanelActionButton>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[calc(92vh-108px)] overflow-y-auto p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <StatCard label="Asistencias" value={totalAttendance} />
              <StatCard
                label="Certificados generados"
                value={generatedCertificates}
                tone="success"
              />
              <StatCard
                label="Pendientes"
                value={pendingCertificates}
                tone="warning"
              />
              <StatCard label="Con error" value={errorCertificates} tone="danger" />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {ROLE_ORDER.map((role) => (
                <RoleStat key={role} role={role} summary={attendanceSummary} />
              ))}
            </div>

            <div className="mt-5 grid gap-5">
              <PanelSection title="Operaciones del evento" icon={ClipboardCheck}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <PanelActionButton
                    icon={Power}
                    onClick={onToggleAttendance}
                    disabled={attendanceLoading || togglingAttendance}
                    variant={attendanceEnabled ? "danger" : "success"}
                  >
                    {togglingAttendance
                      ? "Actualizando..."
                      : attendanceEnabled
                        ? "Deshabilitar asistencias"
                        : "Habilitar asistencias"}
                  </PanelActionButton>

                  <PanelActionButton
                    icon={CalendarPlus}
                    onClick={onOpenLatePonenciaForm}
                    variant="info"
                  >
                    Registrar ponencia atrasada
                  </PanelActionButton>

                  <PanelActionButton
                    icon={UserPlus}
                    onClick={() => {
                      setManualError(null);
                      setManualOpen(true);
                    }}
                    variant="primary"
                  >
                    Registrar asistencia manual
                  </PanelActionButton>

                  <PanelActionButton
                    icon={UserCheck}
                    onClick={onAsignarEvaluadoresTardias}
                    disabled={assigningTardias}
                    variant="info"
                  >
                    {assigningTardias
                      ? "Asignando evaluadores..."
                      : "Asignar evaluadores tardios"}
                  </PanelActionButton>

                  <PanelActionButton
                    icon={FileCheck2}
                    onClick={onGenerateCertificates}
                    disabled={generatingCertificates}
                    variant="success"
                  >
                    {generatingCertificates
                      ? "Generando y enviando..."
                      : "Generar y enviar certificados"}
                  </PanelActionButton>
                </div>
              </PanelSection>

              <PanelSection title="Mantenimiento de certificados" icon={AlertTriangle}>
                <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
                  <div>
                    <p className="text-sm font-semibold">
                      Certificados generados actualmente:{" "}
                      <span className="text-lg font-black">
                        {numberLabel(generatedCertificates)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm opacity-70">
                      Puedes revisar cada certificado generado o borrar uno puntual y
                      volverlo a generar con envio al correo registrado.
                    </p>
                  </div>
                  <PanelActionButton
                    icon={Trash2}
                    onClick={handleDeleteCertificates}
                    disabled={deletingCertificates || generatingCertificates}
                    variant="danger"
                  >
                    {deletingCertificates
                      ? "Borrando certificados..."
                      : "Borrar todos"}
                  </PanelActionButton>
                </div>

                {maintenanceError ? (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-800">
                    {maintenanceError}
                  </div>
                ) : null}

                <div className="panel-table-shell overflow-hidden rounded-2xl border">
                  <div className="max-h-[360px] overflow-auto">
                    <table className="w-full min-w-[860px] text-sm">
                      <thead className="rv-thead sticky top-0 z-10">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-semibold">Tipo</th>
                          <th className="px-4 py-3 font-semibold">Cedula</th>
                          <th className="px-4 py-3 font-semibold">Nombre</th>
                          <th className="px-4 py-3 font-semibold">Correo</th>
                          <th className="px-4 py-3 font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedRecords.length ? (
                          generatedRecords.map((record, index) => {
                            const isBusy = regeneratingCertificateId === record.id;

                            return (
                              <tr
                                key={record.id}
                                className={`border-t ${index % 2 === 0 ? "rv-row-even" : "rv-row-odd"}`}
                              >
                                <td className="px-4 py-3">
                                  <span className="rv-chip rounded-full px-3 py-1 text-xs font-bold">
                                    {getRoleLabel(record.role)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-semibold">
                                  {record.documento}
                                </td>
                                <td className="px-4 py-3">
                                  {getAttendanceFullName(record)}
                                </td>
                                <td className="px-4 py-3">{record.email}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    <SmallIconButton
                                      icon={
                                        lookupLoadingId === record.id
                                          ? Loader2
                                          : Eye
                                      }
                                      onClick={() => handleViewCertificate(record)}
                                      disabled={lookupLoadingId === record.id}
                                      variant="muted"
                                    >
                                      Ver
                                    </SmallIconButton>
                                    <SmallIconButton
                                      icon={isBusy ? Loader2 : RotateCcw}
                                      onClick={() => handleDeleteAndRegenerate(record)}
                                      disabled={
                                        isBusy ||
                                        generatingCertificates ||
                                        deletingCertificates
                                      }
                                      variant="danger"
                                    >
                                      {isBusy ? "Regenerando" : "Borrar y regenerar"}
                                    </SmallIconButton>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center opacity-70">
                              Aun no hay certificados generados para listar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PanelSection>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm opacity-70">
                Los certificados nuevos se solicitan al backend con envio por correo
                al email registrado en cada asistencia.
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="panel-btn-logout inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition-all duration-200"
              >
                <LogOut size={18} />
                Cerrar acceso
              </button>
            </div>
          </div>
        )}
      </div>

      {manualOpen ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/60 p-4">
          <div className="panel-modal-card max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border shadow-2xl">
            <div className="panel-modal-header flex items-start justify-between gap-4 border-b p-5">
              <div>
                <p className="panel-eyebrow text-xs font-bold uppercase tracking-[0.16em]">
                  Registro manual
                </p>
                <h4 className="mt-1 text-xl font-black">Asistencia manual</h4>
                <p className="mt-1 text-sm opacity-70">
                  {getManualRoleDescription(manualForm.role)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="panel-close-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                title="Cerrar formulario"
                aria-label="Cerrar formulario"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleManualSubmit}
              className="max-h-[calc(90vh-104px)] overflow-y-auto p-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <PanelSelect
                  label="Tipo de usuario"
                  value={manualForm.role}
                  onChange={(value) => {
                    setManualForm(emptyManualForm(value));
                    setManualError(null);
                  }}
                  options={ROLE_ORDER.map((role) => ({
                    value: role,
                    label: ATTENDANCE_ROLE_META[role].label,
                  }))}
                />
                <PanelSelect
                  label="Tipo documento"
                  value={manualForm.tipoDocumento}
                  onChange={(value) => updateManualForm("tipoDocumento", value)}
                  options={DOCUMENT_OPTIONS}
                />
                <PanelInput
                  label="Nombres"
                  value={manualForm.nombres}
                  onChange={(value) =>
                    updateManualForm("nombres", toUpperInput(value))
                  }
                  required
                />
                <PanelInput
                  label="Apellidos"
                  value={manualForm.apellidos}
                  onChange={(value) =>
                    updateManualForm("apellidos", toUpperInput(value))
                  }
                  required
                />
                <PanelInput
                  label="Documento"
                  value={manualForm.documento}
                  onChange={(value) =>
                    updateManualForm("documento", toUpperInput(value))
                  }
                  required
                />
                <PanelInput
                  label="Correo electronico"
                  value={manualForm.email}
                  onChange={(value) => updateManualForm("email", value)}
                  type="email"
                  required
                />
                <PanelInput
                  label="Telefono"
                  value={manualForm.telefono}
                  onChange={(value) =>
                    updateManualForm("telefono", toUpperInput(value))
                  }
                  required
                />
                <PanelInput
                  label="Ciudad"
                  value={manualForm.ciudad}
                  onChange={(value) =>
                    updateManualForm("ciudad", toUpperInput(value))
                  }
                  required
                />
                <PanelInput
                  label={
                    manualForm.role === "evaluador"
                      ? "Universidad"
                      : "Universidad o institucion"
                  }
                  value={manualForm.universidad}
                  onChange={(value) =>
                    updateManualForm("universidad", toUpperInput(value))
                  }
                  required
                />

                {manualForm.role === "ponente" ? (
                  <>
                    <PanelInput
                      label="Programa academico"
                      value={manualForm.programa}
                      onChange={(value) =>
                        updateManualForm("programa", toUpperInput(value))
                      }
                    />
                    <PanelInput
                      label="Semillero"
                      value={manualForm.semillero}
                      onChange={(value) =>
                        updateManualForm("semillero", toUpperInput(value))
                      }
                    />
                    <div className="md:col-span-2">
                      <PanelInput
                        label="Titulo de ponencia"
                        value={manualForm.tituloPonencia}
                        onChange={(value) =>
                          updateManualForm("tituloPonencia", toUpperInput(value))
                        }
                      />
                    </div>
                  </>
                ) : null}

                {manualForm.role === "evaluador" ? (
                  <>
                    <PanelInput
                      label="Profesion"
                      value={manualForm.profesion}
                      onChange={(value) =>
                        updateManualForm("profesion", toUpperInput(value))
                      }
                    />
                    <PanelInput
                      label="Posgrado"
                      value={manualForm.posgrado}
                      onChange={(value) =>
                        updateManualForm("posgrado", toUpperInput(value))
                      }
                    />
                    <PanelInput
                      label="Universidad del posgrado"
                      value={manualForm.universidadPosgrado}
                      onChange={(value) =>
                        updateManualForm(
                          "universidadPosgrado",
                          toUpperInput(value),
                        )
                      }
                    />
                  </>
                ) : null}

                {manualForm.role === "asistente" ? (
                  <>
                    <PanelInput
                      label="Programa"
                      value={manualForm.programa}
                      onChange={(value) =>
                        updateManualForm("programa", toUpperInput(value))
                      }
                    />
                    <PanelInput
                      label="Semestre"
                      value={manualForm.semestre}
                      onChange={(value) =>
                        updateManualForm("semestre", toUpperInput(value))
                      }
                    />
                  </>
                ) : null}
              </div>

              {manualError ? (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-800">
                  {manualError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setManualOpen(false)}
                  className="panel-close-btn inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingManualAttendance}
                  className="panel-action-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                  data-variant="primary"
                >
                  {creatingManualAttendance ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  {creatingManualAttendance
                    ? "Guardando asistencia..."
                    : "Guardar asistencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {certificateModal ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4">
          <div className="panel-modal-card w-full max-w-lg rounded-3xl border p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black">{certificateModal.title}</p>
                <p className="mt-1 text-sm opacity-75">
                  {getAttendanceFullName(certificateModal.record)} -{" "}
                  {certificateModal.record.documento}
                </p>
                <p className="mt-2 text-sm opacity-80">{certificateModal.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setCertificateModal(null)}
                className="panel-close-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                aria-label="Cerrar certificados"
                title="Cerrar certificados"
              >
                <X size={17} />
              </button>
            </div>

            {certificateModal.certificates.length ? (
              <div className="grid gap-3">
                {certificateModal.certificates.map((certificate) => (
                  <div
                    key={`${certificate.role}-${certificate.downloadUrl}`}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: "var(--congreso-border)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{getRoleLabel(certificate.role)}</p>
                        <p className="mt-1 text-sm opacity-70">
                          {certificate.fullName}
                        </p>
                        <p className="mt-1 text-xs opacity-60">
                          Generado: {formatCertificateDate(certificate.generatedAt)}
                        </p>
                      </div>
                      <FileCheck2 className="shrink-0 text-emerald-700" size={20} />
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <SmallIconButton
                        icon={ExternalLink}
                        onClick={() => openCertificate(certificate)}
                        variant="success"
                      >
                        Visualizar
                      </SmallIconButton>
                      <SmallIconButton
                        icon={Download}
                        onClick={() => downloadCertificate(certificate)}
                        variant="muted"
                      >
                        Descargar
                      </SmallIconButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border p-4 text-sm opacity-75">
                No se encontraron archivos de certificado para este registro.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
