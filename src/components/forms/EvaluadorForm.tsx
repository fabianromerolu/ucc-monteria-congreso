"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, FileField, SubmitButton } from "./_fields";
import { EvaluadorRegistration } from "@/src/types/registrations";
import { registerEvaluador } from "@/src/services/registration.service";

const LS_KEY = "congreso:evaluador:draft";

type EvaluadorDraft = EvaluadorRegistration & {
  firmaDigitalName?: string;
};

const initial: EvaluadorRegistration = {
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

  profesion: "",
  posgrado: "",
  universidadPosgrado: "",
  esDocente: "no",
  programaDocencia: "",
};

export default function EvaluadorForm() {
  const [form, setForm] = React.useState<EvaluadorRegistration>(initial);
  const [loading, setLoading] = React.useState(false);

  const [firmaDigital, setFirmaDigital] = React.useState<File | undefined>(undefined);

  React.useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as EvaluadorDraft;
      setForm((p) => ({
        ...p,
        ...parsed,
        esDocente: (parsed.esDocente ?? "no") as "si" | "no",
      }));
    } catch {}
  }, []);

  React.useEffect(() => {
    const draft: EvaluadorDraft = {
      ...form,
      firmaDigitalName: firmaDigital?.name,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  }, [form, firmaDigital]);

  function set<K extends keyof EvaluadorRegistration>(key: K, value: EvaluadorRegistration[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!firmaDigital) {
        toast.error("Adjunta tu firma digital en PNG.");
        setLoading(false);
        return;
      }

      await registerEvaluador(form, { firmaDigitalPng: firmaDigital });

      toast.success("Registro enviado (backend en :3001).");
      localStorage.removeItem(LS_KEY);
      setForm(initial);
      setFirmaDigital(undefined);
    } catch {
      toast.error("No se pudo enviar a :3001. El borrador queda guardado.");
    } finally {
      setLoading(false);
    }
  }

  const showDocencia = form.esDocente === "si";

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

      {/* Bloque info */}
      <div className="form-note text-sm">
        <p className="font-semibold">Firma digital del evaluador</p>
        <p className="mt-1 opacity-80">
          Para la validación del proceso, se requiere la firma digital en formato PNG.
        </p>
        <div className="mt-3 text-xs opacity-75">
          {firmaDigital?.name ? <div>Firma cargada: {firmaDigital.name}</div> : null}
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
        <Field label="Profesión" value={form.profesion} onChange={(v) => set("profesion", v)} required />
        <Field label="Especialidad / Maestría" value={form.posgrado} onChange={(v) => set("posgrado", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Universidad del posgrado"
          value={form.universidadPosgrado}
          onChange={(v) => set("universidadPosgrado", v)}
          required
        />
        <SelectField
          label="¿Es docente?"
          value={form.esDocente}
          onChange={(v) => set("esDocente", v)}
          required
          options={[
            { value: "no", label: "No" },
            { value: "si", label: "Sí" },
          ]}
        />
      </div>

      {showDocencia ? (
        <Field
          label="Programa en el que dicta (si aplica)"
          value={form.programaDocencia ?? ""}
          onChange={(v) => set("programaDocencia", v)}
          required
        />
      ) : null}

      <FileField
        label="Firma digital (PNG)"
        accept="image/png"
        required
        onChange={(f) => setFirmaDigital(f)}
        helper="Sube tu firma digital en PNG."
      />

      <div className="pt-1">
        <SubmitButton loading={loading}>Enviar registro</SubmitButton>
      </div>

      <p className="text-xs opacity-75">
        El borrador se guarda automáticamente (el archivo no se guarda en el borrador).
      </p>
    </form>
  );
}
