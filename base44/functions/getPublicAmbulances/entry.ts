import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const equipos = await base44.asServiceRole.entities.Equipo.filter({ tipo: "ambulancia" });

    const result = equipos.map(e => ({
      id: e.id,
      marca: e.marca,
      modelo: e.modelo,
      patente: e.patente || "",
      centro_principal: e.centro_principal,
      subsede: e.subsede || ""
    }));

    return Response.json({ equipos: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});