"use client";

import * as React from "react";
import toast from "react-hot-toast";

import {
  Divider,
  Field,
  FileField,
  SelectField,
  SubmitButton,
  Textarea,
} from "@/src/components/forms/_fields";
import { registerPonente } from "@/src/services/registration.service";
import type {
  LineaTematica,
  PonenteRegistration,
  TipoDocumento,
} from "@/src/types/registrations";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
};

const DOCUMENT_OPTIONS: Array<{ value: TipoDocumento; label: string }> = [
  { value: "CC", label: "Cedula de ciudadania" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "CE", label: "Cedula de extranjeria" },
  { value: "PAS", label: "Pasaporte" },
];

const LINEA_OPTIONS: Array<{ value: LineaTematica; label: string }> = [
  { value: "1", label: "1. Derecho publico y privado" },
  { value: "2", label: "2. Derecho internacional: soberania y Estado" },
  {
    value: "3",
    label: "3. Etica juridica, conflictos y filosofia del Derecho",
  },
  { value: "4", label: "4. Legal Tech, educacion e IA" },
  {
    value: "5",
    label: "5. Derechos humanos, genero, paz y medio ambiente",
  },
  { value: "6", label: "6. Derecho y sociedad, emprendimiento y empresa" },
];

export default function LatePonenciaPanelModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = React.useState(false);

  const [nombres, setNombres] = React.useState("");
  const [apellidos, setApellidos] = React.useState("");
  const [tipoDocumento, setTipoDocumento] = React.useState<TipoDocumento>("CC");
  const [documento, setDocumento] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [pais, setPais] = React.useState("Colombia");
  const [ciudad, setCiudad] = React.useState("");
  const [universidad, setUniversidad] = React.useState("");
  const [programa, setPrograma] = React.useState("");
  const [semestre, setSemestre] = React.useState("");
  const [grupoInvestigacion, setGrupoInvestigacion] = React.useState("");
  const [semillero, setSemillero] = React.useState("");
  const [tituloPonencia, setTituloPonencia] = React.useState("");
  const [resumen, setResumen] = React.useState("");
  const [lineaTematica, setLineaTematica] = React.useState<LineaTematica>("1");
  const [archivoPonenciaPdf, setArchivoPonenciaPdf] = React.useState<File>();
  const [cesionDerechosPdf, setCesionDerechosPdf] = React.useState<File>();

  if (!open) return null;

  function resetForm() {
    setNombres("");
    setApellidos("");
    setTipoDocumento("CC");
    setDocumento("");
    setEmail("");
    setTelefono("");
    setPais("Colombia");
    setCiudad("");
    setUniversidad("");
    setPrograma("");
    setSemestre("");
    setGrupoInvestigacion("");
    setSemillero("");
    setTituloPonencia("");
    setResumen("");
    setLineaTematica("1");
    setArchivoPonenciaPdf(undefined);
    setCesionDerechosPdf(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!archivoPonenciaPdf || !cesionDerechosPdf) {
      toast.error("Debes adjuntar la ponencia en PDF y la cesion de derechos.");
      return;
    }

    const payload: PonenteRegistration = {
      nombres,
      apellidos,
      tipoDocumento,
      documento,
      email,
      telefono,
      pais,
      ciudad,
      universidad,
      programa,
      semestre,
      grupoInvestigacion,
      semillero,
      tituloPonencia,
      resumen,
      lineaTematica,
    };

    try {
      setSubmitting(true);
      await registerPonente(payload, {
        archivoPonenciaPdf,
        cesionDerechosPdf,
      });
      await onSuccess();
      toast.success("Ponencia atrasada registrada correctamente.");
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la ponencia atrasada.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-4">
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border p-6 shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.99)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--congreso-primary)" }}
            >
              Panel administrativo
            </p>
            <h3 className="mt-2 text-2xl font-bold">Registrar ponencia atrasada</h3>
            <p className="mt-2 text-sm opacity-75">
              Este formulario registra solo al ponente principal. Los datos del
              segundo participante se dejaran para extraccion posterior desde los
              documentos adjuntos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-medium"
            style={{
              background: "rgba(0,0,0,0.06)",
              color: "var(--congreso-text)",
            }}
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <Divider
            title="Datos del ponente principal"
            desc="Se enviaran al backend solo los campos del primer ponente y los dos archivos PDF requeridos."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombres" value={nombres} onChange={setNombres} required />
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
            <Field label="Pais" value={pais} onChange={setPais} required />
            <Field label="Ciudad" value={ciudad} onChange={setCiudad} required />
            <Field
              label="Universidad"
              value={universidad}
              onChange={setUniversidad}
            />
            <Field label="Programa" value={programa} onChange={setPrograma} />
            <Field label="Semestre" value={semestre} onChange={setSemestre} />
            <Field
              label="Grupo de investigacion"
              value={grupoInvestigacion}
              onChange={setGrupoInvestigacion}
            />
            <Field label="Semillero" value={semillero} onChange={setSemillero} />
            <SelectField
              label="Linea tematica"
              value={lineaTematica}
              onChange={setLineaTematica}
              options={LINEA_OPTIONS}
              required
            />
          </div>

          <Field
            label="Titulo de la ponencia"
            value={tituloPonencia}
            onChange={setTituloPonencia}
            required
          />

          <Textarea
            label="Resumen"
            value={resumen}
            onChange={setResumen}
            required
            placeholder="Escribe aqui el resumen de la ponencia."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FileField
              label="Ponencia en PDF"
              accept=".pdf,application/pdf"
              onChange={setArchivoPonenciaPdf}
              required
              helper="Adjunta el archivo principal de la ponencia en PDF."
            />
            <FileField
              label="Cesion de derechos en PDF"
              accept=".pdf,application/pdf"
              onChange={setCesionDerechosPdf}
              required
              helper="Adjunta la cesion de derechos firmada en PDF."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm opacity-75">
              El formulario no pedira un segundo ponente; ese complemento se
              tratara despues desde los documentos cargados.
            </p>

            <SubmitButton loading={submitting}>Registrar ponencia atrasada</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
