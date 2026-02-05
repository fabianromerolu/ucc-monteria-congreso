export default function Schedule() {
  return (
    <section id="cronograma" className="mt-10">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Cronograma</h2>
        <p className="mx-auto mt-1 max-w-2xl text-sm opacity-80">
          La programación oficial se encuentra en construcción y será publicada por el comité organizador.
        </p>
      </div>

      <div
        className="rounded-2xl border p-6 shadow-sm"
        style={{
          background: "var(--congreso-surface)",
          borderColor: "var(--congreso-border)",
        }}
      >
        <div className="grid gap-4 md:grid-cols-1">
          <Item
            title="Agenda del encuentro"
            desc="Publicación próximamente."
            status="En construcción"
          />
        </div>
      </div>
    </section>
  );
}

function Item({
  title,
  desc,
  status,
}: {
  title: string;
  desc: string;
  status: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-white/60 p-4"
      style={{ borderColor: "var(--congreso-border)" }}
    >
      <div className="text-xs font-semibold uppercase tracking-wide opacity-75">
        {status}
      </div>
      <div className="mt-1 font-semibold">{title}</div>
      <div className="mt-1 text-sm opacity-80">{desc}</div>
    </div>
  );
}
