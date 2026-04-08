"use client";

import * as React from "react";
import Link from "next/link";

import {
  ATTENDANCE_ROLES,
  ATTENDANCE_ROLE_META,
  type AttendanceRole,
} from "@/src/types/attendance";

type Props = {
  enabled: boolean;
  loading?: boolean;
};

const QR_API_URL = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=";

function getAttendanceHref(role: AttendanceRole, source: "qr" | "direct") {
  return `/asistencia/${role}?source=${source}`;
}

export default function AttendancePublicSection({ enabled, loading = false }: Props) {
  const [siteOrigin, setSiteOrigin] = React.useState(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "",
  );

  React.useEffect(() => {
    if (siteOrigin || typeof window === "undefined") return;
    setSiteOrigin(window.location.origin.replace(/\/$/, ""));
  }, [siteOrigin]);

  if (loading || !enabled) return null;

  return (
    <section id="asistencias-evento" className="mt-14">
      <div
        className="relative overflow-hidden rounded-[28px] border p-6 md:p-8"
        style={{
          background:
            "linear-gradient(140deg, rgba(119,7,172,0.98), rgba(72,19,132,0.96))",
          borderColor: "rgba(255,255,255,0.16)",
          boxShadow: "0 20px 50px rgba(61, 20, 107, 0.28)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.28), transparent 36%), radial-gradient(circle at 90% 15%, rgba(255,255,255,0.16), transparent 30%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.14), transparent 40%)",
          }}
        />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            Registro de asistencias
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Asistencias habilitadas en la landing
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-white/84 md:text-[15px]">
            Comparte estos QR segun el perfil del participante o usa los botones
            directos para abrir el formulario sin escanear.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {ATTENDANCE_ROLES.map((role) => {
              const meta = ATTENDANCE_ROLE_META[role];
              const relativeQrHref = getAttendanceHref(role, "qr");
              const directHref = getAttendanceHref(role, "direct");
              const qrTarget = siteOrigin
                ? `${siteOrigin}${relativeQrHref}`
                : directHref;
              const qrImageSrc = `${QR_API_URL}${encodeURIComponent(qrTarget)}`;

              return (
                <article
                  key={role}
                  className="rounded-[26px] border p-5"
                  style={{
                    background: "rgba(255,255,255,0.98)",
                    borderColor: "rgba(255,255,255,0.16)",
                    boxShadow: "0 18px 36px rgba(0,0,0,0.16)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.16em]"
                        style={{ color: "var(--congreso-primary)" }}
                      >
                        {meta.label}
                      </p>
                      <h3 className="mt-2 text-xl font-bold" style={{ color: "var(--congreso-text)" }}>
                        {meta.title}
                      </h3>
                    </div>

                    <span
                      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: "rgba(119,7,172,0.08)",
                        color: "var(--congreso-primary)",
                      }}
                    >
                      QR activo
                    </span>
                  </div>

                  <p className="mt-3 min-h-[72px] text-sm opacity-80">
                    {meta.description}
                  </p>

                  <div
                    className="mt-5 grid place-items-center rounded-[22px] border p-4"
                    style={{
                      background: "linear-gradient(180deg, #fff, rgba(247,248,252,0.94))",
                      borderColor: "var(--congreso-border)",
                    }}
                  >
                    <img
                      src={qrImageSrc}
                      alt={`QR de asistencia para ${meta.label.toLowerCase()}`}
                      width={220}
                      height={220}
                      className="h-[220px] w-[220px] rounded-2xl border bg-white object-contain p-3"
                      style={{ borderColor: "rgba(0,0,0,0.08)" }}
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    <Link
                      href={directHref}
                      className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200"
                      style={{
                        background: "linear-gradient(135deg, var(--congreso-primary), #5a3fd6)",
                        boxShadow: "0 14px 28px rgba(75, 52, 173, 0.2)",
                      }}
                    >
                      Ir al formulario
                    </Link>

                    <a
                      href={relativeQrHref}
                      className="inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200"
                      style={{
                        borderColor: "var(--congreso-border)",
                        color: "var(--congreso-text)",
                        background: "rgba(255,255,255,0.76)",
                      }}
                    >
                      Abrir enlace del QR
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
