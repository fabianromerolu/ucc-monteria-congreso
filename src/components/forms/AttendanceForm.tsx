"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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

function toUpperInput(value: string) {
  return value.toLocaleUpperCase("es-CO");
}

function AttendanceConfigLoader({ roleLabel }: { roleLabel: string }) {
  return (
    <section className="grid gap-4 form-shell">
      <div
        className="overflow-hidden rounded-2xl border p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(250,247,255,0.92))",
          borderColor: "var(--congreso-border)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
            style={{ background: "var(--congreso-primary)" }}
            aria-hidden
          >
            <Loader2 className="animate-spin" size={24} />
          </div>
          <div>
            <p className="font-semibold">Preparando formulario de asistencia</p>
            <p className="mt-1 text-sm opacity-75">
              Estamos validando si el registro para {roleLabel.toLowerCase()}s
              se encuentra habilitado.
            </p>
          </div>
        </div>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full"
          style={{ background: "rgba(119,7,172,0.10)" }}
        >
          <div
            className="h-full w-2/3 animate-pulse rounded-full"
            style={{ background: "linear-gradient(90deg, #7707ac, #1f8f55)" }}
          />
        </div>
      </div>
    </section>
  );
}

export default function AttendanceForm({ role, initialSource }: Props) {
  const meta = ATTENDANCE_ROLE_META[role];
  const source: AttendanceSource = isAttendanceSource(initialSource)
    ? initialSource
    : "direct";

  const [enabled, setEnabled] = React.useState(false);
  const [loadingConfig, setLoadingConfig] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [nombres, setNombres] = React.useState("");
  const [apellidos, setApellidos] = React.useState("");
  const [tipoDocumento, setTipoDocumento] = React.useState<TipoDocumento>("CC");
  const [documento, setDocumento] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [institucion, setInstitucion] = React.useState("");
  const [ciudad, setCiudad] = React.useState("");
  const [semillero, setSemillero] = React.useState("");

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
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo verificar si las asistencias estan habilitadas.";
        setFormError(message);
        toast.error(message);

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
      setFormError(null);
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
        semillero,
        source,
      });

      setSubmitted(true);
      toast.success("Asistencia registrada correctamente.");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la asistencia.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingConfig) {
    return <AttendanceConfigLoader roleLabel={meta.label} />;
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

        {formError ? (
          <div
            role="alert"
            className="rounded-2xl border p-4 text-sm"
            style={{
              background: "rgba(180,35,24,0.08)",
              borderColor: "rgba(180,35,24,0.22)",
              color: "#8a1f16",
            }}
          >
            <p className="font-semibold">Detalle del problema</p>
            <p className="mt-1 opacity-85">{formError}</p>
          </div>
        ) : null}

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
            Esta asistencia es importante para la generacion del certificado.
            Unos dias despues del evento podras descargarlo desde la pagina del
            congreso.
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

      {formError ? (
        <div
          role="alert"
          className="rounded-2xl border p-4 text-sm"
          style={{
            background: "rgba(180,35,24,0.08)",
            borderColor: "rgba(180,35,24,0.22)",
            color: "#8a1f16",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">No se pudo registrar la asistencia</p>
              <p className="mt-1 opacity-85">{formError}</p>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="rounded-lg px-2 py-1 text-xs font-semibold"
              style={{ background: "rgba(180,35,24,0.10)" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nombres"
          value={nombres}
          onChange={(value) => setNombres(toUpperInput(value))}
          required
        />
        <Field
          label="Apellidos"
          value={apellidos}
          onChange={(value) => setApellidos(toUpperInput(value))}
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
          onChange={(value) => setDocumento(toUpperInput(value))}
          required
        />
        <Field
          label="Correo electronico"
          value={email}
          onChange={(value) => setEmail(toUpperInput(value))}
          type="email"
          required
        />
        <Field
          label="Telefono"
          value={telefono}
          onChange={(value) => setTelefono(toUpperInput(value))}
          required
        />
        <Field
          label="Institucion o universidad"
          value={institucion}
          onChange={(value) => setInstitucion(toUpperInput(value))}
          required
        />
        <Field
          label="Ciudad"
          value={ciudad}
          onChange={(value) => setCiudad(toUpperInput(value))}
          required
        />
        {role === "ponente" ? (
          <Field
            label="Semillero"
            value={semillero}
            onChange={(value) => setSemillero(toUpperInput(value))}
          />
        ) : null}
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
