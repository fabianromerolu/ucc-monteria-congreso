"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, SubmitButton } from "./_fields";
import type { EvaluadorRegistration, TipoDocumento } from "@/src/types/registrations";
import { registerEvaluador } from "@/src/services/registration.service";

const LS_KEY = "congreso:evaluador:draft";

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

  React.useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as EvaluadorRegistration;
      setForm({
        ...initial,
        ...parsed,
        tipoDocumento: (parsed.tipoDocumento ?? "CC") as TipoDocumento,
        esDocente: (parsed.esDocente ?? "no") as "si" | "no",
      });
    } catch {}
  }, []);

  React.useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  function set<K extends keyof EvaluadorRegistration>(key: K, value: EvaluadorRegistration[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // si NO es docente, no mandes programaDocencia
      const payload: EvaluadorRegistration = {
        ...form,
        programaDocencia: form.esDocente === "si" ? (form.programaDocencia ?? "") : undefined,
      };

      if (form.esDocente === "si" && !payload.programaDocencia?.trim()) {
        toast.error("Si eres docente, indica el programa en el que dictas.");
        setLoading(false);
        return;
      }

      await registerEvaluador(payload);

      toast.success("Registro enviado.");
      localStorage.removeItem(LS_KEY);
      setForm(initial);
    } catch {
      toast.error("No se pudo enviar. El borrador queda guardado.");
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
        <Field label="Filiación institucional" value={form.institucion} onChange={(v) => set("institucion", v)} required />
        <Field label="Universidad" value={form.universidad} onChange={(v) => set("universidad", v)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Programa" value={form.programa} onChange={(v) => set("programa", v)} required />
        <Field label="Semestre" value={form.semestre} onChange={(v) => set("semestre", v)} required />
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
          label="Programa en el que dicta"
          value={form.programaDocencia ?? ""}
          onChange={(v) => set("programaDocencia", v)}
          required
        />
      ) : null}

      <div className="pt-1">
        <SubmitButton loading={loading}>Enviar registro</SubmitButton>
      </div>

      <p className="text-xs opacity-75">Nota: se guarda automáticamente como borrador en tu navegador.</p>
    </form>
  );
}
