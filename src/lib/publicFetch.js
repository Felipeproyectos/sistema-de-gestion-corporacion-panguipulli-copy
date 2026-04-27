/**
 * Llama a una función backend sin requerir autenticación de usuario.
 * Usa fetch nativo en lugar del SDK para evitar el bloqueo de la plataforma privada.
 */
const APP_ID = import.meta.env.VITE_BASE44_APP_ID;

export async function invokePublic(functionName, payload = {}) {
  // Intentar con ruta relativa primero (funciona en mismo dominio)
  const res = await fetch(`/api/apps/${APP_ID}/functions/prod/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Id": APP_ID,
    },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Error ${res.status}: respuesta no válida del servidor`);
  }

  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}