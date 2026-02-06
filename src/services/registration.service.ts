import axios from "axios";
import type { AsistenteRegistration, EvaluadorRegistration, PonenteRegistration } from "../types/registrations";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
  timeout: 15000,
});

export async function registerAsistente(data: AsistenteRegistration): Promise<void> {
  await api.post("/inscripciones/asistente", data);
}

export async function registerPonente(
  data: PonenteRegistration,
  uploads?: { archivoPonenciaPdf?: File; cesionDerechosPdf?: File }
): Promise<void> {
  const formData = new FormData();

  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    formData.append(k, String(v));
  });

  if (uploads?.archivoPonenciaPdf) formData.append("archivoPonenciaPdf", uploads.archivoPonenciaPdf);
  if (uploads?.cesionDerechosPdf) formData.append("cesionDerechosPdf", uploads.cesionDerechosPdf);

  await api.post("/inscripciones/ponente", formData);
}

// ✅ Evaluador YA NO ES multipart
export async function registerEvaluador(data: EvaluadorRegistration): Promise<void> {
  await api.post("/inscripciones/evaluador", data);
}
