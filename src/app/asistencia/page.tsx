import AttendanceForm from "@/src/components/forms/AttendanceForm";

type PageProps = {
  searchParams: Promise<{ source?: string }>;
};

export default async function AttendancePage({ searchParams }: PageProps) {
  const { source } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Registro de asistencia</h1>
      <p className="mt-1 text-sm opacity-80">
        Selecciona tu rol y diligencia tus datos para registrar la asistencia al evento.
      </p>

      <div
        className="mt-6 rounded-2xl border p-6 shadow-sm"
        style={{
          background: "var(--congreso-surface)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <AttendanceForm initialSource={source} />
      </div>
    </main>
  );
}
