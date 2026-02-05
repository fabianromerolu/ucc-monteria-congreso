// src/app/inscripcion/asistente/page.tsx
import AsistenteForm from "@/src/components/forms/AsistenteForm";


export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Inscripción • Asistente</h1>
      <p className="mt-1 text-sm opacity-80">
        Registre su información para participar como asistente. No requiere carga de documentos.
      </p>


      <div
        className="mt-6 rounded-2xl border p-6 shadow-sm"
        style={{
          background: "var(--congreso-surface)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <AsistenteForm />
      </div>
    </main>
  );
}
