"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, SubmitButton } from "./_fields";
import { AsistenteRegistration } from "@/src/types/registrations";
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
      setForm(parsed);
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
      toast.success("Inscripción enviada (backend en :3001).");
      localStorage.removeItem(LS_KEY);
      setForm(initial);
    } catch {
      toast.error("No se pudo enviar a :3001 (normal si el backend aún no existe). Guardado en borrador.");
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

      <SubmitButton loading={loading}>Enviar inscripción</SubmitButton>

      <p className="text-xs opacity-75">
        Nota: se guarda automáticamente como borrador en tu navegador.
      </p>
    </form>
  );
}
