"use client";

import * as React from "react";
import toast from "react-hot-toast";
import type ExcelJS from "exceljs";

import EvaluadoresPanelModal from "./EvaluadoresPanelModal";
import { getAdminRegistros } from "@/src/services/admin.service";

import type {
  AdminRegistrosResponse,
  AsistenteAdmin,
  EvaluadorAdmin,
  PonenteAdmin,
} from "@/src/types/admin";

type ExcelRowValue = string | number | boolean | null | undefined;
type ExcelRowData = Record<string, ExcelRowValue>;
type DuplicateMap = Map<string, number>;
type TabKey = "ponentes" | "evaluadores" | "asistentes";

const LINEAS_TEMATICAS: Record<string, string> = {
  "1": "Derecho público y privado",
  "2": "Derecho internacional: soberanía y Estado",
  "3": "Ética jurídica · Métodos de resolución de conflictos · Filosofía del Derecho",
  "4": "Legal Tech · Educación · IA",
  "5": "Derechos humanos · Género · Cultura de paz · Medio ambiente",
  "6": "Derecho y sociedad · Emprendimiento y empresa",
};

const EVALUADORES_PANEL_CODE =
  process.env.NEXT_PUBLIC_EVALUADORES_PANEL_CODE ?? "";

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

function getEvaluadorFullName(e: EvaluadorAdmin) {
  return normalizeText(`${e.nombres} ${e.apellidos}`);
}

function getAsistenteFullName(a: AsistenteAdmin) {
  return normalizeText(`${a.nombres} ${a.apellidos}`);
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
  includeEvaluadores: boolean,
) {
  return ponentes.map((p, index) => {
    const programacion = p.programaciones?.[0];

    const base: ExcelRowData = {
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
      "PONENTE 2 NOMBRES": p.nombres2 ?? "",
      "PONENTE 2 APELLIDOS": p.apellidos2 ?? "",
      "PONENTE 2 TIPO DOCUMENTO": p.tipoDocumento2 ?? "",
      "PONENTE 2 DOCUMENTO": p.documento2 ?? "",
      "PONENTE 2 EMAIL": p.email2 ?? "",
      "PONENTE 2 TELEFONO": p.telefono2 ?? "",
      PAIS: p.pais,
      CIUDAD: p.ciudad,
      UNIVERSIDAD: p.universidad ?? "",
      PROGRAMA: p.programa ?? "",
      SEMESTRE: p.semestre ?? "",
      "GRUPO INVESTIGACION": p.grupoInvestigacion ?? "",
      SEMILLERO: p.semillero ?? "",
      "URL PONENCIA PDF": p.ponenciaPdfUrl,
      "URL CESION PDF": p.cesionDerechosPdfUrl,
      "FECHA REGISTRO": formatDate(p.createdAt),
    };

    if (includeEvaluadores) {
      return {
        ...base,
        "EVALUADORES ASIGNADOS": getEvaluadoresLabel(p),
      };
    }

    return base;
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

function buildEvaluadoresLockedSheetRows() {
  return [
    {
      ESTADO: "PROTEGIDO",
      MENSAJE:
        "Debes ingresar el código del panel para exportar la hoja de evaluadores y la columna de evaluadores asignados.",
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
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  includeEvaluadores: boolean,
) {
  const ExcelJSImport = await import("exceljs");
  const workbook = new ExcelJSImport.Workbook();

  workbook.creator = "ChatGPT";
  workbook.created = new Date();
  workbook.modified = new Date();

  const ponentesRows = buildPonentesSheetRows(data.ponentes, includeEvaluadores);
  const evaluadoresRows = includeEvaluadores
    ? buildEvaluadoresSheetRows(data.evaluadores)
    : buildEvaluadoresLockedSheetRows();
  const asistentesRows = buildAsistentesSheetRows(data.asistentes);

  const ponentesSheet = workbook.addWorksheet("Ponentes");
  const evaluadoresSheet = workbook.addWorksheet("Evaluadores");
  const asistentesSheet = workbook.addWorksheet("Asistentes");

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

  styleWorksheet(ponentesSheet, ponentesRows.length, duplicatePonenteRows);
  styleWorksheet(
    evaluadoresSheet,
    evaluadoresRows.length,
    includeEvaluadores ? duplicateEvaluadorRows : new Set<number>(),
  );
  styleWorksheet(asistentesSheet, asistentesRows.length, duplicateAsistenteRows);

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer as ArrayBuffer, "registros-congreso.xlsx");
}

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.92)",
        borderColor: "var(--congreso-border)",
      }}
    >
      <span className="text-base opacity-70">🔎</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por título, nombre, documento, universidad, correo o cualquier dato..."
        className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
        style={{ color: "var(--congreso-text)" }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-lg px-2 py-1 text-xs font-medium transition"
          style={{
            background: "rgba(0,0,0,0.06)",
            color: "var(--congreso-text)",
          }}
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
      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
      style={{
        background: "rgba(255,255,255,0.92)",
        borderColor: "var(--congreso-border)",
        color: "var(--congreso-text)",
      }}
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
  totals: { ponentes: number; evaluadores: number; asistentes: number };
}) {
  const items: Array<{ key: TabKey; label: string; total: number }> = [
    { key: "ponentes", label: "Ponentes", total: totals.ponentes },
    { key: "evaluadores", label: "Evaluadores", total: totals.evaluadores },
    { key: "asistentes", label: "Asistentes", total: totals.asistentes },
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
            className="rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200"
            style={{
              background: active
                ? "linear-gradient(135deg, var(--congreso-primary), #5a3fd6)"
                : "rgba(255,255,255,0.9)",
              color: active ? "#fff" : "var(--congreso-text)",
              borderColor: active ? "transparent" : "var(--congreso-border)",
              boxShadow: active
                ? "0 10px 24px rgba(75, 52, 173, 0.22)"
                : "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            {item.label}
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-xs"
              style={{
                background: active
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(0,0,0,0.06)",
                color: active ? "#fff" : "var(--congreso-text)",
              }}
            >
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
    <div
      className="rounded-3xl border p-8"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))",
        borderColor: "var(--congreso-border)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4 py-6">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
          style={{
            borderColor: "rgba(90,63,214,0.20)",
            borderTopColor: "var(--congreso-primary)",
          }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: "var(--congreso-text)" }}>
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
    <div
      className="rounded-3xl border p-8 text-center"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))",
        borderColor: "var(--congreso-border)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.06)",
      }}
    >
      <p className="font-medium" style={{ color: "var(--congreso-text)" }}>
        {message}
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: "rgba(90,63,214,0.10)",
        color: "var(--congreso-primary)",
      }}
    >
      {children}
    </span>
  );
}

function DuplicateBadge() {
  return (
    <span
      className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
      style={{
        background: "rgba(217,45,32,0.12)",
        color: "#B42318",
      }}
    >
      Duplicado
    </span>
  );
}

function dangerCellStyle(active: boolean): React.CSSProperties | undefined {
  if (!active) return undefined;

  return {
    background: "rgba(217,45,32,0.10)",
    color: "#B42318",
    fontWeight: 700,
  };
}

function dangerRowStyle(
  active: boolean,
  fallback: string,
): React.CSSProperties {
  if (!active) return { background: fallback };
  return { background: "rgba(217,45,32,0.06)" };
}

function TableShell({
  children,
  countLabel,
}: {
  children: React.ReactNode;
  countLabel: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-3xl border"
      style={{
        background: "rgba(255,255,255,0.95)",
        borderColor: "var(--congreso-border)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{
          borderColor: "var(--congreso-border)",
          background:
            "linear-gradient(180deg, rgba(248,249,255,0.9), rgba(255,255,255,0.9))",
        }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--congreso-text)" }}>
          Resultados
        </h3>
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
  canViewEvaluadores,
}: {
  rows: PonenteAdmin[];
  duplicateDocs: DuplicateMap;
  duplicateNames: DuplicateMap;
  duplicateTitles: DuplicateMap;
  canViewEvaluadores: boolean;
}) {
  return (
    <TableShell countLabel={`${rows.length} ponencias`}>
      <table className="min-w-[2300px] w-full text-sm">
        <thead
          className="sticky top-0 z-10"
          style={{ background: "rgba(247,248,252,0.98)" }}
        >
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Título de la ponencia</th>
            <th className="px-4 py-3 font-semibold">Eje temático</th>
            <th className="px-4 py-3 font-semibold">Programación</th>
            {canViewEvaluadores ? (
              <th className="px-4 py-3 font-semibold">Evaluadores</th>
            ) : null}
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
            <th className="px-4 py-3 font-semibold">Ponente 2</th>
            <th className="px-4 py-3 font-semibold">Doc. Ponente 2</th>
            <th className="px-4 py-3 font-semibold">Correo Ponente 2</th>
            <th className="px-4 py-3 font-semibold">PDF ponencia</th>
            <th className="px-4 py-3 font-semibold">PDF cesión</th>
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
            const rowHasDup = isDocDup || isNameDup || isTitleDup;

            return (
              <tr
                key={row.id}
                className="border-t transition-colors hover:bg-black/5"
                style={{
                  borderColor: "var(--congreso-border)",
                  ...dangerRowStyle(
                    rowHasDup,
                    index % 2 === 0
                      ? "rgba(255,255,255,0.96)"
                      : "rgba(248,249,255,0.82)",
                  ),
                }}
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td
                  className="px-4 py-3 font-semibold"
                  style={{
                    ...dangerCellStyle(isTitleDup),
                    color: isTitleDup ? "#B42318" : "var(--congreso-primary)",
                  }}
                >
                  {row.tituloPonencia}
                  {isTitleDup ? <DuplicateBadge /> : null}
                </td>
                <td className="px-4 py-3">
                  <Chip>{getLineaTematicaLabel(row.lineaTematica)}</Chip>
                </td>
                <td className="px-4 py-3">{getProgramacionLabel(row)}</td>
                {canViewEvaluadores ? (
                  <td className="px-4 py-3">{getEvaluadoresLabel(row)}</td>
                ) : null}
                <td className="px-4 py-3" style={dangerCellStyle(isNameDup)}>
                  {`${row.nombres} ${row.apellidos}`}
                  {isNameDup ? <DuplicateBadge /> : null}
                </td>
                <td className="px-4 py-3">{row.tipoDocumento}</td>
                <td className="px-4 py-3" style={dangerCellStyle(isDocDup)}>
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
                  {row.nombres2 || row.apellidos2
                    ? `${row.nombres2 ?? ""} ${row.apellidos2 ?? ""}`.trim()
                    : "-"}
                </td>
                <td className="px-4 py-3">{row.documento2 ?? "-"}</td>
                <td className="px-4 py-3">{row.email2 ?? "-"}</td>
                <td className="px-4 py-3">
                  <a
                    href={row.ponenciaPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    style={{ color: "var(--congreso-primary)" }}
                  >
                    Ver PDF
                  </a>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={row.cesionDerechosPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    style={{ color: "var(--congreso-primary)" }}
                  >
                    Ver PDF
                  </a>
                </td>
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
          className="sticky top-0 z-10"
          style={{ background: "rgba(247,248,252,0.98)" }}
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
                className="border-t transition-colors hover:bg-black/5"
                style={{
                  borderColor: "var(--congreso-border)",
                  ...dangerRowStyle(
                    rowHasDup,
                    index % 2 === 0
                      ? "rgba(255,255,255,0.96)"
                      : "rgba(248,249,255,0.82)",
                  ),
                }}
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td className="px-4 py-3" style={dangerCellStyle(isNameDup)}>
                  {row.nombres}
                  {isNameDup ? <DuplicateBadge /> : null}
                </td>
                <td className="px-4 py-3" style={dangerCellStyle(isNameDup)}>
                  {row.apellidos}
                </td>
                <td className="px-4 py-3">{row.tipoDocumento}</td>
                <td className="px-4 py-3" style={dangerCellStyle(isDocDup)}>
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
          className="sticky top-0 z-10"
          style={{ background: "rgba(247,248,252,0.98)" }}
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
                className="border-t transition-colors hover:bg-black/5"
                style={{
                  borderColor: "var(--congreso-border)",
                  ...dangerRowStyle(
                    rowHasDup,
                    index % 2 === 0
                      ? "rgba(255,255,255,0.96)"
                      : "rgba(248,249,255,0.82)",
                  ),
                }}
              >
                <td className="px-4 py-3 font-semibold">{index + 1}</td>
                <td className="px-4 py-3" style={dangerCellStyle(isNameDup)}>
                  {row.nombres}
                  {isNameDup ? <DuplicateBadge /> : null}
                </td>
                <td className="px-4 py-3" style={dangerCellStyle(isNameDup)}>
                  {row.apellidos}
                </td>
                <td className="px-4 py-3">{row.tipoDocumento}</td>
                <td className="px-4 py-3" style={dangerCellStyle(isDocDup)}>
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

export default function RegistrationsViewer() {
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

  const canViewEvaluadores = isAuthorized;

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

  function handleValidateCode() {
    setValidatingCode(true);

    try {
      const envCode = EVALUADORES_PANEL_CODE.trim();
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
    window.localStorage.removeItem(LOCAL_STORAGE_PANEL_KEY);
    toast.success("Acceso cerrado en este navegador.");
  }

  async function handleExport() {
    if (!data) return;

    try {
      setExporting(true);
      await exportExcel(data, canViewEvaluadores);
      toast.success(
        canViewEvaluadores
          ? "Excel generado correctamente."
          : "Excel generado sin la hoja y columna de evaluadores.",
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el Excel.");
    } finally {
      setExporting(false);
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

  const filteredPonentes = React.useMemo(() => {
    let rows = data?.ponentes ?? [];

    if (lineaFilter) {
      rows = rows.filter((item) => item.lineaTematica === lineaFilter);
    }

    if (normalizedSearch) {
      rows = rows.filter((item) =>
        objectMatchesSearch(
          {
            ...item,
            lineaTematicaLabel: getLineaTematicaLabel(item.lineaTematica),
            evaluadoresLabel: getEvaluadoresLabel(item),
          },
          normalizedSearch,
        ),
      );
    }

    return rows;
  }, [data?.ponentes, normalizedSearch, lineaFilter]);

  const filteredEvaluadores = React.useMemo(
    () => (data?.evaluadores ?? []).filter((item) => objectMatchesSearch(item, normalizedSearch)),
    [data?.evaluadores, normalizedSearch],
  );

  const filteredAsistentes = React.useMemo(
    () => (data?.asistentes ?? []).filter((item) => objectMatchesSearch(item, normalizedSearch)),
    [data?.asistentes, normalizedSearch],
  );

  const totals = {
    ponentes: data?.ponentes?.length ?? 0,
    evaluadores: data?.evaluadores?.length ?? 0,
    asistentes: data?.asistentes?.length ?? 0,
  };

  const filteredCount =
    activeTab === "ponentes"
      ? filteredPonentes.length
      : activeTab === "evaluadores"
      ? filteredEvaluadores.length
      : filteredAsistentes.length;

  return (
    <section id="visualizacion-registros" className="mt-14">
      <div
        className="rounded-[28px] border p-5 md:p-7"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,248,252,0.95))",
          borderColor: "var(--congreso-border)",
          boxShadow: "0 20px 55px rgba(0,0,0,0.07)",
        }}
      >
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--congreso-primary)" }}
            >
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
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.96)",
                border: "1px solid var(--congreso-border)",
                color: "var(--congreso-text)",
              }}
            >
              Panel
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={!data || exporting}
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: exporting
                  ? "linear-gradient(135deg, #7a7a7a, #5d5d5d)"
                  : "linear-gradient(135deg, #1f8f55, #12703f)",
                boxShadow: exporting
                  ? "none"
                  : "0 14px 28px rgba(18,112,63,0.24)",
              }}
            >
              <span className="mr-2">📊</span>
              {exporting ? "Generando Excel..." : "Descargar Excel"}
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-4">
          <Tabs current={activeTab} onChange={setActiveTab} totals={totals} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <SearchBox value={search} onChange={setSearch} />
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
            {canViewEvaluadores ? <Chip>Panel habilitado</Chip> : null}
          </div>
        ) : null}

        {loading ? (
          <LoaderCard />
        ) : !data ? (
          <EmptyState message="No fue posible obtener la información." />
        ) : activeTab === "ponentes" ? (
          filteredPonentes.length ? (
            <PonentesTable
              rows={filteredPonentes}
              duplicateDocs={duplicatePonenteDocs}
              duplicateNames={duplicatePonenteNames}
              duplicateTitles={duplicatePonenciaTitles}
              canViewEvaluadores={canViewEvaluadores}
            />
          ) : (
            <EmptyState message="No se encontraron ponencias con ese criterio de búsqueda o eje temático." />
          )
        ) : activeTab === "evaluadores" ? (
          !canViewEvaluadores ? (
            <EmptyState message="Debes ingresar el código en el panel para visualizar los evaluadores." />
          ) : filteredEvaluadores.length ? (
            <EvaluadoresTable
              rows={filteredEvaluadores}
              duplicateDocs={duplicateEvaluadorDocs}
              duplicateNames={duplicateEvaluadorNames}
            />
          ) : (
            <EmptyState message="No se encontraron evaluadores con ese criterio de búsqueda." />
          )
        ) : filteredAsistentes.length ? (
          <AsistentesTable
            rows={filteredAsistentes}
            duplicateDocs={duplicateAsistenteDocs}
            duplicateNames={duplicateAsistenteNames}
          />
        ) : (
          <EmptyState message="No se encontraron asistentes con ese criterio de búsqueda." />
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
      />
    </section>
  );
}