"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, SubmitButton } from "./_fields";
import type { AsistenteRegistration, TipoDocumento } from "@/src/types/registrations";
import { registerAsistente } from "@/src/services/registration.service";

const LS_KEY = "congreso:asistente:draft";

const initial: AsistenteRegistration = {
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
};

export default function AsistenteForm() {
  const [form, setForm] = React.useState<AsistenteRegistration>(initial);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AsistenteRegistration;
      setForm({
        ...initial,
        ...parsed,
        tipoDocumento: (parsed.tipoDocumento ?? "CC") as TipoDocumento,
      });
    } catch {}
  }, []);

  React.useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  function set<K extends keyof AsistenteRegistration>(key: K, value: AsistenteRegistration[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await registerAsistente(form);
      toast.success("Inscripción enviada.");
      localStorage.removeItem(LS_KEY);
      setForm(initial);
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
        <Field label="Programa / Carrera" value={form.programa} onChange={(v) => set("programa", v)} required />
        <Field label="Semestre" value={form.semestre} onChange={(v) => set("semestre", v)} required />
      </div>

      <div className="pt-1">
        <SubmitButton loading={loading}>Enviar inscripción</SubmitButton>
      </div>

      <p className="text-xs opacity-75">Nota: se guarda automáticamente como borrador en tu navegador.</p>
    </form>
  );
}
