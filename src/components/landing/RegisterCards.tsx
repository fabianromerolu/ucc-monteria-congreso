import { Mic2, ClipboardCheck, Users } from "lucide-react";
import { Card } from "../ui/Card";
import { ButtonLink } from "../ui/ButtonLink";

const items = [
  {
    title: "Ponente",
    desc: "Registra hasta dos ponentes y adjunta los dos documentos requeridos en PDF (ponencia y cesión).",
    href: "/inscripcion/ponente",
    Icon: Mic2,
  },
  {
    title: "Evaluador",
    desc: "Registro profesional para evaluación académica. Si eres docente, podrás indicar tu información de docencia.",
    href: "/inscripcion/evaluador",
    Icon: ClipboardCheck,
  },
  {
    title: "Asistente",
    desc: "Inscripción general. Si eres estudiante o docente podrás agregar tus datos académicos (opcional).",
    href: "/inscripcion/asistente",
    Icon: Users,
  },
];

export default function RegisterCards() {
  return (
    <section id="inscripciones" className="mt-10">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Inscripciones</h2>
        <p className="mx-auto mt-1 max-w-2xl text-sm opacity-80">
          Selecciona tu modalidad de participación y completa el formulario.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ title, desc, href, Icon }) => (
          <Card key={title} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div
                className="rounded-2xl border border-black/10 p-3"
                style={{
                  background: "rgba(31,114,123,.10)",
                  color: "var(--congreso-secondary)",
                }}
              >
                <Icon />
              </div>

              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm opacity-80">{desc}</p>
              </div>
            </div>

            <div className="mt-auto">
              <ButtonLink href={href} className="w-full">
                Continuar
              </ButtonLink>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
