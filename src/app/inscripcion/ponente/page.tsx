// src/app/inscripcion/ponente/page.tsx
import PonenteForm from "@/src/components/forms/PonenteForm";


export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Inscripción • Ponente</h1>
      <p className="mt-1 text-sm opacity-80">
        Registre su información y adjunte los documentos requeridos en PDF (ponencia y cesión de derechos).
      </p>

      <div
        className="mt-6 rounded-2xl border p-6 shadow-sm"
        style={{
          background: "var(--congreso-surface)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <PonenteForm />
      </div>
    </main>
  );
}
