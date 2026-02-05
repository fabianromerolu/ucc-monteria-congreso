"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, Textarea, FileField, SubmitButton } from "./_fields";
import { LineaTematica, PonenteRegistration } from "@/src/types/registrations";
import { registerPonente } from "@/src/services/registration.service";

const LS_KEY = "congreso:ponente:draft";

type PonenteDraft = PonenteRegistration & {
  ponenciaPdfName?: string;
  cesionPdfName?: string;
};

const initial: PonenteRegistration = {
  nombres: "",
  apellidos: "",
  tipoDocumento: "CC",
  documento: "",
  email: "",
  telefono: "",

  pais: "",
  ciudad: "",

  institucion: "",
  universidad: "",

  programa: "",
  semestre: "",

  tituloPonencia: "",
  resumen: "",
  lineaTematica: "1",
};

export default function PonenteForm() {
  const [form, setForm] = React.useState<PonenteRegistration>(initial);
  const [loading, setLoading] = React.useState(false);

  const [ponenciaPdf, setPonenciaPdf] = React.useState<File | undefined>(undefined);
  const [cesionPdf, setCesionPdf] = React.useState<File | undefined>(undefined);

  React.useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PonenteDraft;
      setForm((p) => ({
        ...p,
        ...parsed,
        lineaTematica: (parsed.lineaTematica ?? "1") as LineaTematica,
      }));
    } catch {}
  }, []);

  React.useEffect(() => {
    const draft: PonenteDraft = {
      ...form,
      ponenciaPdfName: ponenciaPdf?.name,
      cesionPdfName: cesionPdf?.name,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  }, [form, ponenciaPdf, cesionPdf]);

  function set<K extends keyof PonenteRegistration>(key: K, value: PonenteRegistration[K]) {
    setForm((p) => ({ ...p, [key]: value }));
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

      // ✅ NOMBRES CORRECTOS SEGÚN TU SERVICE:
      // archivoPonenciaPdf + cesionDerechosPdf
      await registerPonente(form, {
        archivoPonenciaPdf: ponenciaPdf,
        cesionDerechosPdf: cesionPdf,
      });

      toast.success("Registro enviado (backend en :3001).");
      localStorage.removeItem(LS_KEY);
      setForm(initial);
      setPonenciaPdf(undefined);
      setCesionPdf(undefined);
    } catch {
      toast.error("No se pudo enviar a :3001. El borrador queda guardado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-black/5"
          style={{ borderColor: "var(--congreso-border)" }}
        >
          ← Regresar
        </button>

        <span className="text-xs opacity-75">Campos marcados con * son obligatorios.</span>
      </div>

      <div
        className="rounded-2xl border p-4 text-sm"
        style={{ background: "rgba(245,230,213,.6)", borderColor: "var(--congreso-border)" }}
      >
        <p className="font-semibold">Documentos para ponentes</p>
        <p className="mt-1 opacity-80">
          Descarga los formatos en Word, diligéncialos y súbelos en PDF.
        </p>

        <div className="mt-3 grid gap-2">
          <a
            href="/formatos_forms/form-ponente.doc"
            download
            className="inline-block underline"
            style={{ color: "var(--congreso-secondary)" }}
          >
            Descargar formato de ponencia (Word)
          </a>
          <a
            href="/formatos_forms/form-cesion_derechos.docx"
            download
            className="inline-block underline"
            style={{ color: "var(--congreso-secondary)" }}
          >
            Descargar cesión de derechos (Word)
          </a>
        </div>

        <div className="mt-3 text-xs opacity-75">
          {ponenciaPdf?.name ? <div>Ponencia PDF cargada: {ponenciaPdf.name}</div> : null}
          {cesionPdf?.name ? <div>Cesión PDF cargada: {cesionPdf.name}</div> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombres" value={form.nombres} onChange={(v) => set("nombres", v)} required />
        <Field label="Apellidos" value={form.apellidos} onChange={(v) => set("apellidos", v)} required />
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
        <Field label="Documento" value={form.documento} onChange={(v) => set("documento", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Correo" type="email" value={form.email} onChange={(v) => set("email", v)} required />
        <Field label="Teléfono" value={form.telefono} onChange={(v) => set("telefono", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="País" value={form.pais} onChange={(v) => set("pais", v)} required />
        <Field label="Ciudad" value={form.ciudad} onChange={(v) => set("ciudad", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Filiación institucional"
          value={form.institucion}
          onChange={(v) => set("institucion", v)}
          required
        />
        <Field label="Universidad" value={form.universidad} onChange={(v) => set("universidad", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Programa / Carrera" value={form.programa} onChange={(v) => set("programa", v)} required />
        <Field label="Semestre" value={form.semestre} onChange={(v) => set("semestre", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Línea temática (provisional)"
          value={form.lineaTematica}
          onChange={(v) => set("lineaTematica", v)}
          required
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
          ]}
        />
        <Field
          label="Título de la ponencia"
          value={form.tituloPonencia}
          onChange={(v) => set("tituloPonencia", v)}
          required
        />
      </div>

      <Textarea
        label="Resumen"
        value={form.resumen}
        onChange={(v) => set("resumen", v)}
        placeholder="Resumen breve de la propuesta..."
        required
      />

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

      <SubmitButton loading={loading}>Enviar registro</SubmitButton>

      <p className="text-xs opacity-75">
        El borrador se guarda automáticamente (los archivos no se guardan en el borrador).
      </p>
    </form>
  );
}
