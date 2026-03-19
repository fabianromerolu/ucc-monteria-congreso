import Link from "next/link";

const EVENTO_HREF = "/evento";

export default function RegisterCards() {
  return (
    <section id="inscripciones" className="mt-10">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Inscripciones</h2>
        <p className="mx-auto mt-1 max-w-2xl text-sm opacity-80">
          El proceso de inscripción ya finalizó.
        </p>
      </div>

      <div
        className="rounded-2xl border p-6 text-center shadow-sm"
        style={{
          background: "var(--congreso-surface)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <h3 className="text-xl font-semibold">Las inscripciones ya cerraron</h3>
      </div>
    </section>
  );
}