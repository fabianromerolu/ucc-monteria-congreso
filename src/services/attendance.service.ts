import {
  buildAdminHeaders,
  getApiErrorMessage,
  getBackendBaseUrl,
  readJsonSafe,
} from "@/src/lib/backend";
import type {
  AttendanceAdminResponse,
  AttendanceCertificateDispatchResponse,
  AttendanceInput,
  AttendancePublicConfig,
  AttendanceRecord,
} from "@/src/types/attendance";
import { buildAttendanceSummary } from "@/src/types/attendance";

type AttendanceAdminApiResponse = {
  enabled?: boolean;
  habilitado?: boolean;
  records?: AttendanceRecord[];
  registros?: AttendanceRecord[];
  summary?: AttendanceAdminResponse["summary"];
  resumen?: AttendanceAdminResponse["summary"];
};

type AttendanceConfigApiResponse = {
  enabled?: boolean;
  habilitado?: boolean;
};

type AttendanceDispatchApiResponse = {
  message?: string;
  sent?: number;
  enviados?: number;
  failed?: number;
  fallidos?: number;
};

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};

  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    const value = obj[key];

    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;

    out[key] = value;
  });

  return out;
}

export async function getAttendancePublicConfig(): Promise<AttendancePublicConfig> {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/asistencias/configuracion-publica`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await readJsonSafe(response);
    throw new Error(
      getApiErrorMessage(data, "No se pudo consultar la configuracion de asistencias."),
    );
  }

  const data = (await readJsonSafe<AttendanceConfigApiResponse>(response)) ?? {};

  return {
    enabled: Boolean(data.enabled ?? data.habilitado ?? false),
  };
}

export async function registerAttendance(data: AttendanceInput): Promise<void> {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/asistencias/${data.role}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      clean({
        nombres: data.nombres,
        apellidos: data.apellidos,
        tipoDocumento: data.tipoDocumento,
        documento: data.documento,
        email: data.email,
        telefono: data.telefono,
        institucion: data.institucion,
        ciudad: data.ciudad,
        source: data.source,
      }),
    ),
  });

  if (!response.ok) {
    const errorData = await readJsonSafe(response);
    throw new Error(
      getApiErrorMessage(errorData, "No se pudo registrar la asistencia."),
    );
  }
}

export async function getAdminAttendanceSnapshot(
  adminCode: string,
): Promise<AttendanceAdminResponse> {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/administracion/asistencias`, {
    method: "GET",
    cache: "no-store",
    headers: buildAdminHeaders(adminCode),
  });

  if (!response.ok) {
    const errorData = await readJsonSafe(response);
    throw new Error(
      getApiErrorMessage(errorData, "No se pudo obtener la informacion de asistencias."),
    );
  }

  const data = (await readJsonSafe<AttendanceAdminApiResponse>(response)) ?? {};
  const records = Array.isArray(data.records)
    ? data.records
    : Array.isArray(data.registros)
    ? data.registros
    : [];

  return {
    enabled: Boolean(data.enabled ?? data.habilitado ?? false),
    records,
    summary: data.summary ?? data.resumen ?? buildAttendanceSummary(records),
  };
}

export async function updateAttendancePublicConfig(
  enabled: boolean,
  adminCode: string,
): Promise<AttendancePublicConfig> {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}/administracion/asistencias/configuracion`, {
    method: "PATCH",
    headers: buildAdminHeaders(adminCode),
    body: JSON.stringify({
      enabled,
      habilitado: enabled,
    }),
  });

  if (!response.ok) {
    const errorData = await readJsonSafe(response);
    throw new Error(
      getApiErrorMessage(errorData, "No se pudo actualizar la configuracion de asistencias."),
    );
  }

  const data = (await readJsonSafe<AttendanceConfigApiResponse>(response)) ?? {};

  return {
    enabled: Boolean(data.enabled ?? data.habilitado ?? enabled),
  };
}

export async function sendAttendanceCertificates(
  adminCode: string,
): Promise<AttendanceCertificateDispatchResponse> {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(
    `${baseUrl}/administracion/asistencias/certificados/enviar`,
    {
      method: "POST",
      headers: buildAdminHeaders(adminCode),
      body: JSON.stringify({
        pendingOnly: true,
      }),
    },
  );

  const data = (await readJsonSafe<AttendanceDispatchApiResponse>(response)) ?? {};

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(data, "No se pudieron enviar los certificados."),
    );
  }

  return {
    message: data.message,
    sent: Number(data.sent ?? data.enviados ?? 0),
    failed: Number(data.failed ?? data.fallidos ?? 0),
  };
}
