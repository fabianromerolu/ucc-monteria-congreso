"use client";

import * as React from "react";
import toast from "react-hot-toast";

import {
  Field,
  SelectField,
  Textarea,
  FileField,
  SubmitButton,
  Divider,
  Toggle,
} from "./_fields";
import type {
  LineaTematica,
  PonenteRegistration,
  TipoDocumento,
} from "@/src/types/registrations";
import { registerPonente } from "@/src/services/registration.service";

const LS_KEY = "congreso:ponente:draft";
const MAX_RESUMEN_WORDS = 250;

type PonenteDraft = PonenteRegistration & {
  ponenciaPdfName?: string;
  cesionPdfName?: string;
  usePonente2?: boolean;
  useAcademico?: boolean;
};

const initial: PonenteRegistration = {
  nombres: "",
  apellidos: "",
  tipoDocumento: "CC",
  documento: "",
  email: "",
  telefono: "",

  nombres2: "",
  apellidos2: "",
  tipoDocumento2: "CC",
  documento2: "",
  email2: "",
  telefono2: "",

  pais: "",
  ciudad: "",

  universidad: "",
  programa: "",
  semestre: "",

  grupoInvestigacion: "",
  semillero: "",

  tituloPonencia: "",
  resumen: "",
  lineaTematica: "1",
};

function isPonente2Complete(f: PonenteRegistration) {
  const required2: Array<keyof PonenteRegistration> = [
    "nombres2",
    "apellidos2",
    "tipoDocumento2",
    "documento2",
    "email2",
    "telefono2",
  ];
  return required2.every((k) => {
    const v = f[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function enforceMaxWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

export default function PonenteForm() {
  const [form, setForm] = React.useState<PonenteRegistration>(initial);
  const [loading, setLoading] = React.useState(false);

  const [ponenciaPdf, setPonenciaPdf] = React.useState<File | undefined>(
    undefined
  );
  const [cesionPdf, setCesionPdf] = React.useState<File | undefined>(undefined);

  const [usePonente2, setUsePonente2] = React.useState(false);
  const [useAcademico, setUseAcademico] = React.useState(false);

  const [resumenWords, setResumenWords] = React.useState(0);

  React.useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PonenteDraft;

      const resumenSafe = enforceMaxWords(parsed.resumen ?? "", MAX_RESUMEN_WORDS);

      setForm((p) => ({
        ...p,
        ...parsed,
        resumen: resumenSafe,
        lineaTematica: (parsed.lineaTematica ?? "1") as LineaTematica,
        tipoDocumento: (parsed.tipoDocumento ?? "CC") as TipoDocumento,
        tipoDocumento2: (parsed.tipoDocumento2 ?? "CC") as TipoDocumento,
      }));

      setUsePonente2(Boolean(parsed.usePonente2));
      setUseAcademico(Boolean(parsed.useAcademico));
      setResumenWords(countWords(resumenSafe));
    } catch {}
  }, []);

  React.useEffect(() => {
    const draft: PonenteDraft = {
      ...form,
      usePonente2,
      useAcademico,
      ponenciaPdfName: ponenciaPdf?.name,
      cesionPdfName: cesionPdf?.name,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  }, [form, ponenciaPdf, cesionPdf, usePonente2, useAcademico]);

  function set<K extends keyof PonenteRegistration>(
    key: K,
    value: PonenteRegistration[K]
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function setResumenLimited(next: string) {
    const trimmed = next ?? "";
    const words = trimmed.trim().split(/\s+/).filter(Boolean);
    const nextWords = words.length;

    if (nextWords <= MAX_RESUMEN_WORDS) {
      set("resumen", trimmed);
      setResumenWords(nextWords);
      return;
    }

    const clamped = words.slice(0, MAX_RESUMEN_WORDS).join(" ");
    set("resumen", clamped);
    setResumenWords(MAX_RESUMEN_WORDS);

    toast.error(`El resumen admite máximo ${MAX_RESUMEN_WORDS} palabras.`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!ponenciaPdf) {
        toast.error("Adjunta la ponencia en PDF.");
        setLoading(false);
        return;
      }
      if (!cesionPdf) {
        toast.error("Adjunta la cesión de derechos en PDF.");
        setLoading(false);
        return;
      }

      if (usePonente2 && !isPonente2Complete(form)) {
        toast.error("Si activas Ponente 2, completa todos sus campos.");
        setLoading(false);
        return;
      }

      if (useAcademico) {
        if (!form.universidad?.trim() || !form.programa?.trim()) {
          toast.error(
            "Si activas datos académicos, indica universidad y programa."
          );
          setLoading(false);
          return;
        }
      }

      const resumenCount = countWords(form.resumen ?? "");
      if (resumenCount > MAX_RESUMEN_WORDS) {
        toast.error(`El resumen admite máximo ${MAX_RESUMEN_WORDS} palabras.`);
        setLoading(false);
        return;
      }

      const payload: PonenteRegistration = {
        ...form,

        // Ponente 2
        nombres2:
          usePonente2 && form.nombres2?.trim() ? form.nombres2 : undefined,
        apellidos2:
          usePonente2 && form.apellidos2?.trim() ? form.apellidos2 : undefined,
        tipoDocumento2: usePonente2 ? form.tipoDocumento2 : undefined,
        documento2:
          usePonente2 && form.documento2?.trim()
            ? form.documento2
            : undefined,
        email2: usePonente2 && form.email2?.trim() ? form.email2 : undefined,
        telefono2:
          usePonente2 && form.telefono2?.trim() ? form.telefono2 : undefined,

        // Académico
        universidad:
          useAcademico && form.universidad?.trim()
            ? form.universidad
            : undefined,
        programa:
          useAcademico && form.programa?.trim() ? form.programa : undefined,
        semestre:
          useAcademico && form.semestre?.trim() ? form.semestre : undefined,

        // Opcionales
        grupoInvestigacion: form.grupoInvestigacion?.trim()
          ? form.grupoInvestigacion
          : undefined,
        semillero: form.semillero?.trim() ? form.semillero : undefined,

        // Resumen asegurado
        resumen: enforceMaxWords(form.resumen ?? "", MAX_RESUMEN_WORDS),
      };

      await registerPonente(payload, {
        archivoPonenciaPdf: ponenciaPdf,
        cesionDerechosPdf: cesionPdf,
      });

      toast.success("Registro enviado.");
      localStorage.removeItem(LS_KEY);
      setForm(initial);
      setPonenciaPdf(undefined);
      setCesionPdf(undefined);
      setUsePonente2(false);
      setUseAcademico(false);
      setResumenWords(0);
    } catch {
      toast.error("No se pudo enviar. El borrador queda guardado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4 form-shell" onSubmit={onSubmit}>
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

        <span className="text-xs opacity-75">
          Campos marcados con * son obligatorios.
        </span>
      </div>

      <Divider
        title="Documentos para ponentes"
        desc="Descarga los formatos, diligéncialos y súbelos en PDF. Los dos PDFs son obligatorios."
      />

      <div className="grid gap-2 text-sm">
        <a
          href="/formatos_forms/form-ponente.doc"
          download
          className="inline-block underline"
          style={{ color: "var(--congreso-primary)" }}
        >
          Descargar formato de ponencia (Word)
        </a>
        <a
          href="/formatos_forms/form-cesion_derechos.docx"
          download
          className="inline-block underline"
          style={{ color: "var(--congreso-primary)" }}
        >
          Descargar cesión de derechos (Word)
        </a>
      </div>

      <div className="text-xs opacity-75">
        {ponenciaPdf?.name ? (
          <div>Ponencia PDF cargada: {ponenciaPdf.name}</div>
        ) : null}
        {cesionPdf?.name ? (
          <div>Cesión PDF cargada: {cesionPdf.name}</div>
        ) : null}
      </div>

      <Divider title="Ponente 1" desc="Información principal del ponente." />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nombres"
          value={form.nombres}
          onChange={(v) => set("nombres", v)}
          required
        />
        <Field
          label="Apellidos"
          value={form.apellidos}
          onChange={(v) => set("apellidos", v)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Tipo de documento"
          value={form.tipoDocumento}
          onChange={(v) => set("tipoDocumento", v)}
          required
          options={[
            { value: "CC", label: "CC" },
            { value: "TI", label: "TI" },
            { value: "CE", label: "CE" },
            { value: "PAS", label: "Pasaporte" },
          ]}
        />
        <Field
          label="Documento"
          value={form.documento}
          onChange={(v) => set("documento", v)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Correo"
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
          required
        />
        <Field
          label="Teléfono"
          value={form.telefono}
          onChange={(v) => set("telefono", v)}
          required
        />
      </div>

      <Toggle
        label="Agregar Ponente 2 (opcional)"
        checked={usePonente2}
        onChange={setUsePonente2}
      />

      {usePonente2 ? (
        <>
          <Divider title="Ponente 2" desc="Si lo activas, completa todos los campos." />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nombres (Ponente 2)"
              value={form.nombres2 ?? ""}
              onChange={(v) => set("nombres2", v)}
              required
            />
            <Field
              label="Apellidos (Ponente 2)"
              value={form.apellidos2 ?? ""}
              onChange={(v) => set("apellidos2", v)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo de documento (Ponente 2)"
              value={(form.tipoDocumento2 ?? "CC") as TipoDocumento}
              onChange={(v) => set("tipoDocumento2", v)}
              required
              options={[
                { value: "CC", label: "CC" },
                { value: "TI", label: "TI" },
                { value: "CE", label: "CE" },
                { value: "PAS", label: "Pasaporte" },
              ]}
            />
            <Field
              label="Documento (Ponente 2)"
              value={form.documento2 ?? ""}
              onChange={(v) => set("documento2", v)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Correo (Ponente 2)"
              type="email"
              value={form.email2 ?? ""}
              onChange={(v) => set("email2", v)}
              required
            />
            <Field
              label="Teléfono (Ponente 2)"
              value={form.telefono2 ?? ""}
              onChange={(v) => set("telefono2", v)}
              required
            />
          </div>
        </>
      ) : null}

      <Divider title="Ubicación" />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="País"
          value={form.pais}
          onChange={(v) => set("pais", v)}
          required
        />
        <Field
          label="Ciudad"
          value={form.ciudad}
          onChange={(v) => set("ciudad", v)}
          required
        />
      </div>

      <Toggle
        label="Agregar información académica (opcional)"
        checked={useAcademico}
        onChange={setUseAcademico}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Universidad"
          value={form.universidad ?? ""}
          onChange={(v) => set("universidad", v)}
          required={useAcademico}
          disabled={!useAcademico}
        />
        <Field
          label="Programa / Carrera"
          value={form.programa ?? ""}
          onChange={(v) => set("programa", v)}
          required={useAcademico}
          disabled={!useAcademico}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Semestre (opcional)"
          value={form.semestre ?? ""}
          onChange={(v) => set("semestre", v)}
          disabled={!useAcademico}
          placeholder={useAcademico ? "Ej: 6" : "Activa datos académicos"}
        />
        <div />
      </div>

      <Divider title="Investigación (opcional)" />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Grupo de investigación"
          value={form.grupoInvestigacion ?? ""}
          onChange={(v) => set("grupoInvestigacion", v)}
        />
        <Field
          label="Semillero"
          value={form.semillero ?? ""}
          onChange={(v) => set("semillero", v)}
        />
      </div>

      <Divider title="Ponencia" />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Eje temático"
          value={form.lineaTematica}
          onChange={(v) => set("lineaTematica", v as LineaTematica)}
          required
          options={[
            { value: "1" as LineaTematica, label: "Derecho público y privado" },
            {
              value: "2" as LineaTematica,
              label: "Derecho internacional: soberanía y Estado",
            },
            {
              value: "3" as LineaTematica,
              label:
                "Ética jurídica · Métodos de resolución de conflictos · Filosofía del Derecho",
            },
            { value: "4" as LineaTematica, label: "Legal Tech · Educación · IA" },
            {
              value: "5" as LineaTematica,
              label:
                "Derechos humanos · Género · Cultura de paz · Medio ambiente",
            },
            {
              value: "6" as LineaTematica,
              label: "Derecho y sociedad · Emprendimiento y empresa",
            },
          ]}
        />
        <Field
          label="Título de la ponencia"
          value={form.tituloPonencia}
          onChange={(v) => set("tituloPonencia", v)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Textarea
          label="Resumen"
          value={form.resumen}
          onChange={(v) => setResumenLimited(v)}
          placeholder="Resumen breve de la propuesta..."
          required
        />
        <div className="flex items-center justify-between text-xs opacity-75">
          <span>
            {resumenWords}/{MAX_RESUMEN_WORDS} palabras
          </span>
          {resumenWords > MAX_RESUMEN_WORDS ? (
            <span style={{ color: "var(--congreso-primary)" }}>
              Máximo {MAX_RESUMEN_WORDS} palabras
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>

      <FileField
        label="Ponencia (PDF)"
        accept="application/pdf"
        required
        onChange={(f) => setPonenciaPdf(f)}
        helper="Sube la ponencia en PDF."
      />
      <FileField
        label="Cesión de derechos (PDF)"
        accept="application/pdf"
        required
        onChange={(f) => setCesionPdf(f)}
        helper="Sube la cesión de derechos firmada en PDF."
      />

      <div className="pt-1">
        <SubmitButton loading={loading}>Enviar registro</SubmitButton>
      </div>

      <p className="text-xs opacity-75">
        El borrador se guarda automáticamente (los archivos no se guardan en el
        borrador).
      </p>
    </form>
  );
    }
        
