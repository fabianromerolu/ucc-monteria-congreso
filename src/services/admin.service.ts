import { getBackendBaseUrl } from "@/src/lib/backend";
import type { AdminRegistrosResponse } from "@/src/types/admin";

export async function getAdminRegistros(): Promise<AdminRegistrosResponse> {
  const baseUrl = getBackendBaseUrl();

  const res = await fetch(`${baseUrl}/administracion/registros`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo obtener la informacion administrativa.");
  }

  return res.json();
}

export async function asignarEvaluadoresAutomaticamente(
  cantidadEvaluadoresPorPonente = 2,
) {
  const baseUrl = getBackendBaseUrl();

  const res = await fetch(`${baseUrl}/administracion/asignaciones/automaticas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cantidadEvaluadoresPorPonente }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "No se pudo realizar la asignacion automatica.");
  }

  return data;
}

export async function asignarEvaluadoresTardias() {
  const baseUrl = getBackendBaseUrl();

  const res = await fetch(`${baseUrl}/administracion/asignaciones/tardias`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "No se pudo realizar la asignacion de ponencias tardias.");
  }

  return data;
}
