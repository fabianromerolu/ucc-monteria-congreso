import type { TipoDocumento } from "./registrations";

export const ATTENDANCE_ROLES = [
  "ponente",
  "asistente",
  "evaluador",
] as const;

export type AttendanceRole = (typeof ATTENDANCE_ROLES)[number];

export const ATTENDANCE_SOURCES = ["qr", "direct"] as const;

export type AttendanceSource = (typeof ATTENDANCE_SOURCES)[number];

export type CertificateStatus = "pending" | "sent" | "error";

export type AttendancePublicConfig = {
  enabled: boolean;
};

export type AttendanceInput = {
  role: AttendanceRole;
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email: string;
  telefono: string;
  institucion: string;
  ciudad: string;
  source: AttendanceSource;
};

export type AttendanceRecord = {
  id: string;
  role: AttendanceRole;
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento | string;
  documento: string;
  email: string;
  telefono: string;
  institucion: string;
  ciudad: string;
  source: AttendanceSource | string;
  createdAt: string;
  certificateStatus: CertificateStatus | string;
  certificateSentAt?: string | null;
  certificateError?: string | null;
  linkedRegistrationId?: string | null;
};

export type AttendanceRoleSummary = {
  total: number;
  pending: number;
  sent: number;
  error: number;
};

export type AttendanceAdminSummary = {
  total: number;
  pendingCertificates: number;
  sentCertificates: number;
  errorCertificates: number;
  byRole: Record<AttendanceRole, AttendanceRoleSummary>;
};

export type AttendanceAdminResponse = {
  enabled: boolean;
  records: AttendanceRecord[];
  summary: AttendanceAdminSummary;
};

export type AttendanceCertificateDispatchResponse = {
  message?: string;
  sent: number;
  failed: number;
};

export const ATTENDANCE_ROLE_META: Record<
  AttendanceRole,
  {
    label: string;
    title: string;
    description: string;
    certificateText: string;
  }
> = {
  ponente: {
    label: "Ponente",
    title: "Asistencia para ponentes",
    description:
      "Registro para los participantes que socializan sus ponencias durante el encuentro.",
    certificateText:
      "por su participacion como ponente en el encuentro academico",
  },
  asistente: {
    label: "Asistente",
    title: "Asistencia para asistentes",
    description:
      "Registro para los asistentes generales que participan en la jornada del evento.",
    certificateText:
      "por su asistencia al encuentro academico",
  },
  evaluador: {
    label: "Evaluador",
    title: "Asistencia para evaluadores",
    description:
      "Registro para las personas encargadas de evaluar y acompanar academicamente el evento.",
    certificateText:
      "por su participacion como evaluador en el encuentro academico",
  },
};

export function isAttendanceRole(value: string): value is AttendanceRole {
  return ATTENDANCE_ROLES.includes(value as AttendanceRole);
}

export function isAttendanceSource(value?: string | null): value is AttendanceSource {
  if (!value) return false;
  return ATTENDANCE_SOURCES.includes(value as AttendanceSource);
}

export function getAttendanceFullName(record: Pick<AttendanceRecord, "nombres" | "apellidos">) {
  return `${record.nombres} ${record.apellidos}`.trim();
}

export function buildAttendanceSummary(
  records: AttendanceRecord[],
): AttendanceAdminSummary {
  const initialRoleSummary = (): AttendanceRoleSummary => ({
    total: 0,
    pending: 0,
    sent: 0,
    error: 0,
  });

  const summary: AttendanceAdminSummary = {
    total: records.length,
    pendingCertificates: 0,
    sentCertificates: 0,
    errorCertificates: 0,
    byRole: {
      ponente: initialRoleSummary(),
      asistente: initialRoleSummary(),
      evaluador: initialRoleSummary(),
    },
  };

  records.forEach((record) => {
    if (!isAttendanceRole(record.role)) return;

    const roleSummary = summary.byRole[record.role];
    roleSummary.total += 1;

    if (record.certificateStatus === "sent") {
      roleSummary.sent += 1;
      summary.sentCertificates += 1;
      return;
    }

    if (record.certificateStatus === "error") {
      roleSummary.error += 1;
      summary.errorCertificates += 1;
      return;
    }

    roleSummary.pending += 1;
    summary.pendingCertificates += 1;
  });

  return summary;
}
