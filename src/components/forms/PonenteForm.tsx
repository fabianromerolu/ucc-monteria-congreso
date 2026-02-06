"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, Textarea, FileField, SubmitButton } from "./_fields";
import type { LineaTematica, PonenteRegistration, TipoDocumento } from "@/src/types/registrations";
import { registerPonente } from "@/src/services/registration.service";

const LS_KEY = "congreso:ponente:draft";

type PonenteDraft = PonenteRegistration & {
  ponenciaPdfName?: string;
  cesionPdfName?: string;
};

const initial: PonenteRegistration = {
  // Ponente 1
  nombres: "",
  apellidos: "",
  tipoDocumento: "CC",
  documento: "",
  email: "",
  telefono: "",

  // Ponente 2 (opcional)
  nombres2: "",
  apellidos2: "",
  tipoDocumento2: "CC",
  documento2: "",
  email2: "",
  telefono2: "",

  pais: "",
  ciudad: "",

  institucion: "",
  universidad: "",

  programa: "",
  semestre: "",

  grupoInvestigacion: "",
  semillero: "",

  tituloPonencia: "",
  resumen: "",
  lineaTematica: "1",
};

function isPonente2Used(f: PonenteRegistration) {
  return Boolean(
    (f.nombres2 && f.nombres2.trim()) ||
      (f.apellidos2 && f.apellidos2.trim()) ||
      (f.documento2 && f.documento2.trim()) ||
      (f.email2 && f.email2.trim()) ||
      (f.telefono2 && f.telefono2.trim())
  );
}

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
        tipoDocumento: (parsed.tipoDocumento ?? "CC") as TipoDocumento,
        tipoDocumento2: (parsed.tipoDocumento2 ?? "CC") as TipoDocumento,
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

      // Si el ponente 2 se usa, exigimos que esté completo.
      if (isPonente2Used(form)) {
        const required2: Array<keyof PonenteRegistration> = [
          "nombres2",
          "apellidos2",
          "tipoDocumento2",
          "documento2",
          "email2",
          "telefono2",
        ];
        const missing = required2.filter((k) => {
          const v = form[k];
          return v === undefined || v === null || String(v).trim() === "";
        });

        if (missing.length) {
          toast.error("Si agregas Ponente 2, completa todos sus campos.");
          setLoading(false);
          return;
        }
      }

      await registerPonente(
        {
          ...form,
          // limpia strings vacíos opcionales para que no “ensucien”
          nombres2: form.nombres2?.trim() ? form.nombres2 : undefined,
          apellidos2: form.apellidos2?.trim() ? form.apellidos2 : undefined,
          documento2: form.documento2?.trim() ? form.documento2 : undefined,
          email2: form.email2?.trim() ? form.email2 : undefined,
          telefono2: form.telefono2?.trim() ? form.telefono2 : undefined,
          grupoInvestigacion: form.grupoInvestigacion?.trim() ? form.grupoInvestigacion : undefined,
          semillero: form.semillero?.trim() ? form.semillero : undefined,
        },
        { archivoPonenciaPdf: ponenciaPdf, cesionDerechosPdf: cesionPdf }
      );

      toast.success("Registro enviado.");
      localStorage.removeItem(LS_KEY);
      setForm(initial);
      setPonenciaPdf(undefined);
      setCesionPdf(undefined);
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

        <span className="text-xs opacity-75">Campos marcados con * son obligatorios.</span>
      </div>

      <div className="form-note text-sm">
        <p className="font-semibold">Documentos para ponentes</p>
        <p className="mt-1 opacity-80">Descarga los formatos en Word, diligéncialos y súbelos en PDF.</p>

        <div className="mt-3 grid gap-2">
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

        <div className="mt-3 text-xs opacity-75">
          {ponenciaPdf?.name ? <div>Ponencia PDF cargada: {ponenciaPdf.name}</div> : null}
          {cesionPdf?.name ? <div>Cesión PDF cargada: {cesionPdf.name}</div> : null}
        </div>
      </div>

      <div className="form-note text-sm">
        <p className="font-semibold">Ponente 1 (obligatorio)</p>
        <p className="mt-1 opacity-80">Información principal del ponente.</p>
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

      <div className="form-note text-sm">
        <p className="font-semibold">Ponente 2 (opcional)</p>
        <p className="mt-1 opacity-80">Si lo agregas, completa todos los campos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombres (Ponente 2)" value={form.nombres2 ?? ""} onChange={(v) => set("nombres2", v)} />
        <Field label="Apellidos (Ponente 2)" value={form.apellidos2 ?? ""} onChange={(v) => set("apellidos2", v)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Tipo de documento (Ponente 2)"
          value={(form.tipoDocumento2 ?? "CC") as TipoDocumento}
          onChange={(v) => set("tipoDocumento2", v)}
          options={[
            { value: "CC", label: "CC" },
            { value: "TI", label: "TI" },
            { value: "CE", label: "CE" },
            { value: "PAS", label: "Pasaporte" },
          ]}
        />
        <Field label="Documento (Ponente 2)" value={form.documento2 ?? ""} onChange={(v) => set("documento2", v)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Correo (Ponente 2)" type="email" value={form.email2 ?? ""} onChange={(v) => set("email2", v)} />
        <Field label="Teléfono (Ponente 2)" value={form.telefono2 ?? ""} onChange={(v) => set("telefono2", v)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="País" value={form.pais} onChange={(v) => set("pais", v)} required />
        <Field label="Ciudad" value={form.ciudad} onChange={(v) => set("ciudad", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Filiación institucional" value={form.institucion} onChange={(v) => set("institucion", v)} required />
        <Field label="Universidad" value={form.universidad} onChange={(v) => set("universidad", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Programa / Carrera" value={form.programa} onChange={(v) => set("programa", v)} required />
        <Field label="Semestre" value={form.semestre} onChange={(v) => set("semestre", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Grupo de investigación (opcional)"
          value={form.grupoInvestigacion ?? ""}
          onChange={(v) => set("grupoInvestigacion", v)}
        />
        <Field
          label="Semillero (opcional)"
          value={form.semillero ?? ""}
          onChange={(v) => set("semillero", v)}
        />
      </div>

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

      <div className="pt-1">
        <SubmitButton loading={loading}>Enviar registro</SubmitButton>
      </div>

      <p className="text-xs opacity-75">El borrador se guarda automáticamente (los archivos no se guardan en el borrador).</p>
    </form>
  );
}
