// src/services/registration.service.ts
import axios from "axios";
import type {
  AsistenteRegistration,
  EvaluadorRegistration,
  PonenteRegistration,
} from "../types/registrations";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
  timeout: 15000,
});

/**
 * Deja fuera:
 * - undefined / null
 * - strings vacíos o solo espacios
 *
 * Nota: mantiene el tipo (Partial<T>) porque realmente estás removiendo keys.
 */
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};

  (Object.keys(obj) as Array<keyof T>).forEach((k) => {
    const v = obj[k];

    if (v === undefined || v === null) return;

    if (typeof v === "string" && v.trim() === "") return;

    out[k] = v;
  });

  return out;
}

export async function registerAsistente(
  data: AsistenteRegistration,
): Promise<void> {
  // rol es solo UX, no lo mandamos al back
  const { rol, ...rest } = data;

  await api.post("/inscripciones/asistente", clean(rest));
}

export async function registerPonente(
  data: PonenteRegistration,
  uploads?: { archivoPonenciaPdf?: File; cesionDerechosPdf?: File },
): Promise<void> {
  const formData = new FormData();
  const payload = clean(data);

  (Object.keys(payload) as Array<keyof typeof payload>).forEach((k) => {
    const v = payload[k];
    if (v === undefined || v === null) return;
    formData.append(String(k), String(v));
  });

  if (uploads?.archivoPonenciaPdf) {
    formData.append("archivoPonenciaPdf", uploads.archivoPonenciaPdf);
  }
  if (uploads?.cesionDerechosPdf) {
    formData.append("cesionDerechosPdf", uploads.cesionDerechosPdf);
  }

  await api.post("/inscripciones/ponente", formData);
}

// ✅ Evaluador YA NO ES multipart
export async function registerEvaluador(
  data: EvaluadorRegistration,
): Promise<void> {
  await api.post("/inscripciones/evaluador", clean(data));
}
