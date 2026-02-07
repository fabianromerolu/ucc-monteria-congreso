"use client";

import Link from "next/link";

const PHONE = "3112708453";
const WA_LINK = `https://wa.me/57${PHONE}?text=${encodeURIComponent(
  "Hola, tengo problemas con la inscripción. ¿Me pueden ayudar?"
)}`;

// ✅ link directo a la imagen (Wikimedia), NO la página de Wikipedia
const WHATS_ICON =
  "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";

export default function WhatsAppFloating() {
  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      <div className="relative group">
        {/* Tooltip (solo hover/focus) */}
        <div
          className="
            pointer-events-none absolute bottom-[72px] right-0
            w-[260px] rounded-2xl border border-white/25
            bg-white/90 px-4 py-3 text-sm
            shadow-xl backdrop-blur
            opacity-0 translate-y-2 scale-[0.98]
            transition
            group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
            group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100
          "
          style={{ boxShadow: "0 18px 40px rgba(0,0,0,.20)" }}
        >
          <p className="font-semibold" style={{ color: "rgba(17,24,39,.95)" }}>
            ¿Problemas con la inscripción?
          </p>
          <p className="mt-1" style={{ color: "rgba(17,24,39,.75)" }}>
            Escríbenos por WhatsApp y te ayudamos.
          </p>

          {/* punta */}
          <div
            className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 rounded-[4px] bg-white/90"
            style={{
              borderRight: "1px solid rgba(255,255,255,.25)",
              borderBottom: "1px solid rgba(255,255,255,.25)",
              boxShadow: "10px 10px 20px rgba(0,0,0,.08)",
            }}
          />
        </div>

        {/* Botón */}
        <Link
          href={WA_LINK}
          target="_blank"
          rel="noreferrer"
          aria-label="Soporte por WhatsApp"
          className="
            inline-flex h-14 w-14 items-center justify-center
            rounded-full shadow-lg ring-1 ring-black/10
            transition hover:scale-[1.05] active:scale-[0.98]
            focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/40
          "
          style={{ background: "#25D366" }}
        >
          <img
            src={WHATS_ICON}
            alt=""
            className="h-8 w-8 drop-shadow-sm"
            draggable={false}
          />
        </Link>
      </div>
    </div>
  );
}
