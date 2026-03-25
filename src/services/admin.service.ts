import type { AdminRegistrosResponse } from "@/src/types/admin";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function getBaseUrl() {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL no está definida.");
  }

  return BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
}

export async function getAdminRegistros(): Promise<AdminRegistrosResponse> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/administracion/registros`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo obtener la información administrativa.");
  }

  return res.json();
}

export async function asignarEvaluadoresAutomaticamente(cantidadEvaluadoresPorPonente = 2) {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/administracion/asignaciones/automaticas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cantidadEvaluadoresPorPonente }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "No se pudo realizar la asignación automática.");
  }

  return data;
}