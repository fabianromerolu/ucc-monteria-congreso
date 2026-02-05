import { Mic2, ClipboardCheck, Users } from "lucide-react";
import { Card } from "../ui/Card";
import { ButtonLink } from "../ui/ButtonLink";

const items = [
  {
    title: "Ponente",
    desc: "Diligencia tus datos y adjunta los documentos requeridos.",
    href: "/inscripcion/ponente",
    Icon: Mic2,
  },
  {
    title: "Evaluador",
    desc: "Diligencia tus datos y adjunta tu firma digital (PNG).",
    href: "/inscripcion/evaluador",
    Icon: ClipboardCheck,
  },
  {
    title: "Asistente",
    desc: "Diligencia tus datos para confirmar tu participación.",
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
          Selecciona la modalidad de participación y completa el formulario correspondiente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ title, desc, href, Icon }) => (
          <Card key={title} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  background: "rgba(31,114,123,.12)",
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
