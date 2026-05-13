import {
  buildAdminHeaders,
  getApiErrorMessage,
  getBackendBaseUrl,
  readJsonSafe,
} from "@/src/lib/backend";
import type {
  AttendanceAdminResponse,
  AttendanceCertificateCleanupResponse,
  AttendanceCertificateDispatchResponse,
  AttendanceCertificateLookupResponse,
  AttendanceInput,
  AttendanceManualInput,
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
  generated?: number;
  generados?: number;
  failed?: number;
  fallidos?: number;
  processed?: number;
  procesados?: number;
  retryErrors?: boolean;
  generatedRecords?: AttendanceCertificateDispatchResponse["generatedRecords"];
  registrosGenerados?: AttendanceCertificateDispatchResponse["generatedRecords"];
  failedRecords?: AttendanceCertificateDispatchResponse["failedRecords"];
  registrosFallidos?: AttendanceCertificateDispatchResponse["failedRecords"];
  existingErrorRecords?: AttendanceCertificateDispatchResponse["existingErrorRecords"];
  registrosConError?: AttendanceCertificateDispatchResponse["existingErrorRecords"];
};

type AttendanceCleanupApiResponse = {
  message?: string;
  deleted?: number;
  eliminados?: number;
  reset?: number;
  reiniciados?: number;
  affected?: number;
  afectados?: number;
};

type AttendanceCertificateLookupApiResponse = AttendanceCertificateLookupResponse & {
  estado?: AttendanceCertificateLookupResponse["status"];
  mensaje?: string;
  certificados?: AttendanceCertificateLookupResponse["certificates"];
};

type AttendanceCreateApiResponse = {
  record?: AttendanceRecord;
  registro?: AttendanceRecord;
  data?: AttendanceRecord;
  asistencia?: AttendanceRecord;
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
  }).catch(() => {
    throw new Error("No se pudo conectar con el servidor de asistencias.");
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
        semillero: data.semillero,
        source: data.source,
      }),
    ),
  }).catch(() => {
    throw new Error(
      "No se pudo conectar con el servidor. Verifica que el backend este encendido.",
    );
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
    `${baseUrl}/administracion/asistencias/certificados/generar`,
    {
      method: "POST",
      headers: buildAdminHeaders(adminCode),
      body: JSON.stringify({
        pendingOnly: true,
        retryErrors: true,
        sendEmail: true,
        sendEmails: true,
        emailCertificates: true,
        notifyRecipients: true,
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
    generated: Number(data.generated ?? data.generados ?? data.sent ?? data.enviados ?? 0),
    failed: Number(data.failed ?? data.fallidos ?? 0),
    processed: Number(data.processed ?? data.procesados ?? 0),
    retryErrors: Boolean(data.retryErrors ?? true),
    generatedRecords: data.generatedRecords ?? data.registrosGenerados ?? [],
    failedRecords: data.failedRecords ?? data.registrosFallidos ?? [],
    existingErrorRecords: data.existingErrorRecords ?? data.registrosConError ?? [],
  };
}

async function requestCleanupGeneratedCertificates(
  path: string,
  method: "DELETE" | "POST",
  adminCode: string,
  body?: Record<string, unknown>,
) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: buildAdminHeaders(adminCode),
    body: JSON.stringify({
      generatedOnly: true,
      onlyGenerated: true,
      resetStatus: true,
      ...body,
    }),
  });

  const data = (await readJsonSafe<AttendanceCleanupApiResponse>(response)) ?? {};

  return { response, data };
}

export async function clearGeneratedAttendanceCertificates(
  adminCode: string,
): Promise<AttendanceCertificateCleanupResponse> {
  const candidates: Array<{ path: string; method: "DELETE" | "POST" }> = [
    { path: "/administracion/asistencias/certificados", method: "DELETE" },
    { path: "/administracion/asistencias/certificados/generados", method: "DELETE" },
    { path: "/administracion/asistencias/certificados/borrar", method: "POST" },
    { path: "/administracion/asistencias/certificados/reset", method: "POST" },
  ];

  let lastError = "No se pudieron borrar los certificados generados.";

  for (const candidate of candidates) {
    const { response, data } = await requestCleanupGeneratedCertificates(
      candidate.path,
      candidate.method,
      adminCode,
    );

    if (response.ok) {
      const deleted = Number(data.deleted ?? data.eliminados ?? 0);
      const reset = Number(data.reset ?? data.reiniciados ?? 0);
      const affected = Number(data.affected ?? data.afectados ?? Math.max(deleted, reset));

      return {
        message: data.message,
        deleted,
        reset,
        affected,
      };
    }

    lastError = getApiErrorMessage(data, lastError);

    if (response.status !== 404 && response.status !== 405) {
      break;
    }
  }

  throw new Error(lastError);
}

export async function deleteGeneratedAttendanceCertificate(
  record: AttendanceRecord,
  adminCode: string,
): Promise<AttendanceCertificateCleanupResponse> {
  const candidates: Array<{ path: string; method: "DELETE" | "POST" }> = [
    { path: `/administracion/asistencias/certificados/${record.id}`, method: "DELETE" },
    { path: `/administracion/asistencias/${record.id}/certificado`, method: "DELETE" },
    { path: `/administracion/asistencias/certificados/${record.id}/borrar`, method: "POST" },
    { path: `/administracion/asistencias/${record.id}/certificado/borrar`, method: "POST" },
  ];
  const body = {
    id: record.id,
    attendanceId: record.id,
    recordId: record.id,
    registroId: record.id,
    documento: record.documento,
    role: record.role,
  };
  let lastError = "No se pudo borrar el certificado seleccionado.";

  for (const candidate of candidates) {
    const { response, data } = await requestCleanupGeneratedCertificates(
      candidate.path,
      candidate.method,
      adminCode,
      body,
    );

    if (response.ok) {
      const deleted = Number(data.deleted ?? data.eliminados ?? 0);
      const reset = Number(data.reset ?? data.reiniciados ?? 0);
      const affected = Number(data.affected ?? data.afectados ?? Math.max(deleted, reset, 1));

      return {
        message: data.message,
        deleted,
        reset,
        affected,
      };
    }

    lastError = getApiErrorMessage(data, lastError);

    if (response.status !== 404 && response.status !== 405) {
      break;
    }
  }

  throw new Error(lastError);
}

async function requestRegenerateCertificate(
  path: string,
  adminCode: string,
  record: AttendanceRecord,
) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: buildAdminHeaders(adminCode),
    body: JSON.stringify({
      id: record.id,
      attendanceId: record.id,
      recordId: record.id,
      registroId: record.id,
      attendanceIds: [record.id],
      recordIds: [record.id],
      ids: [record.id],
      documento: record.documento,
      role: record.role,
      pendingOnly: false,
      force: true,
      retryErrors: true,
      sendEmail: true,
      sendEmails: true,
      emailCertificates: true,
      notifyRecipients: true,
    }),
  });

  const data = (await readJsonSafe<AttendanceDispatchApiResponse>(response)) ?? {};

  return { response, data };
}

export async function regenerateAttendanceCertificate(
  record: AttendanceRecord,
  adminCode: string,
): Promise<AttendanceCertificateDispatchResponse> {
  const candidates = [
    `/administracion/asistencias/certificados/${record.id}/regenerar`,
    `/administracion/asistencias/${record.id}/certificado/regenerar`,
  ];
  let lastError = "No se pudo regenerar el certificado seleccionado.";

  for (const path of candidates) {
    const { response, data } = await requestRegenerateCertificate(path, adminCode, record);

    if (response.ok) {
      return {
        message: data.message,
        sent: Number(data.sent ?? data.enviados ?? 0),
        generated: Number(data.generated ?? data.generados ?? data.sent ?? data.enviados ?? 0),
        failed: Number(data.failed ?? data.fallidos ?? 0),
        processed: Number(data.processed ?? data.procesados ?? 0),
        retryErrors: Boolean(data.retryErrors ?? true),
        generatedRecords: data.generatedRecords ?? data.registrosGenerados ?? [],
        failedRecords: data.failedRecords ?? data.registrosFallidos ?? [],
        existingErrorRecords: data.existingErrorRecords ?? data.registrosConError ?? [],
      };
    }

    lastError = getApiErrorMessage(data, lastError);

    if (response.status !== 404 && response.status !== 405) {
      break;
    }
  }

  throw new Error(lastError);
}

async function requestCreateAdminAttendance(
  path: string,
  adminCode: string,
  data: AttendanceManualInput,
) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: buildAdminHeaders(adminCode),
    body: JSON.stringify(
      clean({
        role: data.role,
        nombres: data.nombres,
        apellidos: data.apellidos,
        tipoDocumento: data.tipoDocumento,
        documento: data.documento,
        email: data.email,
        telefono: data.telefono,
        institucion: data.institucion,
        ciudad: data.ciudad,
        semillero: data.semillero,
        universidad: data.universidad,
        programa: data.programa,
        semestre: data.semestre,
        profesion: data.profesion,
        posgrado: data.posgrado,
        universidadPosgrado: data.universidadPosgrado,
        tituloPonencia: data.tituloPonencia,
        ponenciaIds: data.ponenciaIds,
        ponenciasEvaluadas: data.ponenciasEvaluadas,
        source: data.source,
      }),
    ),
  });

  const responseData = (await readJsonSafe<AttendanceCreateApiResponse>(response)) ?? {};

  return { response, data: responseData };
}

export async function createAdminAttendanceRecord(
  data: AttendanceManualInput,
  adminCode: string,
): Promise<AttendanceRecord | null> {
  const candidates = [
    `/administracion/asistencias/${data.role}`,
    "/administracion/asistencias",
    `/asistencias/${data.role}`,
  ];

  let lastError = "No se pudo registrar la asistencia manual.";

  for (const path of candidates) {
    const result = await requestCreateAdminAttendance(path, adminCode, data);

    if (result.response.ok) {
      return (
        result.data.record ??
        result.data.registro ??
        result.data.data ??
        result.data.asistencia ??
        null
      );
    }

    lastError = getApiErrorMessage(result.data, lastError);

    if (result.response.status !== 404 && result.response.status !== 405) {
      break;
    }
  }

  throw new Error(lastError);
}

export async function lookupAttendanceCertificate(
  documento: string,
): Promise<AttendanceCertificateLookupResponse> {
  const baseUrl = getBackendBaseUrl();
  const params = new URLSearchParams({ documento });
  const response = await fetch(
    `${baseUrl}/asistencias/certificados/consulta?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data = (await readJsonSafe<AttendanceCertificateLookupApiResponse>(response)) ?? null;

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(data, "No se pudo consultar el certificado."),
    );
  }

  return {
    status: data?.status ?? data?.estado ?? "error",
    message:
      data?.message ??
      data?.mensaje ??
      "No se pudo interpretar la respuesta del certificado.",
    certificates: data?.certificates ?? data?.certificados ?? [],
  };
}

export function getAttendanceCertificateDownloadUrl(downloadUrl: string) {
  const baseUrl = getBackendBaseUrl();
  return downloadUrl.startsWith("http")
    ? downloadUrl
    : `${baseUrl}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;
}
