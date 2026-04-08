import { notFound } from "next/navigation";

import AttendanceForm from "@/src/components/forms/AttendanceForm";
import {
  ATTENDANCE_ROLE_META,
  isAttendanceRole,
} from "@/src/types/attendance";

type PageProps = {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ source?: string }>;
};

export default async function AttendanceRolePage({
  params,
  searchParams,
}: PageProps) {
  const { role } = await params;
  const { source } = await searchParams;

  if (!isAttendanceRole(role)) {
    notFound();
  }

  const meta = ATTENDANCE_ROLE_META[role];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Registro de asistencia - {meta.label}</h1>
      <p className="mt-1 text-sm opacity-80">
        Diligencia tu informacion para registrar la asistencia en el evento.
      </p>

      <div
        className="mt-6 rounded-2xl border p-6 shadow-sm"
        style={{
          background: "var(--congreso-surface)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <AttendanceForm role={role} initialSource={source} />
      </div>
    </main>
  );
}
