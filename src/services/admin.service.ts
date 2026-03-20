import type { AdminRegistrosResponse } from "@/src/types/admin";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getAdminRegistros(): Promise<AdminRegistrosResponse> {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL no está definida.");
  }

  const res = await fetch(`${BACKEND_URL}/administracion/registros`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo obtener la información administrativa.");
  }

  return res.json();
}