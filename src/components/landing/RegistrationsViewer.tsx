"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import type ExcelJS from "exceljs";

import EvaluadoresPanelModal from "./EvaluadoresPanelModal";
import LatePonenciaPanelModal from "./LatePonenciaPanelModal";
import { getAdminRegistros, asignarEvaluadoresTardias } from "@/src/services/admin.service";
import {
  clearAllAttendanceRecords,
  clearGeneratedAttendanceCertificates,
  createAdminAttendanceRecord,
  deleteAttendanceRecord,
  deleteGeneratedAttendanceCertificate,
  getAdminAttendanceSnapshot,
  regenerateAttendanceCertificate,
  sendAttendanceCertificates,
  updateAttendancePublicConfig,
} from "@/src/services/attendance.service";

import type {
  AdminRegistrosResponse,
  AsistenteAdmin,
  EvaluadorAdmin,
  PonenteAdmin,
} from "@/src/types/admin";
import {
  ATTENDANCE_ROLE_META,
  buildAttendanceSummary,
  getAttendanceFullName,
  type AttendanceAdminSummary,
  type AttendanceCertificateDispatchRecord,
  type AttendanceCertificateDispatchResponse,
  type AttendanceManualInput,
  type AttendanceRecord,
} from "@/src/types/attendance";

type ExcelRowValue = string | number | boolean | null | undefined;
type ExcelRowData = Record<string, ExcelRowValue>;
type DuplicateMap = Map<string, number>;
type TabKey = "ponentes" | "evaluadores" | "asistentes" | "asistencias";

const LINEAS_TEMATICAS: Record<string, string> = {
  "1": "Derecho público y privado",
  "2": "Derecho internacional: soberanía y Estado",
  "3": "Ética jurídica · Métodos de resolución de conflictos · Filosofía del Derecho",
  "4": "Legal Tech · Educación · IA",
  "5": "Derechos humanos · Género · Cultura de paz · Medio ambiente",
  "6": "Derecho y sociedad · Emprendimiento y empresa",
};

const ADMIN_PANEL_CODE =
  process.env.NEXT_PUBLIC_ADMIN_PANEL_CODE ??
  process.env.NEXT_PUBLIC_EVALUADORES_PANEL_CODE ??
  "";

const LOCAL_STORAGE_PANEL_KEY = "congreso:evaluadores-panel-authorized";

function getLineaTematicaLabel(value?: string | null) {
  if (!value) return "-";
  return LINEAS_TEMATICAS[value] ?? value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO");
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function objectMatchesSearch(value: unknown, term: string): boolean {
  if (!term) return true;
  if (value === null || value === undefined) return false;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return normalizeText(value).includes(term);
  }

  if (Array.isArray(value)) {
    return value.some((item) => objectMatchesSearch(item, term));
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      objectMatchesSearch(item, term),
    );
  }

  return false;
}

function getProgramacionLabel(ponente: PonenteAdmin) {
  const p = ponente.programaciones?.[0];
  if (!p) return "-";
  return `${formatDate(p.fecha)} · ${p.inicio} - ${p.fin} · ${p.salon?.nombre ?? "-"}`;
}

function getEvaluadoresLabel(ponente: PonenteAdmin) {
  if (!ponente.asignaciones?.length) return "-";

  return ponente.asignaciones
    .filter((a) => a.activo && a.evaluador)
    .map((a) => `${a.evaluador?.nombres} ${a.evaluador?.apellidos}`)
    .join(" | ");
}

function getPonenteFullName(p: PonenteAdmin) {
  return normalizeText(`${p.nombres} ${p.apellidos}`);
}

function getPonenteSecondaryFullName(p: PonenteAdmin) {
  return `${p.nombres2 ?? ""} ${p.apellidos2 ?? ""}`.trim();
}

function getEvaluadorFullName(e: EvaluadorAdmin) {
  return normalizeText(`${e.nombres} ${e.apellidos}`);
}

function getAsistenteFullName(a: AsistenteAdmin) {
  return normalizeText(`${a.nombres} ${a.apellidos}`);
}

function getAttendanceDocumentKey(record: AttendanceRecord) {
  return normalizeText(`${record.role}::${record.documento}`);
}

function getAttendanceFullNameKey(record: AttendanceRecord) {
  return normalizeText(`${record.role}::${getAttendanceFullName(record)}`);
}

function getAttendanceRoleLabel(role: AttendanceRecord["role"]) {
  if (typeof role === "string" && role in ATTENDANCE_ROLE_META) {
    return ATTENDANCE_ROLE_META[role as keyof typeof ATTENDANCE_ROLE_META].label;
  }

  return String(role ?? "-");
}

function getCertificateStatusLabel(status?: string | null) {
  if (status === "sent") return "Generado";
  if (status === "error") return "Error";
  return "Pendiente";
}

function getDispatchRecordName(record: AttendanceCertificateDispatchRecord) {
  return (
    record.fullName ??
    `${record.nombres ?? ""} ${record.apellidos ?? ""}`.trim() ??
    "-"
  );
}

function buildCertificateExplanation(result: AttendanceCertificateDispatchResponse) {
  const failedRecords = result.failedRecords ?? [];
  const existingErrorRecords = result.existingErrorRecords ?? [];
  const generated = result.generated ?? result.sent ?? 0;

  if (failedRecords.length) {
    const roleList = [
      ...new Set(failedRecords.map((record) => String(record.role ?? "").toLowerCase())),
    ].filter(Boolean);

    if (roleList.includes("evaluador")) {
      return "Para evaluadores el certificado necesita encontrar al evaluador y sus ponencias asignadas. Para ponentes y asistentes basta con la asistencia; si alguno de esos roles falla, revisa el detalle porque normalmente sera un problema de plantilla, conversion a PDF o archivo.";
    }

    if (roleList.includes("ponente") || roleList.includes("asistente")) {
      return "Para ponentes y asistentes el unico requisito es que la asistencia exista. Si fallo, el backend encontro un problema tecnico al crear el Word/PDF o al leer la plantilla; revisa el detalle de cada registro.";
    }

    return "El backend intento crear el archivo Word/PDF, pero uno o mas registros fallaron. Revisa el detalle de cada registro arriba; normalmente el mensaje indica si falta una inscripcion, una plantilla o la conversion a PDF.";
  }

  if (!generated && existingErrorRecords.length) {
    return "No habia registros pendientes nuevos. Sin embargo, existen registros que ya estaban en error; revisa el detalle para corregir el rol o la inscripcion antes de volver a generar.";
  }

  if (generated > 0) {
    return "Los certificados generados ya quedaron disponibles para consulta por cedula en la pagina principal.";
  }

  return "No habia asistencias pendientes para procesar. Registra una asistencia nueva o corrige los registros con error si esperabas generar un certificado.";
}

function buildCountMap(values: string[]): DuplicateMap {
  const map = new Map<string, number>();
  values.forEach((value) => {
    if (!value) return;
    map.set(value, (map.get(value) ?? 0) + 1);
  });
  return map;
}

function isDuplicate(map: DuplicateMap, value: string) {
  if (!value) return false;
  return (map.get(value) ?? 0) > 1;
}

function buildPonentesSheetRows(
  ponentes: PonenteAdmin[],
  includeProtectedData: boolean,
) {
  return ponentes.map((p, index) => {
    const programacion = p.programaciones?.[0];

    const publicData: ExcelRowData = {
      "#": index + 1,
      "TITULO PONENCIA": p.tituloPonencia,
      "LINEA TEMATICA": getLineaTematicaLabel(p.lineaTematica),
      RESUMEN: p.resumen,
      VERIFICADO: p.verificado ? "SI" : "NO",
      AGENDADO: p.agendado ? "SI" : "NO",
      "FECHA PROGRAMACION": programacion ? formatDate(programacion.fecha) : "",
      "HORA INICIO": programacion?.inicio ?? "",
      "HORA FIN": programacion?.fin ?? "",
      SALON: programacion?.salon?.nombre ?? "",
      "FECHA REGISTRO": formatDate(p.createdAt),
    };

    if (!includeProtectedData) return publicData;

    return {
      "#": index + 1,
      "TITULO PONENCIA": p.tituloPonencia,
      "LINEA TEMATICA": getLineaTematicaLabel(p.lineaTematica),
      RESUMEN: p.resumen,
      VERIFICADO: p.verificado ? "SI" : "NO",
      AGENDADO: p.agendado ? "SI" : "NO",
      "FECHA PROGRAMACION": programacion ? formatDate(programacion.fecha) : "",
      "HORA INICIO": programacion?.inicio ?? "",
      "HORA FIN": programacion?.fin ?? "",
      SALON: programacion?.salon?.nombre ?? "",
      "PONENTE 1 NOMBRES": p.nombres,
      "PONENTE 1 APELLIDOS": p.apellidos,
      "PONENTE 1 TIPO DOCUMENTO": p.tipoDocumento,
      "PONENTE 1 DOCUMENTO": p.documento,
      "PONENTE 1 EMAIL": p.email,
      "PONENTE 1 TELEFONO": p.telefono,
      PAIS: p.pais,
      CIUDAD: p.ciudad,
      UNIVERSIDAD: p.universidad ?? "",
      PROGRAMA: p.programa ?? "",
      SEMESTRE: p.semestre ?? "",
      "GRUPO INVESTIGACION": p.grupoInvestigacion ?? "",
      SEMILLERO: p.semillero ?? "",
      "URL PONENCIA PDF": p.ponenciaPdfUrl,
      "URL CESION PDF": p.cesionDerechosPdfUrl,
      "EVALUADORES ASIGNADOS": getEvaluadoresLabel(p),
      "FECHA REGISTRO": formatDate(p.createdAt),
    };
  });
}

function buildEvaluadoresSheetRows(evaluadores: EvaluadorAdmin[]) {
  return evaluadores.map((e, index) => ({
    "#": index + 1,
    NOMBRES: e.nombres,
    APELLIDOS: e.apellidos,
    "TIPO DOCUMENTO": e.tipoDocumento,
    DOCUMENTO: e.documento,
    EMAIL: e.email,
    TELEFONO: e.telefono,
    PAIS: e.pais,
    CIUDAD: e.ciudad,
    UNIVERSIDAD: e.universidad,
    PROFESION: e.profesion,
    POSGRADO: e.posgrado,
    "UNIVERSIDAD POSGRADO": e.universidadPosgrado,
    "ES DOCENTE": e.esDocente,
    "PROGRAMA DOCENCIA": e.programaDocencia ?? "",
    "UNIVERSIDAD DOCENCIA": e.universidadDocencia ?? "",
    VERIFICADO: e.verificado ? "SI" : "NO",
    AGENDADO: e.agendado ? "SI" : "NO",
    "FECHA REGISTRO": formatDate(e.createdAt),
  }));
}

function buildAsistentesSheetRows(asistentes: AsistenteAdmin[]) {
  return asistentes.map((a, index) => ({
    "#": index + 1,
    NOMBRES: a.nombres,
    APELLIDOS: a.apellidos,
    "TIPO DOCUMENTO": a.tipoDocumento,
    DOCUMENTO: a.documento,
    EMAIL: a.email,
    TELEFONO: a.telefono,
    PAIS: a.pais,
    CIUDAD: a.ciudad,
    UNIVERSIDAD: a.universidad ?? "",
    PROGRAMA: a.programa ?? "",
    SEMESTRE: a.semestre ?? "",
    "FECHA REGISTRO": formatDate(a.createdAt),
  }));
}

function buildAttendanceSheetRows(records: AttendanceRecord[]) {
  return records.map((record, index) => ({
    "#": index + 1,
    ROL: getAttendanceRoleLabel(record.role),
    NOMBRES: record.nombres,
    APELLIDOS: record.apellidos,
    "TIPO DOCUMENTO": record.tipoDocumento,
    DOCUMENTO: record.documento,
    EMAIL: record.email,
    TELEFONO: record.telefono,
    INSTITUCION: record.institucion,
    CIUDAD: record.ciudad,
    SEMILLERO: record.semillero ?? "",
    ORIGEN: record.source,
    "ESTADO CERTIFICADO": getCertificateStatusLabel(record.certificateStatus),
    "FECHA GENERACION CERTIFICADO": formatDate(record.certificateSentAt),
    "FECHA REGISTRO": formatDate(record.createdAt),
    "ERROR CERTIFICADO": record.certificateError ?? "",
  }));
}

function buildProtectedSheetRows(sheetLabel: string) {
  return [
    {
      ESTADO: "PROTEGIDO",
      MENSAJE:
        "Debes ingresar el código del panel para exportar los datos completos de ponentes, la hoja de evaluadores y la columna de evaluadores asignados.",
    },
  ];
}

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
async function downloadPdfFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("No se pudo descargar el PDF.");
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" })
    );

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(error);
    toast.error("No se pudo descargar el PDF.");
  }
}
function styleWorksheet(
  worksheet: ExcelJS.Worksheet,
  rowsLength: number,
  duplicateRows: Set<number>,
  duplicateColumns: number[] = [],
) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: "A1",
    to: { row: 1, column: worksheet.lastColumn?.number ?? 1 },
  };

  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4B34AD" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD9DCE3" } },
      left: { style: "thin", color: { argb: "FFD9DCE3" } },
      bottom: { style: "thin", color: { argb: "FFD9DCE3" } },
      right: { style: "thin", color: { argb: "FFD9DCE3" } },
    };
  });

  for (let i = 2; i <= rowsLength + 1; i++) {
    const row = worksheet.getRow(i);
    row.height = 20;

    row.eachCell((cell, colNumber: number) => {
      const isDuplicateRow = duplicateRows.has(i);
      const isDuplicateCell = duplicateColumns.includes(colNumber);

      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE4E7EC" } },
        left: { style: "thin", color: { argb: "FFE4E7EC" } },
        bottom: { style: "thin", color: { argb: "FFE4E7EC" } },
        right: { style: "thin", color: { argb: "FFE4E7EC" } },
      };

      if (isDuplicateCell) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFDE2E1" },
        };
        cell.font = { color: { argb: "FFB42318" }, bold: true };
      } else if (isDuplicateRow) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF1F0" },
        };
      } else {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC" },
        };
      }
    });
  }
}

async function exportExcel(
  data: AdminRegistrosResponse,
  attendanceRecords: AttendanceRecord[],
  includeProtectedData: boolean,
) {
  const ExcelJSImport = await import("exceljs");
  const workbook = new ExcelJSImport.Workbook();

  workbook.creator = "ChatGPT";
  workbook.created = new Date();
  workbook.modified = new Date();

  const ponentesRows = buildPonentesSheetRows(
    data.ponentes,
    includeProtectedData,
  );
  const evaluadoresRows = includeProtectedData
    ? buildEvaluadoresSheetRows(data.evaluadores)
    : buildProtectedSheetRows("evaluadores");
  const asistentesRows = buildAsistentesSheetRows(data.asistentes);
  const attendanceRows = includeProtectedData
    ? buildAttendanceSheetRows(attendanceRecords)
    : buildProtectedSheetRows("asistencias");

  const ponentesSheet = workbook.addWorksheet("Ponentes");
  const evaluadoresSheet = workbook.addWorksheet("Evaluadores");
  const asistentesSheet = workbook.addWorksheet("Asistentes");
  const attendanceSheet = workbook.addWorksheet("Asistencias");

  function fillSheet(worksheet: ExcelJS.Worksheet, rows: ExcelRowData[]) {
    if (!rows.length) return;

    const columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: Math.min(Math.max(key.length + 4, 16), 38),
    }));

    worksheet.columns = columns;

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    worksheet.columns.forEach((column) => {
      let max = column.header ? String(column.header).length : 10;

      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > max) max = len;
      });

      column.width = Math.min(Math.max(max + 3, 14), 42);
    });
  }

  fillSheet(ponentesSheet, ponentesRows);
  fillSheet(evaluadoresSheet, evaluadoresRows);
  fillSheet(asistentesSheet, asistentesRows);
  fillSheet(attendanceSheet, attendanceRows);

  const dupPonenteDoc = buildCountMap(
    data.ponentes.map((p) => normalizeText(p.documento)),
  );
  const dupPonenteName = buildCountMap(
    data.ponentes.map((p) => getPonenteFullName(p)),
  );
  const dupPonenciaTitle = buildCountMap(
    data.ponentes.map((p) => normalizeText(p.tituloPonencia)),
  );

  const dupEvaluadorDoc = buildCountMap(
    data.evaluadores.map((e) => normalizeText(e.documento)),
  );
  const dupEvaluadorName = buildCountMap(
    data.evaluadores.map((e) => getEvaluadorFullName(e)),
  );

  const dupAsistenteDoc = buildCountMap(
    data.asistentes.map((a) => normalizeText(a.documento)),
  );
  const dupAsistenteName = buildCountMap(
    data.asistentes.map((a) => getAsistenteFullName(a)),
  );

  const dupAttendanceDoc = buildCountMap(
    attendanceRecords.map((record) => getAttendanceDocumentKey(record)),
  );
  const dupAttendanceName = buildCountMap(
    attendanceRecords.map((record) => getAttendanceFullNameKey(record)),
  );

  const duplicatePonenteRows = new Set<number>();
  data.ponentes.forEach((p, index) => {
    if (
      isDuplicate(dupPonenteDoc, normalizeText(p.documento)) ||
      isDuplicate(dupPonenteName, getPonenteFullName(p)) ||
      isDuplicate(dupPonenciaTitle, normalizeText(p.tituloPonencia))
    ) {
      duplicatePonenteRows.add(index + 2);
    }
  });

  const duplicateEvaluadorRows = new Set<number>();
  data.evaluadores.forEach((e, index) => {
    if (
      isDuplicate(dupEvaluadorDoc, normalizeText(e.documento)) ||
      isDuplicate(dupEvaluadorName, getEvaluadorFullName(e))
    ) {
      duplicateEvaluadorRows.add(index + 2);
    }
  });

  const duplicateAsistenteRows = new Set<number>();
  data.asistentes.forEach((a, index) => {
    if (
      isDuplicate(dupAsistenteDoc, normalizeText(a.documento)) ||
      isDuplicate(dupAsistenteName, getAsistenteFullName(a))
    ) {
      duplicateAsistenteRows.add(index + 2);
    }
  });

  const duplicateAttendanceRows = new Set<number>();
  attendanceRecords.forEach((record, index) => {
    if (
      isDuplicate(dupAttendanceDoc, getAttendanceDocumentKey(record)) ||
      isDuplicate(dupAttendanceName, getAttendanceFullNameKey(record))
    ) {
      duplicateAttendanceRows.add(index + 2);
    }
  });

  styleWorksheet(ponentesSheet, ponentesRows.length, duplicatePonenteRows);
  styleWorksheet(
    evaluadoresSheet,
    evaluadoresRows.length,
    includeProtectedData ? duplicateEvaluadorRows : new Set<number>(),
  );
  styleWorksheet(asistentesSheet, asistentesRows.length, duplicateAsistenteRows);
  styleWorksheet(
    attendanceSheet,
    attendanceRows.length,
    includeProtectedData ? duplicateAttendanceRows : new Set<number>(),
  );

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer as ArrayBuffer, "registros-congreso.xlsx");
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="rv-search-box flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm">
      <span className="text-base opacity-70">🔎</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder ??
          "Buscar por título, nombre, documento, universidad, correo o cualquier dato..."
        }
        className="rv-search-input w-full bg-transparent text-sm outline-none placeholder:opacity-60"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rv-clear-btn rounded-lg px-2 py-1 text-xs font-medium transition"
        >
          Limpiar
        </button>
      ) : null}
    </div>
  );
}

function LineaTematicaFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const entries = Object.entries(LINEAS_TEMATICAS);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filtrar por eje temático"
      className="rv-select w-full rounded-2xl border px-4 py-3 text-sm outline-none"
    >
      <option value="">Todos los ejes temáticos</option>
      {entries.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Tabs({
  current,
  onChange,
  totals,
}: {
  current: TabKey;
  onChange: (tab: TabKey) => void;
  totals: {
    ponentes: number;
    evaluadores: number;
    asistentes: number;
    asistencias: number;
  };
}) {
  const items: Array<{ key: TabKey; label: string; total: number }> = [
    { key: "ponentes", label: "Ponentes", total: totals.ponentes },
    { key: "evaluadores", label: "Evaluadores", total: totals.evaluadores },
    { key: "asistentes", label: "Asistentes", total: totals.asistentes },
    { key: "asistencias", label: "Asistencias", total: totals.asistencias },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = current === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            data-active={active}
            className="rv-tab rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          >
            {item.label}
            <span className="rv-tab-count ml-2 rounded-full px-2 py-0.5 text-xs">
              {item.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LoaderCard() {
  return (
    <div className="rv-card rounded-3xl border p-8">
      <div className="flex flex-col items-center justify-center gap-4 py-6">
        <div className="rv-spinner h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <div className="text-center">
          <p className="rv-text-main font-semibold">
            Cargando registros
          </p>
          <p className="mt-1 text-sm opacity-70">
            Estamos trayendo la información del evento...
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rv-card rounded-3xl border p-8 text-center">
      <p className="rv-text-main font-medium">{message}</p>
    </div>
  );
}

function AccordionTable({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="rv-table-shell overflow-hidden rounded-3xl border">
      <summary
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className="rv-table-header group flex w-full cursor-pointer list-none items-center justify-center gap-3 border-b px-5 py-5 text-center transition-colors [&::-webkit-details-marker]:hidden"
      >
        <span className="rv-text-main text-base font-bold">{title}</span>
        <span className="rv-chip inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
          {count} registros
        </span>
        <ChevronDown
          size={18}
          className={`rv-text-main shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </summary>
      {open ? <div className="overflow-x-auto">{children}</div> : null}
    </details>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rv-chip inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
      {children}
    </span>
  );
}

function DuplicateBadge() {
  return (
    <span className="rv-dup-badge ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
      Duplicado
    </span>
  );
}

function AdmisionBadge({ verificado }: { verificado: boolean }) {
  return (
    <span
      className="rv-admission-badge"
      data-status={verificado ? "admitida" : "rechazada"}
    >
      {verificado ? "Admitida" : "Rechazada"}
    </span>
  );
}

function dangerCellClass(active: boolean): string {
  return active ? "rv-cell-danger" : "";
}

function dangerRowClass(active: boolean, even: boolean, verificado?: boolean): string {
  if (active) return "rv-row-border rv-row-danger";
  if (verificado === true)  return "rv-row-border rv-row-admitida";
  if (verificado === false) return "rv-row-border rv-row-rechazada";
  return even ? "rv-row-border rv-row-even" : "rv-row-border rv-row-odd";
}

function TableShell({
  children,
  countLabel,
}: {
  children: React.ReactNode;
  countLabel: string;
}) {
  return (
    <div className="rv-table-shell overflow-hidden rounded-3xl border">
      <div className="rv-table-header flex items-center justify-between border-b px-5 py-4">
        <h3 className="rv-text-main text-sm font-semibold">Resultados</h3>
        <Chip>{countLabel}</Chip>
      </div>

      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function PonentesTable({
  rows,
  duplicateDocs,
  duplicateNames,
  duplicateTitles,
  isPanelAuthorized,
}: {
  rows: PonenteAdmin[];
  duplicateDocs: DuplicateMap;
  duplicateNames: DuplicateMap;
  duplicateTitles: DuplicateMap;
  isPanelAuthorized: boolean;
}) {
  return (
    <TableShell countLabel={`${rows.length} ponencias`}>
      <table
        className={`${isPanelAuthorized ? "min-w-[2300px]" : "min-w-[900px]"} w-full text-sm`}
      >
        <thead
          className="rv-thead sticky top-0 z-10"
        >
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Título de la ponencia</th>
            <th className="px-4 py-3 font-semibold">Eje temático</th>
            <th className="px-4 py-3 font-semibold">Programación</th>
            {isPanelAuthorized ? (
              <>
                <th className="px-4 py-3 font-semibold">Evaluadores</th>
                <th className="px-4 py-3 font-semibold">Ponente 1</th>
                <th className="px-4 py-3 font-semibold">Tipo doc.</th>
                <th className="px-4 py-3 font-semibold">Documento</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">País</th>
                <th className="px-4 py-3 font-semibold">Ciudad</th>
                <th className="px-4 py-3 font-semibold">Universidad</th>
                <th className="px-4 py-3 font-semibold">Programa</th>
                <th className="px-4 py-3 font-semibold">Semestre</th>
                <th className="px-4 py-3 font-semibold">Grupo investigación</th>
                <th className="px-4 py-3 font-semibold">Semillero</th>
                <th className="px-4 py-3 font-semibold">PDF ponencia</th>
                <th className="px-4 py-3 font-semibold">PDF cesión</th>
              </>
            ) : null}
            <th className="px-4 py-3 font-semibold">Fecha registro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isDocDup = isDuplicate(
              duplicateDocs,
              normalizeText(row.documento),
            );
            const isNameDup = isDuplicate(
              duplicateNames,
              getPonenteFullName(row),
            );
            const isTitleDup = isDuplicate(
              duplicateTitles,
              normalizeText(row.tituloPonencia),
            );
            const rowHasDup =
              isTitleDup || (isPanelAuthorized && (isDocDup || isNameDup));

            return (
              <tr
                key={row.id}
                className={`border-t transition-colors hover:bg-black/5 ${dangerRowClass(rowHasDup, index % 2 === 0, row.verificado)}`}
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td
                  className={`rv-title-cell px-4 py-3 font-semibold ${isTitleDup ? "rv-cell-title-danger rv-cell-danger" : "rv-cell-title-primary"}`}
                >
                  {row.tituloPonencia}
                  {isTitleDup ? <DuplicateBadge /> : null}
                  <AdmisionBadge verificado={row.verificado} />
                </td>
                <td className="px-4 py-3">
                  <Chip>{getLineaTematicaLabel(row.lineaTematica)}</Chip>
                </td>
                <td className="px-4 py-3">{getProgramacionLabel(row)}</td>
                {isPanelAuthorized ? (
                  <>
                    <td className="px-4 py-3">{getEvaluadoresLabel(row)}</td>
                    <td className={`px-4 py-3 ${dangerCellClass(isNameDup)}`}>
                      {`${row.nombres} ${row.apellidos}`}
                      {isNameDup ? <DuplicateBadge /> : null}
                    </td>
                    <td className="px-4 py-3">{row.tipoDocumento}</td>
                    <td className={`px-4 py-3 ${dangerCellClass(isDocDup)}`}>
                      {row.documento}
                      {isDocDup ? <DuplicateBadge /> : null}
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.telefono}</td>
                    <td className="px-4 py-3">{row.pais}</td>
                    <td className="px-4 py-3">{row.ciudad}</td>
                    <td className="px-4 py-3">{row.universidad ?? "-"}</td>
                    <td className="px-4 py-3">{row.programa ?? "-"}</td>
                    <td className="px-4 py-3">{row.semestre ?? "-"}</td>
                    <td className="px-4 py-3">{row.grupoInvestigacion ?? "-"}</td>
                    <td className="px-4 py-3">{row.semillero ?? "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          downloadPdfFile(row.ponenciaPdfUrl, "ponencia.pdf")
                        }
                        className="rv-link underline"
                      >
                        Descargar PDF
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          downloadPdfFile(
                            row.cesionDerechosPdfUrl,
                            "cesion-derechos.pdf",
                          )
                        }
                        className="rv-link underline"
                      >
                        Descargar PDF
                      </button>
                    </td>
                  </>
                ) : null}
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableShell>
  );
}

function EvaluadoresTable({
  rows,
  duplicateDocs,
  duplicateNames,
}: {
  rows: EvaluadorAdmin[];
  duplicateDocs: DuplicateMap;
  duplicateNames: DuplicateMap;
}) {
  return (
    <TableShell countLabel={`${rows.length} evaluadores`}>
      <table className="min-w-[1450px] w-full text-sm">
        <thead
          className="rv-thead sticky top-0 z-10"
        >
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Nombres</th>
            <th className="px-4 py-3 font-semibold">Apellidos</th>
            <th className="px-4 py-3 font-semibold">Tipo doc.</th>
            <th className="px-4 py-3 font-semibold">Documento</th>
            <th className="px-4 py-3 font-semibold">Correo</th>
            <th className="px-4 py-3 font-semibold">Teléfono</th>
            <th className="px-4 py-3 font-semibold">País</th>
            <th className="px-4 py-3 font-semibold">Ciudad</th>
            <th className="px-4 py-3 font-semibold">Universidad</th>
            <th className="px-4 py-3 font-semibold">Profesión</th>
            <th className="px-4 py-3 font-semibold">Posgrado</th>
            <th className="px-4 py-3 font-semibold">Univ. posgrado</th>
            <th className="px-4 py-3 font-semibold">Docente</th>
            <th className="px-4 py-3 font-semibold">Programa docencia</th>
            <th className="px-4 py-3 font-semibold">Univ. docencia</th>
            <th className="px-4 py-3 font-semibold">Fecha registro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isDocDup = isDuplicate(
              duplicateDocs,
              normalizeText(row.documento),
            );
            const isNameDup = isDuplicate(
              duplicateNames,
              getEvaluadorFullName(row),
            );
            const rowHasDup = isDocDup || isNameDup;

            return (
              <tr
                key={row.id}
                className={`border-t transition-colors hover:bg-black/5 ${dangerRowClass(rowHasDup, index % 2 === 0)}`}
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td className={`px-4 py-3 ${dangerCellClass(isNameDup)}`}>
                  {row.nombres}
                  {isNameDup ? <DuplicateBadge /> : null}
                </td>
                <td className={`px-4 py-3 ${dangerCellClass(isNameDup)}`}>
                  {row.apellidos}
                </td>
                <td className="px-4 py-3">{row.tipoDocumento}</td>
                <td className={`px-4 py-3 ${dangerCellClass(isDocDup)}`}>
                  {row.documento}
                  {isDocDup ? <DuplicateBadge /> : null}
                </td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{row.telefono}</td>
                <td className="px-4 py-3">{row.pais}</td>
                <td className="px-4 py-3">{row.ciudad}</td>
                <td className="px-4 py-3">{row.universidad}</td>
                <td className="px-4 py-3">{row.profesion}</td>
                <td className="px-4 py-3">{row.posgrado}</td>
                <td className="px-4 py-3">{row.universidadPosgrado}</td>
                <td className="px-4 py-3">
                  <Chip>{row.esDocente}</Chip>
                </td>
                <td className="px-4 py-3">{row.programaDocencia ?? "-"}</td>
                <td className="px-4 py-3">{row.universidadDocencia ?? "-"}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableShell>
  );
}

function AsistentesTable({
  rows,
  duplicateDocs,
  duplicateNames,
}: {
  rows: AsistenteAdmin[];
  duplicateDocs: DuplicateMap;
  duplicateNames: DuplicateMap;
}) {
  return (
    <TableShell countLabel={`${rows.length} asistentes`}>
      <table className="min-w-[1350px] w-full text-sm">
        <thead
          className="rv-thead sticky top-0 z-10"
        >
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Nombres</th>
            <th className="px-4 py-3 font-semibold">Apellidos</th>
            <th className="px-4 py-3 font-semibold">Tipo doc.</th>
            <th className="px-4 py-3 font-semibold">Documento</th>
            <th className="px-4 py-3 font-semibold">Correo</th>
            <th className="px-4 py-3 font-semibold">Teléfono</th>
            <th className="px-4 py-3 font-semibold">País</th>
            <th className="px-4 py-3 font-semibold">Ciudad</th>
            <th className="px-4 py-3 font-semibold">Universidad</th>
            <th className="px-4 py-3 font-semibold">Programa</th>
            <th className="px-4 py-3 font-semibold">Semestre</th>
            <th className="px-4 py-3 font-semibold">Fecha registro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isDocDup = isDuplicate(
              duplicateDocs,
              normalizeText(row.documento),
            );
            const isNameDup = isDuplicate(
              duplicateNames,
              getAsistenteFullName(row),
            );
            const rowHasDup = isDocDup || isNameDup;

            return (
              <tr
                key={row.id}
                className={`border-t transition-colors hover:bg-black/5 ${dangerRowClass(rowHasDup, index % 2 === 0)}`}
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td className={`px-4 py-3 ${dangerCellClass(isNameDup)}`}>
                  {row.nombres}
                  {isNameDup ? <DuplicateBadge /> : null}
                </td>
                <td className={`px-4 py-3 ${dangerCellClass(isNameDup)}`}>
                  {row.apellidos}
                </td>
                <td className="px-4 py-3">{row.tipoDocumento}</td>
                <td className={`px-4 py-3 ${dangerCellClass(isDocDup)}`}>
                  {row.documento}
                  {isDocDup ? <DuplicateBadge /> : null}
                </td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{row.telefono}</td>
                <td className="px-4 py-3">{row.pais}</td>
                <td className="px-4 py-3">{row.ciudad}</td>
                <td className="px-4 py-3">{row.universidad ?? "-"}</td>
                <td className="px-4 py-3">{row.programa ?? "-"}</td>
                <td className="px-4 py-3">{row.semestre ?? "-"}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableShell>
  );
}

function AttendanceTable({
  rows,
  duplicateDocs,
  duplicateNames,
}: {
  rows: AttendanceRecord[];
  duplicateDocs: DuplicateMap;
  duplicateNames: DuplicateMap;
}) {
  return (
    <TableShell countLabel={`${rows.length} asistencias`}>
      <table className="min-w-[1560px] w-full text-sm">
        <thead
          className="rv-thead sticky top-0 z-10"
        >
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Rol</th>
            <th className="px-4 py-3 font-semibold">Nombres</th>
            <th className="px-4 py-3 font-semibold">Apellidos</th>
            <th className="px-4 py-3 font-semibold">Tipo doc.</th>
            <th className="px-4 py-3 font-semibold">Documento</th>
            <th className="px-4 py-3 font-semibold">Correo</th>
            <th className="px-4 py-3 font-semibold">Telefono</th>
            <th className="px-4 py-3 font-semibold">Institucion</th>
            <th className="px-4 py-3 font-semibold">Ciudad</th>
            <th className="px-4 py-3 font-semibold">Semillero</th>
            <th className="px-4 py-3 font-semibold">Origen</th>
            <th className="px-4 py-3 font-semibold">Certificado</th>
            <th className="px-4 py-3 font-semibold">Generacion certificado</th>
            <th className="px-4 py-3 font-semibold">Fecha registro</th>
            <th className="px-4 py-3 font-semibold">Ultimo error</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isDocDup = isDuplicate(
              duplicateDocs,
              getAttendanceDocumentKey(row),
            );
            const isNameDup = isDuplicate(
              duplicateNames,
              getAttendanceFullNameKey(row),
            );
            const rowHasDup = isDocDup || isNameDup;
            const certificateLabel = getCertificateStatusLabel(row.certificateStatus);

            return (
              <tr
                key={row.id}
                className={`border-t transition-colors hover:bg-black/5 ${dangerRowClass(rowHasDup, index % 2 === 0)}`}
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td className="px-4 py-3">
                  <Chip>{getAttendanceRoleLabel(row.role)}</Chip>
                </td>
                <td className={`px-4 py-3 ${dangerCellClass(isNameDup)}`}>
                  {row.nombres}
                  {isNameDup ? <DuplicateBadge /> : null}
                </td>
                <td className={`px-4 py-3 ${dangerCellClass(isNameDup)}`}>
                  {row.apellidos}
                </td>
                <td className="px-4 py-3">{row.tipoDocumento}</td>
                <td className={`px-4 py-3 ${dangerCellClass(isDocDup)}`}>
                  {row.documento}
                  {isDocDup ? <DuplicateBadge /> : null}
                </td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{row.telefono}</td>
                <td className="px-4 py-3">{row.institucion}</td>
                <td className="px-4 py-3">{row.ciudad}</td>
                <td className="px-4 py-3">{row.semillero ?? "-"}</td>
                <td className="px-4 py-3">
                  <Chip>{String(row.source ?? "-")}</Chip>
                </td>
                <td className="px-4 py-3">
                  <Chip>{certificateLabel}</Chip>
                </td>
                <td className="px-4 py-3">{formatDate(row.certificateSentAt)}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3">{row.certificateError ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableShell>
  );
}

function CertificateGenerationResultModal({
  result,
  onClose,
}: {
  result: AttendanceCertificateDispatchResponse;
  onClose: () => void;
}) {
  const failedRecords = result.failedRecords ?? [];
  const existingErrorRecords = result.existingErrorRecords ?? [];
  const generatedRecords = result.generatedRecords ?? [];
  const hasFailures = failedRecords.length > 0 || existingErrorRecords.length > 0;
  const title = hasFailures
    ? "Certificados con novedades"
    : "Generacion de certificados";
  const explanation = buildCertificateExplanation(result);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 p-4">
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border bg-white shadow-2xl"
        style={{ borderColor: "var(--congreso-border)" }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b p-5"
          style={{ borderColor: "var(--congreso-border)" }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--congreso-primary)" }}
            >
              Respuesta del backend
            </p>
            <h3 className="mt-1 text-xl font-bold">{title}</h3>
            <p className="mt-1 text-sm opacity-75">
              {result.message ??
                `Generados: ${result.generated ?? result.sent}. Fallidos: ${result.failed}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-black/5 px-3 py-2 text-sm font-semibold"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[calc(88vh-92px)] overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-black/[0.04] p-4">
              <p className="text-xs font-semibold uppercase opacity-60">Procesados</p>
              <p className="mt-1 text-2xl font-bold">{result.processed ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-800">
              <p className="text-xs font-semibold uppercase opacity-70">Generados</p>
              <p className="mt-1 text-2xl font-bold">{result.generated ?? result.sent}</p>
            </div>
            <div className="rounded-2xl bg-red-500/10 p-4 text-red-800">
              <p className="text-xs font-semibold uppercase opacity-70">Fallidos</p>
              <p className="mt-1 text-2xl font-bold">{result.failed}</p>
            </div>
          </div>

          {generatedRecords.length ? (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--congreso-border)" }}>
              <p className="font-semibold">Registros generados</p>
              <div className="mt-3 grid gap-2">
                {generatedRecords.map((record) => (
                  <div key={record.id} className="rounded-xl bg-emerald-500/10 p-3 text-sm">
                    <strong>{getDispatchRecordName(record)}</strong> · {record.role} · {record.documento}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {failedRecords.length ? (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "rgba(180,35,24,0.22)" }}>
              <p className="font-semibold text-red-800">Registros fallidos</p>
              <div className="mt-3 grid gap-2">
                {failedRecords.map((record) => (
                  <div key={record.id} className="rounded-xl bg-red-500/10 p-3 text-sm text-red-900">
                    <p>
                      <strong>{getDispatchRecordName(record)}</strong> · {record.role} · {record.documento}
                    </p>
                    <p className="mt-1 opacity-85">
                      {record.error ?? record.certificateError ?? "Sin detalle de error."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {existingErrorRecords.length ? (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "rgba(180,35,24,0.22)" }}>
              <p className="font-semibold text-red-800">Errores existentes</p>
              <div className="mt-3 grid gap-2">
                {existingErrorRecords.map((record) => (
                  <div key={record.id} className="rounded-xl bg-red-500/10 p-3 text-sm text-red-900">
                    <p>
                      <strong>{getDispatchRecordName(record)}</strong> · {record.role} · {record.documento}
                    </p>
                    <p className="mt-1 opacity-85">
                      {record.certificateError ?? "Sin detalle de error."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--congreso-border)" }}>
            <p className="font-semibold">Respuesta tecnica del back</p>
            <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-black p-4 text-xs text-white">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          <div className="mt-5 rounded-2xl bg-violet-500/10 p-4 text-sm">
            <p className="font-semibold">Explicacion sencilla</p>
            <p className="mt-1 opacity-85">{explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationsViewer({
  attendanceEnabled,
  onAttendanceEnabledChange,
}: {
  attendanceEnabled: boolean;
  onAttendanceEnabledChange: (enabled: boolean) => void;
}) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("ponentes");
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [lineaFilter, setLineaFilter] = React.useState("");
  const [data, setData] = React.useState<AdminRegistrosResponse | null>(null);

  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelCode, setPanelCode] = React.useState("");
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [validatingCode, setValidatingCode] = React.useState(false);
  const [attendanceRecords, setAttendanceRecords] = React.useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = React.useState(false);
  const [attendanceError, setAttendanceError] = React.useState<string | null>(null);
  const [attendanceSummary, setAttendanceSummary] =
    React.useState<AttendanceAdminSummary | null>(null);
  const [togglingAttendance, setTogglingAttendance] = React.useState(false);
  const [sendingCertificates, setSendingCertificates] = React.useState(false);
  const [deletingCertificates, setDeletingCertificates] = React.useState(false);
  const [deletingAttendance, setDeletingAttendance] = React.useState(false);
  const [deletingAttendanceId, setDeletingAttendanceId] = React.useState<string | null>(null);
  const [creatingManualAttendance, setCreatingManualAttendance] = React.useState(false);
  const [regeneratingCertificateId, setRegeneratingCertificateId] =
    React.useState<string | null>(null);
  const [expandedSections, setExpandedSections] = React.useState<Record<TabKey, boolean>>({
    ponentes: false,
    evaluadores: false,
    asistentes: false,
    asistencias: false,
  });
  const [certificateResult, setCertificateResult] =
    React.useState<AttendanceCertificateDispatchResponse | null>(null);
  const [assigningTardias, setAssigningTardias] = React.useState(false);
  const [latePonenciaOpen, setLatePonenciaOpen] = React.useState(false);

  const isPanelAuthorized = isAuthorized;
  const adminCode = ADMIN_PANEL_CODE.trim();

  const loadRegistrations = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminRegistros();
      setData(res);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar la informacion.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttendanceAdminData = React.useCallback(async () => {
    if (!isPanelAuthorized) {
      setAttendanceRecords([]);
      setAttendanceSummary(buildAttendanceSummary([]));
      setAttendanceError(null);
      return;
    }

    if (!adminCode) {
      setAttendanceError(
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.",
      );
      return;
    }

    try {
      setAttendanceLoading(true);
      const snapshot = await getAdminAttendanceSnapshot(adminCode);
      setAttendanceRecords(snapshot.records);
      setAttendanceSummary(snapshot.summary ?? buildAttendanceSummary(snapshot.records));
      setAttendanceError(null);
      onAttendanceEnabledChange(snapshot.enabled);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cargar la informacion de asistencias.";
      setAttendanceError(message);
      toast.error(message);
    } finally {
      setAttendanceLoading(false);
    }
  }, [adminCode, isPanelAuthorized, onAttendanceEnabledChange]);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await getAdminRegistros();
        if (mounted) setData(res);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar la información.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(LOCAL_STORAGE_PANEL_KEY);
    if (saved === "true") {
      setIsAuthorized(true);
    }
  }, []);

  React.useEffect(() => {
    if (!isPanelAuthorized) {
      setAttendanceRecords([]);
      setAttendanceSummary(buildAttendanceSummary([]));
      setAttendanceError(null);
      return;
    }

    loadAttendanceAdminData();
  }, [isPanelAuthorized, loadAttendanceAdminData]);

  function handleValidateCode() {
    setValidatingCode(true);

    try {
      const envCode = adminCode;
      const incoming = panelCode.trim();

      if (!envCode) {
        toast.error(
          "No se encontró NEXT_PUBLIC_EVALUADORES_PANEL_CODE en el entorno.",
        );
        return;
      }

      if (!incoming || incoming !== envCode) {
        toast.error("Código incorrecto.");
        return;
      }

      setIsAuthorized(true);
      window.localStorage.setItem(LOCAL_STORAGE_PANEL_KEY, "true");
      toast.success("Acceso habilitado.");
    } finally {
      setValidatingCode(false);
    }
  }

  function handleLogoutPanel() {
    setIsAuthorized(false);
    setPanelCode("");
    setLatePonenciaOpen(false);
    window.localStorage.removeItem(LOCAL_STORAGE_PANEL_KEY);
    toast.success("Acceso cerrado en este navegador.");
  }

  async function handleExport() {
    if (!data) return;

    try {
      setExporting(true);
      await exportExcel(data, attendanceRecords, isPanelAuthorized);
      toast.success(
        isPanelAuthorized
          ? "Excel generado correctamente."
          : "Excel generado con la vista restringida de ponencias y sin evaluadores.",
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el Excel.");
    } finally {
      setExporting(false);
    }
  }

  async function handleToggleAttendance() {
    if (!adminCode) {
      toast.error(
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.",
      );
      return;
    }

    try {
      setTogglingAttendance(true);
      const config = await updateAttendancePublicConfig(!attendanceEnabled, adminCode);
      onAttendanceEnabledChange(config.enabled);
      toast.success(
        config.enabled
          ? "Las asistencias quedaron habilitadas."
          : "Las asistencias quedaron deshabilitadas.",
      );
      await loadAttendanceAdminData();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado de asistencias.",
      );
    } finally {
      setTogglingAttendance(false);
    }
  }

  async function handleSendCertificates() {
    if (!adminCode) {
      toast.error(
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.",
      );
      return;
    }

    try {
      setSendingCertificates(true);
      const result = await sendAttendanceCertificates(adminCode);
      setCertificateResult(result);
      if (result.failed > 0 || (result.existingErrorRecords?.length ?? 0) > 0) {
        toast.error(result.message ?? "Hay certificados con errores.");
      } else {
        toast.success(
          result.message ??
            `Proceso finalizado. Generados y enviados: ${result.generated ?? result.sent}. Fallidos: ${result.failed}.`,
        );
      }
      await loadAttendanceAdminData();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron generar los certificados.";
      toast.error(message);
      setCertificateResult({
        message,
        sent: 0,
        generated: 0,
        failed: 1,
        processed: 0,
        failedRecords: [],
      });
    } finally {
      setSendingCertificates(false);
    }
  }

  async function handleDeleteGeneratedCertificates() {
    if (!adminCode) {
      const message =
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.";
      toast.error(message);
      throw new Error(message);
    }

    try {
      setDeletingCertificates(true);
      const result = await clearGeneratedAttendanceCertificates(adminCode);
      const affected = result.affected || result.deleted || result.reset;
      toast.success(
        result.message ??
          `Certificados borrados. Registros actualizados: ${affected}.`,
      );
      await loadAttendanceAdminData();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron borrar los certificados generados.";
      toast.error(message);
      throw new Error(message);
    } finally {
      setDeletingCertificates(false);
    }
  }

  async function handleDeleteAllAttendance() {
    if (!adminCode) {
      const message =
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.";
      toast.error(message);
      throw new Error(message);
    }

    try {
      setDeletingAttendance(true);
      await clearAllAttendanceRecords(adminCode);
      toast.success("Todos los registros de asistencia fueron eliminados.");
      await loadAttendanceAdminData();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron eliminar los registros de asistencia.";
      toast.error(message);
      throw new Error(message);
    } finally {
      setDeletingAttendance(false);
    }
  }

  async function handleDeleteAttendanceRecord(record: AttendanceRecord) {
    if (!adminCode) {
      const message =
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.";
      toast.error(message);
      throw new Error(message);
    }

    try {
      setDeletingAttendanceId(record.id);
      await deleteAttendanceRecord(record, adminCode);
      toast.success("Registro de asistencia eliminado.");
      await loadAttendanceAdminData();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el registro de asistencia.";
      toast.error(message);
      throw new Error(message);
    } finally {
      setDeletingAttendanceId(null);
    }
  }

  async function handleCreateManualAttendance(input: AttendanceManualInput) {
    if (!adminCode) {
      const message =
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.";
      toast.error(message);
      throw new Error(message);
    }

    try {
      setCreatingManualAttendance(true);
      await createAdminAttendanceRecord(input, adminCode);
      toast.success("Asistencia manual registrada correctamente.");
      setActiveTab("asistencias");
      await loadAttendanceAdminData();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la asistencia manual.";
      toast.error(message);
      throw new Error(message);
    } finally {
      setCreatingManualAttendance(false);
    }
  }

  async function handleDeleteAndRegenerateCertificate(record: AttendanceRecord) {
    if (!adminCode) {
      const message =
        "No se encontro NEXT_PUBLIC_ADMIN_PANEL_CODE ni NEXT_PUBLIC_EVALUADORES_PANEL_CODE.";
      toast.error(message);
      throw new Error(message);
    }

    try {
      setRegeneratingCertificateId(record.id);
      await deleteGeneratedAttendanceCertificate(record, adminCode);
      const result = await regenerateAttendanceCertificate(record, adminCode);
      setCertificateResult(result);

      if (result.failed > 0 || (result.existingErrorRecords?.length ?? 0) > 0) {
        toast.error(
          result.message ??
            "El certificado se borro, pero hubo novedades al regenerarlo.",
        );
      } else {
        toast.success(
          result.message ??
            "Certificado regenerado y enviado al correo registrado.",
        );
      }

      await loadAttendanceAdminData();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo borrar y regenerar el certificado seleccionado.";
      toast.error(message);
      throw new Error(message);
    } finally {
      setRegeneratingCertificateId(null);
    }
  }

  async function handleAsignarEvaluadoresTardias() {
    try {
      setAssigningTardias(true);
      const result = await asignarEvaluadoresTardias();

      if (result.totalProcesadas === 0) {
        toast.success("No hay ponencias tardias sin evaluadores.");
        return;
      }

      const mensajes = [];
      if (result.totalAsignacionesCreadas > 0) {
        mensajes.push(`${result.asignadas?.length ?? 0} ponencia(s) asignadas correctamente.`);
      }
      if (result.totalSinCobertura > 0) {
        mensajes.push(`${result.totalSinCobertura} ponencia(s) sin cobertura (revisa manualmente).`);
      }

      if (result.totalSinCobertura > 0) {
        toast.error(mensajes.join(" "));
      } else {
        toast.success(mensajes.join(" "));
      }

      await loadRegistrations();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo realizar la asignacion de evaluadores.",
      );
    } finally {
      setAssigningTardias(false);
    }
  }

  const normalizedSearch = normalizeText(search);

  const duplicatePonenteDocs = React.useMemo(
    () => buildCountMap((data?.ponentes ?? []).map((p) => normalizeText(p.documento))),
    [data?.ponentes],
  );

  const duplicatePonenteNames = React.useMemo(
    () => buildCountMap((data?.ponentes ?? []).map((p) => getPonenteFullName(p))),
    [data?.ponentes],
  );

  const duplicatePonenciaTitles = React.useMemo(
    () => buildCountMap((data?.ponentes ?? []).map((p) => normalizeText(p.tituloPonencia))),
    [data?.ponentes],
  );

  const duplicateEvaluadorDocs = React.useMemo(
    () => buildCountMap((data?.evaluadores ?? []).map((e) => normalizeText(e.documento))),
    [data?.evaluadores],
  );

  const duplicateEvaluadorNames = React.useMemo(
    () => buildCountMap((data?.evaluadores ?? []).map((e) => getEvaluadorFullName(e))),
    [data?.evaluadores],
  );

  const duplicateAsistenteDocs = React.useMemo(
    () => buildCountMap((data?.asistentes ?? []).map((a) => normalizeText(a.documento))),
    [data?.asistentes],
  );

  const duplicateAsistenteNames = React.useMemo(
    () => buildCountMap((data?.asistentes ?? []).map((a) => getAsistenteFullName(a))),
    [data?.asistentes],
  );

  const duplicateAttendanceDocs = React.useMemo(
    () => buildCountMap(attendanceRecords.map((record) => getAttendanceDocumentKey(record))),
    [attendanceRecords],
  );

  const duplicateAttendanceNames = React.useMemo(
    () => buildCountMap(attendanceRecords.map((record) => getAttendanceFullNameKey(record))),
    [attendanceRecords],
  );

  const filteredPonentes = React.useMemo(() => {
    let rows = data?.ponentes ?? [];

    if (lineaFilter) {
      rows = rows.filter((item) => item.lineaTematica === lineaFilter);
    }

    if (normalizedSearch) {
      rows = rows.filter((item) =>
        objectMatchesSearch(
          isPanelAuthorized
            ? {
                ...item,
                lineaTematicaLabel: getLineaTematicaLabel(item.lineaTematica),
                programacionLabel: getProgramacionLabel(item),
                evaluadoresLabel: getEvaluadoresLabel(item),
              }
            : {
                tituloPonencia: item.tituloPonencia,
                resumen: item.resumen,
                lineaTematica: item.lineaTematica,
                lineaTematicaLabel: getLineaTematicaLabel(item.lineaTematica),
                programacionLabel: getProgramacionLabel(item),
                verificado: item.verificado,
                agendado: item.agendado,
                createdAt: item.createdAt,
              },
          normalizedSearch,
        ),
      );
    }

    return rows;
  }, [data?.ponentes, isPanelAuthorized, normalizedSearch, lineaFilter]);

  const filteredEvaluadores = React.useMemo(
    () => (data?.evaluadores ?? []).filter((item) => objectMatchesSearch(item, normalizedSearch)),
    [data?.evaluadores, normalizedSearch],
  );

  const filteredAsistentes = React.useMemo(
    () => (data?.asistentes ?? []).filter((item) => objectMatchesSearch(item, normalizedSearch)),
    [data?.asistentes, normalizedSearch],
  );

  const filteredAttendance = React.useMemo(
    () =>
      attendanceRecords.filter((record) =>
        objectMatchesSearch(
          {
            ...record,
            roleLabel: getAttendanceRoleLabel(record.role),
            certificateLabel: getCertificateStatusLabel(record.certificateStatus),
          },
          normalizedSearch,
        ),
      ),
    [attendanceRecords, normalizedSearch],
  );

  const totals = {
    ponentes: data?.ponentes?.length ?? 0,
    evaluadores: data?.evaluadores?.length ?? 0,
    asistentes: data?.asistentes?.length ?? 0,
    asistencias: attendanceRecords.length,
  };

  const filteredCount =
    activeTab === "ponentes"
      ? filteredPonentes.length
      : activeTab === "evaluadores"
      ? filteredEvaluadores.length
      : activeTab === "asistentes"
      ? filteredAsistentes.length
      : filteredAttendance.length;

  const searchPlaceholder =
    activeTab === "ponentes" && !isPanelAuthorized
      ? "Buscar por título, eje temático o programación..."
      : "Buscar por título, nombre, documento, universidad, correo o cualquier dato...";

  return (
    <section id="visualizacion-registros" className="mt-14">
      <div className="rv-section rounded-[28px] border p-5 md:p-7">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="rv-text-primary mb-2 text-xs font-semibold uppercase tracking-[0.16em]">
              Visualización administrativa
            </p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Registros del evento
            </h2>
            <p className="mt-2 max-w-3xl text-sm opacity-80 md:text-[15px]">
              Consulta ponentes, evaluadores y asistentes registrados. Los posibles
              duplicados por documento, nombre o título quedan marcados en rojo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="rv-panel-btn inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200"
            >
              Panel
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={!data || exporting}
              data-exporting={exporting}
              className="rv-export-btn inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="mr-2">📊</span>
              {exporting ? "Generando Excel..." : "Descargar Excel"}
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-4">
          <Tabs current={activeTab} onChange={setActiveTab} totals={totals} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholder}
            />
            {activeTab === "ponentes" ? (
              <LineaTematicaFilter value={lineaFilter} onChange={setLineaFilter} />
            ) : (
              <div />
            )}
          </div>
        </div>

        {!loading && data ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <Chip>{filteredCount} resultados visibles</Chip>
            {search ? <Chip>Búsqueda: {search}</Chip> : null}
            {activeTab === "ponentes" && lineaFilter ? (
              <Chip>Eje: {getLineaTematicaLabel(lineaFilter)}</Chip>
            ) : null}
            {isPanelAuthorized ? <Chip>Panel habilitado</Chip> : null}
            <Chip>
              Asistencias {attendanceEnabled ? "habilitadas" : "deshabilitadas"}
            </Chip>
          </div>
        ) : null}

        {loading ? (
          <LoaderCard />
        ) : !data ? (
          <EmptyState message="No fue posible obtener la información." />
        ) : activeTab === "ponentes" ? (
          <AccordionTable
            title="Ponencias registradas"
            count={filteredPonentes.length}
            open={expandedSections.ponentes}
            onToggle={() =>
              setExpandedSections((prev) => ({ ...prev, ponentes: !prev.ponentes }))
            }
          >
            {filteredPonentes.length ? (
              <PonentesTable
                rows={filteredPonentes}
                duplicateDocs={duplicatePonenteDocs}
                duplicateNames={duplicatePonenteNames}
                duplicateTitles={duplicatePonenciaTitles}
                isPanelAuthorized={isPanelAuthorized}
              />
            ) : (
              <EmptyState message="No se encontraron ponencias con ese criterio de búsqueda o eje temático." />
            )}
          </AccordionTable>
        ) : activeTab === "evaluadores" ? (
          !isPanelAuthorized ? (
            <EmptyState message="Debes ingresar el código en el panel para visualizar los evaluadores." />
          ) : (
            <AccordionTable
              title="Evaluadores registrados"
              count={filteredEvaluadores.length}
              open={expandedSections.evaluadores}
              onToggle={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  evaluadores: !prev.evaluadores,
                }))
              }
            >
              {filteredEvaluadores.length ? (
                <EvaluadoresTable
                  rows={filteredEvaluadores}
                  duplicateDocs={duplicateEvaluadorDocs}
                  duplicateNames={duplicateEvaluadorNames}
                />
              ) : (
                <EmptyState message="No se encontraron evaluadores con ese criterio de búsqueda." />
              )}
            </AccordionTable>
          )
        ) : activeTab === "asistentes" ? (
          <AccordionTable
            title="Asistentes registrados"
            count={filteredAsistentes.length}
            open={expandedSections.asistentes}
            onToggle={() =>
              setExpandedSections((prev) => ({ ...prev, asistentes: !prev.asistentes }))
            }
          >
            {filteredAsistentes.length ? (
              <AsistentesTable
                rows={filteredAsistentes}
                duplicateDocs={duplicateAsistenteDocs}
                duplicateNames={duplicateAsistenteNames}
              />
            ) : (
              <EmptyState message="No se encontraron asistentes con ese criterio de búsqueda." />
            )}
          </AccordionTable>
        ) : !isPanelAuthorized ? (
          <EmptyState message="Debes ingresar el codigo en el panel para visualizar las asistencias y generar certificados." />
        ) : attendanceLoading ? (
          <LoaderCard />
        ) : attendanceError ? (
          <EmptyState message={attendanceError} />
        ) : (
          <AccordionTable
            title="Registros de asistencia"
            count={filteredAttendance.length}
            open={expandedSections.asistencias}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                asistencias: !prev.asistencias,
              }))
            }
          >
            {filteredAttendance.length ? (
              <AttendanceTable
                rows={filteredAttendance}
                duplicateDocs={duplicateAttendanceDocs}
                duplicateNames={duplicateAttendanceNames}
              />
            ) : (
              <EmptyState message="No se encontraron registros de asistencia con ese criterio." />
            )}
          </AccordionTable>
        )}
      </div>

      <EvaluadoresPanelModal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        code={panelCode}
        setCode={setPanelCode}
        onValidate={handleValidateCode}
        validating={validatingCode}
        isAuthorized={isAuthorized}
        onLogout={handleLogoutPanel}
        attendanceEnabled={attendanceEnabled}
        attendanceLoading={attendanceLoading}
        togglingAttendance={togglingAttendance}
        generatingCertificates={sendingCertificates}
        deletingCertificates={deletingCertificates}
        creatingManualAttendance={creatingManualAttendance}
        assigningTardias={assigningTardias}
        attendanceSummary={attendanceSummary}
        attendanceRecords={attendanceRecords}
        availablePonencias={(data?.ponentes ?? []).map((ponente) => ({
          id: ponente.id,
          tituloPonencia: ponente.tituloPonencia,
          documento: ponente.documento,
          nombres: ponente.nombres,
          apellidos: ponente.apellidos,
        }))}
        regeneratingCertificateId={regeneratingCertificateId}
        onToggleAttendance={handleToggleAttendance}
        onGenerateCertificates={handleSendCertificates}
        onDeleteGeneratedCertificates={handleDeleteGeneratedCertificates}
        onCreateManualAttendance={handleCreateManualAttendance}
        onDeleteAndRegenerateCertificate={handleDeleteAndRegenerateCertificate}
        onAsignarEvaluadoresTardias={handleAsignarEvaluadoresTardias}
        deletingAttendance={deletingAttendance}
        deletingAttendanceId={deletingAttendanceId}
        onDeleteAllAttendance={handleDeleteAllAttendance}
        onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
        onOpenLatePonenciaForm={() => {
          setPanelOpen(false);
          setLatePonenciaOpen(true);
        }}
      />

      <LatePonenciaPanelModal
        open={latePonenciaOpen}
        onClose={() => setLatePonenciaOpen(false)}
        onSuccess={loadRegistrations}
      />

      {certificateResult ? (
        <CertificateGenerationResultModal
          result={certificateResult}
          onClose={() => setCertificateResult(null)}
        />
      ) : null}
    </section>
  );
}
