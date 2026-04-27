import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function obtenerOCrearCarpeta(nombre, parentId, token) {
  const query = `name='${nombre.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const { files } = await res.json();
  if (files && files.length > 0) return files[0].id;
  const crearRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nombre, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  });
  const carpeta = await crearRes.json();
  return carpeta.id;
}

async function obtenerRootDriveId(token) {
  const res = await fetch('https://www.googleapis.com/drive/v3/files/root?fields=id', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.id;
}

async function subirHtmlComoDoc(nombre, htmlContent, parentId, token) {
  const metadata = JSON.stringify({ name: nombre, parents: [parentId], mimeType: 'application/vnd.google-apps.document' });
  const body = `--boundary\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n--boundary\r\nContent-Type: text/html\r\n\r\n${htmlContent}\r\n--boundary--`;
  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/related; boundary=boundary',
    },
    body,
  });
  return await uploadRes.json();
}

function estilosBase() {
  return `<style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a202c; margin: 30px; }
    h1 { font-size: 22px; color: #1d4ed8; border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 16px; }
    h2 { font-size: 15px; color: #374151; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .meta { background: #f3f4f6; border-radius: 8px; padding: 14px 18px; margin: 12px 0; }
    .meta-row { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 6px; font-size: 13px; }
    .meta-label { font-weight: bold; color: #374151; min-width: 160px; }
    .header-banner { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: white; padding: 16px 20px; border-radius: 10px; margin-bottom: 20px; }
    .header-banner h1 { color: white; border-bottom: 1px solid rgba(255,255,255,0.3); font-size: 20px; }
    .header-banner .subtitle { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .prueba-badge { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 8px 14px; margin-bottom: 16px; color: #92400e; font-weight: bold; font-size: 12px; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
    th { background: #1d4ed8; color: white; padding: 7px 10px; text-align: left; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge-ok { background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-falla { background: #fee2e2; color: #991b1b; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-na { background: #f3f4f6; color: #6b7280; padding: 2px 10px; border-radius: 12px; font-size: 11px; }
    .aprobado { background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 12px 16px; margin-top: 20px; }
    .footer { margin-top: 30px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; text-align: center; }
    .resumen { display: flex; gap: 16px; margin: 12px 0; }
    .resumen-card { flex: 1; border-radius: 8px; padding: 10px 14px; text-align: center; }
    .resumen-card .num { font-size: 22px; font-weight: bold; }
    .resumen-card .lbl { font-size: 11px; opacity: 0.8; margin-top: 2px; }
  </style>`;
}

function generarHTMLPrueba() {
  const hoy = new Date().toLocaleDateString('es-CL');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${estilosBase()}</head><body>

    <div class="header-banner">
      <h1>📋 Pauta Semanal de Inspección</h1>
      <div class="subtitle">Sistema de Gestión de Equipos Médicos · ${hoy}</div>
    </div>

    <div class="prueba-badge">⚠ DOCUMENTO DE PRUEBA — Datos ficticios para evaluación del formato</div>

    <div class="meta">
      <div class="meta-row"><span class="meta-label">Equipo:</span><span>Ambulancia Toyota HiAce · Patente BCDF-12</span></div>
      <div class="meta-row"><span class="meta-label">Tipo de Equipo:</span><span>Ambulancia</span></div>
      <div class="meta-row"><span class="meta-label">N° Inventario:</span><span>AMB-2024-001</span></div>
      <div class="meta-row"><span class="meta-label">Centro:</span><span>CESFAM Central · Módulo Urgencia</span></div>
      <div class="meta-row"><span class="meta-label">Conductor/Responsable:</span><span>Juan Pérez González</span></div>
      <div class="meta-row"><span class="meta-label">Fecha Inspección:</span><span>26/04/2026</span></div>
      <div class="meta-row"><span class="meta-label">KM Inicial:</span><span>87.540 km</span></div>
      <div class="meta-row"><span class="meta-label">Combustible:</span><span>3/4 (75%)</span></div>
    </div>

    <div class="resumen">
      <div class="resumen-card" style="background:#dcfce7; color:#166534;">
        <div class="num">15</div><div class="lbl">Ítems OK</div>
      </div>
      <div class="resumen-card" style="background:#fee2e2; color:#991b1b;">
        <div class="num">3</div><div class="lbl">Con Fallas</div>
      </div>
      <div class="resumen-card" style="background:#f3f4f6; color:#6b7280;">
        <div class="num">2</div><div class="lbl">No Aplica</div>
      </div>
    </div>

    <h2>💡 Luces</h2>
    <table>
      <tr><th>Ítem</th><th>Estado</th><th>Observación</th></tr>
      <tr><td>Luces delanteras</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Luces traseras</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Luces de emergencia (baliza)</td><td><span class="badge-falla">FALLA</span></td><td>Baliza derecha intermitente, requiere revisión</td></tr>
      <tr><td>Luces interiores</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Luces de freno</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
    </table>

    <h2>🔧 Motor</h2>
    <table>
      <tr><th>Ítem</th><th>Estado</th><th>Observación</th></tr>
      <tr><td>Nivel de aceite</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Nivel de agua/refrigerante</td><td><span class="badge-falla">FALLA</span></td><td>Nivel bajo, se añadió refrigerante de emergencia</td></tr>
      <tr><td>Nivel de líquido de frenos</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Correas y mangueras</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Batería del vehículo</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
    </table>

    <h2>📦 Accesorios</h2>
    <table>
      <tr><th>Ítem</th><th>Estado</th><th>Observación</th></tr>
      <tr><td>Sirena / altavoz</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Extintor</td><td><span class="badge-ok">OK</span></td><td>Vence en 8 meses</td></tr>
      <tr><td>Camilla</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Botiquín de emergencia</td><td><span class="badge-falla">FALLA</span></td><td>Faltan 2 ampollas de adrenalina — solicitud enviada</td></tr>
      <tr><td>Kit de oxígeno</td><td><span class="badge-ok">OK</span></td><td>Cilindro al 80%</td></tr>
    </table>

    <h2>📄 Documentos</h2>
    <table>
      <tr><th>Ítem</th><th>Estado</th><th>Observación</th></tr>
      <tr><td>Permiso de circulación</td><td><span class="badge-ok">OK</span></td><td>Vigente hasta Nov 2026</td></tr>
      <tr><td>Revisión técnica</td><td><span class="badge-ok">OK</span></td><td>Vigente hasta Ago 2026</td></tr>
      <tr><td>SOAP / Seguro obligatorio</td><td><span class="badge-ok">OK</span></td><td>-</td></tr>
      <tr><td>Hoja de ruta</td><td><span class="badge-na">N/A</span></td><td>-</td></tr>
    </table>

    <h2>⚠️ Daños Visuales</h2>
    <table>
      <tr><th>Zona</th><th>Descripción</th></tr>
      <tr><td>Lateral derecho</td><td>Rayón superficial a la altura del panel trasero, sin daño estructural</td></tr>
    </table>

    <h2>📝 Observaciones Generales</h2>
    <p>El vehículo se encuentra en condiciones generales aceptables. Se reportaron 3 ítems con observación: baliza derecha intermitente (se revisará con mantención programada), nivel de refrigerante bajo (corregido en terreno), y faltante de ampollas en botiquín (solicitud de reposición enviada al administrador).</p>

    <div class="aprobado">
      <strong>✅ Aprobado por:</strong> María González Administradora<br>
      <strong>Email:</strong> mgonzalez@cesfam.cl<br>
      <strong>Fecha de revisión:</strong> 27/04/2026<br>
      <strong>Nota del revisor:</strong> Inspección aprobada. Se deja constancia de los ítems pendientes para seguimiento en próxima semana.
    </div>

    <div class="footer">
      Documento generado automáticamente por el Sistema de Gestión de Equipos Médicos · ${hoy}<br>
      Este es un documento de PRUEBA con datos ficticios para evaluación del formato.
    </div>

  </body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const rootDriveId = await obtenerRootDriveId(accessToken);
    const sistemaCarpetaId = await obtenerOCrearCarpeta('Sistema Gestión Equipos', rootDriveId, accessToken);
    const pruebasCarpetaId = await obtenerOCrearCarpeta('_Documentos de Prueba', sistemaCarpetaId, accessToken);

    const htmlContent = generarHTMLPrueba();
    const hoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    const archivo = await subirHtmlComoDoc(`[PRUEBA] Pauta Semanal - Ambulancia Ejemplo - ${hoy}`, htmlContent, pruebasCarpetaId, accessToken);

    return Response.json({
      ok: true,
      mensaje: 'Documento de prueba creado en Google Drive',
      link: archivo.webViewLink,
      nombre: archivo.name,
      carpeta: 'Sistema Gestión Equipos / _Documentos de Prueba',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});