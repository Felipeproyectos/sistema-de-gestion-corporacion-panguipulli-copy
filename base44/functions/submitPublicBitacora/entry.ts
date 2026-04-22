import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { equipo_id, conductor, fecha, km_inicial, valor_km, observaciones } = body;

    if (!equipo_id || !conductor || !fecha || km_inicial === undefined) {
      return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    await base44.asServiceRole.entities.Kilometraje.create({
      equipo_id,
      conductor,
      fecha,
      km_inicial: Number(km_inicial),
      valor_km: Number(valor_km || km_inicial),
      observaciones: observaciones || ""
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});