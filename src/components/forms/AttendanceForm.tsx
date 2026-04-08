"use client";

import * as React from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { Divider, Field, SelectField, SubmitButton } from "./_fields";
import {
  getAttendancePublicConfig,
  registerAttendance,
} from "@/src/services/attendance.service";
import {
  ATTENDANCE_ROLE_META,
  isAttendanceSource,
  type AttendanceRole,
  type AttendanceSource,
} from "@/src/types/attendance";
import type { TipoDocumento } from "@/src/types/registrations";

const DOCUMENT_OPTIONS: Array<{ value: TipoDocumento; label: string }> = [
  { value: "CC", label: "Cedula de ciudadania" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "CE", label: "Cedula de extranjeria" },
  { value: "PAS", label: "Pasaporte" },
];

type Props = {
  role: AttendanceRole;
  initialSource?: string;
};

export default function AttendanceForm({ role, initialSource }: Props) {
  const meta = ATTENDANCE_ROLE_META[role];
  const source: AttendanceSource = isAttendanceSource(initialSource)
    ? initialSource
    : "direct";

  const [enabled, setEnabled] = React.useState(false);
  const [loadingConfig, setLoadingConfig] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const [nombres, setNombres] = React.useState("");
  const [apellidos, setApellidos] = React.useState("");
  const [tipoDocumento, setTipoDocumento] = React.useState<TipoDocumento>("CC");
  const [documento, setDocumento] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [institucion, setInstitucion] = React.useState("");
  const [ciudad, setCiudad] = React.useState("");

  React.useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      try {
        setLoadingConfig(true);
        const config = await getAttendancePublicConfig();

        if (!mounted) return;
        setEnabled(config.enabled);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo verificar si las asistencias estan habilitadas.");

        if (!mounted) return;
        setEnabled(false);
      } finally {
        if (mounted) {
          setLoadingConfig(false);
        }
      }
    }

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enabled) {
      toast.error("El registro de asistencias no esta habilitado.");
      return;
    }

    try {
      setSubmitting(true);
      await registerAttendance({
        role,
        nombres,
        apellidos,
        tipoDocumento,
        documento,
        email,
        telefono,
        institucion,
        ciudad,
        source,
      });

      setSubmitted(true);
      toast.success("Asistencia registrada correctamente.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la asistencia.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingConfig) {
    return (
      <section className="grid gap-4 form-shell">
        <Divider
          title="Verificando disponibilidad"
          desc="Estamos consultando si el registro de asistencias esta habilitado."
        />
      </section>
    );
  }

  if (!enabled) {
    return (
      <section className="grid gap-4 form-shell">
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
            Volver
          </button>

          <span className="text-xs opacity-75">Asistencias deshabilitadas.</span>
        </div>

        <Divider
          title="Registro de asistencias cerrado"
          desc="Por ahora no es posible diligenciar este formulario."
        />

        <div
          className="rounded-2xl border p-6 text-center"
          style={{
            background: "var(--congreso-surface)",
            borderColor: "var(--congreso-border)",
          }}
        >
          <h2 className="text-2xl font-bold tracking-tight">
            Las asistencias no estan habilitadas
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm opacity-80">
            Cuando el equipo administrativo habilite el registro, este enlace
            volvera a estar disponible para {meta.label.toLowerCase()}s.
          </p>

          <div className="mt-5 flex justify-center">
            <Link
              href="/"
              className="btn rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                borderRadius: "0.5rem",
                background: "var(--congreso-primary)",
                color: "white",
              }}
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="grid gap-4 form-shell">
        <Divider
          title="Asistencia registrada"
          desc="Tu informacion ya fue guardada correctamente para el control del evento."
        />

        <div
          className="rounded-2xl border p-6 text-center"
          style={{
            background: "var(--congreso-surface)",
            borderColor: "var(--congreso-border)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--congreso-primary)" }}
          >
            {meta.label}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Gracias por registrar tu asistencia
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm opacity-80">
            Si tu participacion aplica para certificado, el equipo del evento lo
            enviara posteriormente al correo registrado.
          </p>

          <div className="mt-5 flex justify-center">
            <Link
              href="/"
              className="btn rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{
                borderRadius: "0.5rem",
                background: "var(--congreso-primary)",
                color: "white",
              }}
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 form-shell">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          Volver
        </button>

        <span className="text-xs opacity-75">
          Acceso detectado: {source === "qr" ? "QR" : "boton directo"}
        </span>
      </div>

      <Divider
        title={meta.title}
        desc="Completa los siguientes datos para dejar la asistencia registrada en la base de datos del evento."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nombres"
          value={nombres}
          onChange={setNombres}
          required
        />
        <Field
          label="Apellidos"
          value={apellidos}
          onChange={setApellidos}
          required
        />
        <SelectField
          label="Tipo de documento"
          value={tipoDocumento}
          onChange={setTipoDocumento}
          options={DOCUMENT_OPTIONS}
          required
        />
        <Field
          label="Documento"
          value={documento}
          onChange={setDocumento}
          required
        />
        <Field
          label="Correo electronico"
          value={email}
          onChange={setEmail}
          type="email"
          required
        />
        <Field
          label="Telefono"
          value={telefono}
          onChange={setTelefono}
          required
        />
        <Field
          label="Institucion o universidad"
          value={institucion}
          onChange={setInstitucion}
          required
        />
        <Field
          label="Ciudad"
          value={ciudad}
          onChange={setCiudad}
          required
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm opacity-75">
          Al enviar este formulario quedara registrada una asistencia para el rol de{" "}
          <strong>{meta.label.toLowerCase()}</strong>.
        </p>
        <SubmitButton loading={submitting}>Registrar asistencia</SubmitButton>
      </div>
    </form>
  );
}
