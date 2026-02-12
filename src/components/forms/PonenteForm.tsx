"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, Textarea, FileField, SubmitButton, Divider, Toggle } from "./_fields";
import type { LineaTematica, PonenteRegistration, TipoDocumento } from "@/src/types/registrations";
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

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function trimToMaxWords(text: string, max: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ");
}

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

export default function PonenteForm() {
  const [form, setForm] = React.useState<PonenteRegistration>(initial);
  const [loading, setLoading] = React.useState(false);

  const [ponenciaPdf, setPonenciaPdf] = React.useState<File | undefined>(undefined);
  const [cesionPdf, setCesionPdf] = React.useState<File | undefined>(undefined);

  const [usePonente2, setUsePonente2] = React.useState(false);
  const [useAcademico, setUseAcademico] = React.useState(false);

  React.useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PonenteDraft;
      setForm((p) => ({
        ...p,
        ...parsed,
        lineaTematica: (parsed.lineaTematica ?? "1") as LineaTematica,
        tipoDocumento: (parsed.tipoDocumento ?? "CC") as TipoDocumento,
        tipoDocumento2: (parsed.tipoDocumento2 ?? "CC") as TipoDocumento,
      }));
      setUsePonente2(Boolean(parsed.usePonente2));
      setUseAcademico(Boolean(parsed.useAcademico));
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

  function set<K extends keyof PonenteRegistration>(key: K, value: PonenteRegistration[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleResumenChange(value: string) {
    const trimmed = trimToMaxWords(value, MAX_RESUMEN_WORDS);
    set("resumen", trimmed);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (countWords(form.resumen) > MAX_RESUMEN_WORDS) {
        toast.error(`El resumen no puede superar ${MAX_RESUMEN_WORDS} palabras.`);
        setLoading(false);
        return;
      }

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
        toast.error("Si activas Ponente 2, completa todos los campos.");
        setLoading(false);
        return;
      }

      if (useAcademico) {
        if (!form.universidad?.trim() || !form.programa?.trim()) {
          toast.error("Si activas datos académicos, indica universidad y programa.");
          setLoading(false);
          return;
        }
      }

      const payload: PonenteRegistration = {
        ...form,

        nombres2: usePonente2 && form.nombres2?.trim() ? form.nombres2 : undefined,
        apellidos2: usePonente2 && form.apellidos2?.trim() ? form.apellidos2 : undefined,
        tipoDocumento2: usePonente2 ? form.tipoDocumento2 : undefined,
        documento2: usePonente2 && form.documento2?.trim() ? form.documento2 : undefined,
        email2: usePonente2 && form.email2?.trim() ? form.email2 : undefined,
        telefono2: usePonente2 && form.telefono2?.trim() ? form.telefono2 : undefined,

        universidad: useAcademico && form.universidad?.trim() ? form.universidad : undefined,
        programa: useAcademico && form.programa?.trim() ? form.programa : undefined,
        semestre: useAcademico && form.semestre?.trim() ? form.semestre : undefined,

        grupoInvestigacion: form.grupoInvestigacion?.trim() ? form.grupoInvestigacion : undefined,
        semillero: form.semillero?.trim() ? form.semillero : undefined,
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
    } catch {
      toast.error("No se pudo enviar. El borrador queda guardado.");
    } finally {
      setLoading(false);
    }
  }

  const resumenWordCount = countWords(form.resumen);

  return (
    <form className="grid gap-4 form-shell" onSubmit={onSubmit}>
      
      {/* ... todo tu formulario sin cambios arriba ... */}

      <Divider title="Ponencia" />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Eje temático"
          value={form.lineaTematica}
          onChange={(v) => set("lineaTematica", v as LineaTematica)}
          required
          options={[
            { value: "1" as LineaTematica, label: "Derecho público y privado" },
            { value: "2" as LineaTematica, label: "Derecho internacional: soberanía y Estado" },
            { value: "3" as LineaTematica, label: "Ética jurídica · Métodos de resolución de conflictos · Filosofía del Derecho" },
            { value: "4" as LineaTematica, label: "Legal Tech · Educación · IA" },
            { value: "5" as LineaTematica, label: "Derechos humanos · Género · Cultura de paz · Medio ambiente" },
            { value: "6" as LineaTematica, label: "Derecho y sociedad · Emprendimiento y empresa" },
          ]}
        />
        <Field label="Título de la ponencia" value={form.tituloPonencia} onChange={(v) => set("tituloPonencia", v)} required />
      </div>

      <div>
        <Textarea
          label="Resumen"
          value={form.resumen}
          onChange={handleResumenChange}
          placeholder="Resumen breve de la propuesta..."
          required
        />
        <div className="text-xs mt-1 text-right opacity-75">
          {resumenWordCount} / {MAX_RESUMEN_WORDS} palabras
        </div>
      </div>

      <FileField label="Ponencia (PDF)" accept="application/pdf" required onChange={(f) => setPonenciaPdf(f)} helper="Sube la ponencia en PDF." />
      <FileField label="Cesión de derechos (PDF)" accept="application/pdf" required onChange={(f) => setCesionPdf(f)} helper="Sube la cesión de derechos firmada en PDF." />

      <div className="pt-1">
        <SubmitButton loading={loading}>Enviar registro</SubmitButton>
      </div>

      <p className="text-xs opacity-75">
        El borrador se guarda automáticamente (los archivos no se guardan en el borrador).
      </p>
    </form>
  );
    }
                        
