"use client";

import * as React from "react";
import toast from "react-hot-toast";

import { Field, SelectField, SubmitButton, Divider } from "./_fields";
import type { AsistenteRegistration, RolAsistente, TipoDocumento } from "@/src/types/registrations";
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
  rol: "publico",
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
        rol: (parsed.rol ?? "publico") as RolAsistente,
      });
    } catch {}
  }, []);

  React.useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  function set<K extends keyof AsistenteRegistration>(key: K, value: AsistenteRegistration[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const showAcademico = form.rol === "estudiante" || form.rol === "docente";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (showAcademico) {
        if (!form.universidad?.trim() || !form.programa?.trim()) {
          toast.error("Si eres estudiante/docente, indica universidad y programa.");
          setLoading(false);
          return;
        }
        // semestre solo si es estudiante
        if (form.rol === "estudiante" && !form.semestre?.trim()) {
          toast.error("Si eres estudiante, indica el semestre.");
          setLoading(false);
          return;
        }
      }

      const payload: AsistenteRegistration = {
        ...form,
        universidad: showAcademico ? form.universidad : undefined,
        programa: showAcademico ? form.programa : undefined,
        semestre: form.rol === "estudiante" ? form.semestre : undefined,
      };

      await registerAsistente(payload);

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

      <Divider
        title="Inscripción de asistente"
        desc="Si eres público general, solo te pedimos lo necesario. Si eres estudiante o docente, agrega tu información académica."
      />

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

      <SelectField
        label="¿Cómo participas?"
        value={form.rol}
        onChange={(v) => set("rol", v)}
        required
        options={[
          { value: "publico", label: "Público general" },
          { value: "estudiante", label: "Estudiante" },
          { value: "docente", label: "Docente" },
        ]}
      />

      <Divider title="Información académica (opcional)" desc="Se habilita si seleccionas Estudiante o Docente." />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Universidad"
          value={form.universidad ?? ""}
          onChange={(v) => set("universidad", v)}
          required={showAcademico}
          disabled={!showAcademico}
        />
        <Field
          label="Programa / Carrera"
          value={form.programa ?? ""}
          onChange={(v) => set("programa", v)}
          required={showAcademico}
          disabled={!showAcademico}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Semestre"
          value={form.semestre ?? ""}
          onChange={(v) => set("semestre", v)}
          required={form.rol === "estudiante"}
          disabled={form.rol !== "estudiante"}
          placeholder={form.rol === "estudiante" ? "Ej: 6" : "Solo si eres estudiante"}
        />
        <div />
      </div>

      <div className="pt-1">
        <SubmitButton loading={loading}>Enviar inscripción</SubmitButton>
      </div>

      <p className="text-xs opacity-75">Nota: se guarda automáticamente como borrador en tu navegador.</p>
    </form>
  );
}
