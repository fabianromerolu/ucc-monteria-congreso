"use client";

import * as React from "react";
import { Download, FileCheck2, Loader2, Search, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  getAttendanceCertificateDownloadUrl,
  lookupAttendanceCertificate,
} from "@/src/services/attendance.service";
import {
  ATTENDANCE_ROLE_META,
  type AttendanceCertificateFile,
} from "@/src/types/attendance";

type LookupModal = {
  title: string;
  message: string;
  certificates: AttendanceCertificateFile[];
};

function getRoleLabel(role: AttendanceCertificateFile["role"]) {
  return ATTENDANCE_ROLE_META[role]?.label ?? role;
}

export default function CertificateLookupWidget() {
  const [documento, setDocumento] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [modal, setModal] = React.useState<LookupModal | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanDocument = documento.trim();

    if (!cleanDocument) {
      setModal({
        title: "Documento requerido",
        message: "Digite su cedula o documento para consultar el certificado.",
        certificates: [],
      });
      return;
    }

    try {
      setLoading(true);
      const result = await lookupAttendanceCertificate(cleanDocument);

      if (result.status === "generated") {
        setModal({
          title: "Certificado disponible",
          message: result.message,
          certificates: result.certificates,
        });
        return;
      }

      if (result.status === "not_registered") {
        setModal({
          title: "Registro no encontrado",
          message: result.message,
          certificates: [],
        });
        return;
      }

      if (result.status === "error") {
        setModal({
          title: "Certificado con error",
          message: result.message,
          certificates: [],
        });
        return;
      }

      setModal({
        title: "Certificado pendiente",
        message: result.message,
        certificates: [],
      });
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo consultar el certificado.";

      setModal({
        title: "No se pudo consultar",
        message,
        certificates: [],
      });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function downloadCertificate(certificate: AttendanceCertificateFile) {
    const href = getAttendanceCertificateDownloadUrl(certificate.downloadUrl);
    const link = document.createElement("a");
    link.href = href;
    link.download = certificate.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <>
      <aside className="fixed right-3 top-3 z-[95] w-[calc(100vw-1.5rem)] max-w-sm md:right-5 md:top-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white/95 p-3 shadow-2xl backdrop-blur"
          style={{ borderColor: "var(--congreso-border)" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="grid h-8 w-8 place-items-center rounded-xl"
              style={{
                background: "rgba(18,112,63,0.10)",
                color: "#12703f",
              }}
              aria-hidden
            >
              <FileCheck2 size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">Descargar certificado</p>
              <p className="text-xs opacity-70">Consulta por cedula</p>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_42px] gap-2">
            <input
              value={documento}
              onChange={(event) => setDocumento(event.target.value)}
              placeholder="Cedula"
              aria-label="Cedula para consultar certificado"
              className="h-10 rounded-xl border bg-white px-3 text-sm outline-none"
              style={{
                borderColor: "var(--congreso-border)",
                color: "var(--congreso-text)",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="grid h-10 place-items-center rounded-xl text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #12703f, #1f8f55)" }}
              aria-label="Consultar certificado"
              title="Consultar certificado"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            </button>
          </div>
        </form>
      </aside>

      {modal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-2xl"
            style={{ borderColor: "var(--congreso-border)" }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold">{modal.title}</p>
                <p className="mt-1 text-sm opacity-80">{modal.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-black/5"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            {modal.certificates.length ? (
              <div className="grid gap-2">
                {modal.certificates.map((certificate) => (
                  <button
                    key={`${certificate.role}-${certificate.downloadUrl}`}
                    type="button"
                    onClick={() => downloadCertificate(certificate)}
                    className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition hover:bg-black/5"
                    style={{ borderColor: "var(--congreso-border)" }}
                  >
                    <span>
                      <span className="block font-semibold">
                        {getRoleLabel(certificate.role)}
                      </span>
                      <span className="block opacity-70">{certificate.fullName}</span>
                    </span>
                    <Download size={18} aria-hidden />
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--congreso-primary)" }}
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
