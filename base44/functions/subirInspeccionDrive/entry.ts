import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Helpers de Google Drive ──────────────────────────────────────────────────

async function obtenerOCrearCarpeta(nombre, parentId, token) {
  const query = `name='${nombre.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const { files } = await res.json();
  if (files && files.length > 0) return files[0].id;

  // Crear carpeta
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

async function subirHtmlComoPDF(nombre, htmlContent, parentId, token) {
  // Subir como Google Doc (para que quede en Drive) con contenido HTML
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

// ── Mapeos ───────────────────────────────────────────────────────────────────

const TIPO_FORMULARIO_LABEL = {
  inspeccion_semanal: 'Pauta Semanal',
  turno_chofer: 'Turno Chofer',
  inspeccion_diaria: 'Pauta Diaria',
  inspeccion_anual: 'Pauta Anual',
};

const TIPO_EQUIPO_CATEGORIA = {
  ambulancia: 'Ambulancias',
  dea: 'DEA',
  monitor_desfibrilador: 'Monitor Desfibrilador',
  monitor_multiparametros: 'Monitor Multiparametros',
};

// Mapeo de nombres de centro a nombre oficial de carpeta
const ESTABLECIMIENTO_CARPETA = {
  'panguipulli':    'Cesfam Panguipulli',
  'choshuenco':     'Cesfam Choshuenco',
  'coñaripe':       'Cesfam Coñaripe',
  'conaripe':       'Cesfam Coñaripe',
};

function normalizarEstablecimiento(nombre) {
  if (!nombre) return nombre;
  const lower = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, val] of Object.entries(ESTABLECIMIENTO_CARPETA)) {
    if (lower.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return val;
  }
  return nombre; // fallback: usar el nombre tal cual
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Generadores de HTML ──────────────────────────────────────────────────────

function estilosBase() {
  return `<style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a202c; margin: 30px; }
    h1 { font-size: 20px; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; }
    h2 { font-size: 15px; color: #374151; margin-top: 20px; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: 13px; color: #6b7280; margin: 14px 0 4px 0; }
    .meta { background: #f3f4f6; border-radius: 8px; padding: 12px 16px; margin: 12px 0; }
    .meta-row { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 4px; }
    .meta-label { font-weight: bold; color: #374151; min-width: 140px; }
    .ok { color: #16a34a; font-weight: bold; }
    .falla { color: #dc2626; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { background: #1d4ed8; color: white; padding: 6px 10px; text-align: left; font-size: 12px; }
    td { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge-ok { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
    .badge-falla { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
    .badge-na { background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
    .aprobado { background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 10px 14px; margin-top: 16px; }
    .footer { margin-top: 30px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  </style>`;
}

function htmlInspeccion(insp, revisor) {
  const datos = (() => { try { return insp.datos_json ? JSON.parse(insp.datos_json) : {}; } catch { return {}; } })();
  const equipo = datos.equipo || {};
  const tipoLabel = TIPO_FORMULARIO_LABEL[insp.tipo_formulario] || insp.tipo_formulario;
  const fecha = insp.fecha ? insp.fecha.split('-').reverse().join('/') : '-';
  const fechaRevision = insp.fecha_revision ? insp.fecha_revision.split('-').reverse().join('/') : '-';

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">${estilosBase()}</head><body>`;
  html += `<h1>📋 ${tipoLabel}</h1>`;
  html += `<div class="meta">
    <div class="meta-row"><span class="meta-label">Equipo:</span><span>${insp.equipo_label || insp.equipo_id}</span></div>
    <div class="meta-row"><span class="meta-label">Tipo Equipo:</span><span>${TIPO_EQUIPO_CATEGORIA[equipo.tipo] || equipo.tipo || '-'}</span></div>
    <div class="meta-row"><span class="meta-label">Centro:</span><span>${equipo.centro_principal || '-'}${equipo.subsede ? ' · ' + equipo.subsede : ''}</span></div>
    ${equipo.patente ? `<div class="meta-row"><span class="meta-label">Patente:</span><span>${equipo.patente}</span></div>` : ''}
    ${insp.conductor ? `<div class="meta-row"><span class="meta-label">Conductor/Responsable:</span><span>${insp.conductor}</span></div>` : ''}
    <div class="meta-row"><span class="meta-label">Fecha Inspección:</span><span>${fecha}</span></div>
    ${insp.km_inicial ? `<div class="meta-row"><span class="meta-label">KM Inicial:</span><span>${Number(insp.km_inicial).toLocaleString('es-CL')}</span></div>` : ''}
    ${insp.combustible ? `<div class="meta-row"><span class="meta-label">Combustible:</span><span>${insp.combustible}</span></div>` : ''}
  </div>`;

  // Checklists pauta semanal
  if (insp.tipo_formulario === 'inspeccion_semanal') {
    const secciones = [
      { key: 'luces', titulo: '💡 Luces', estadoBueno: 'bueno' },
      { key: 'motor', titulo: '🔧 Motor', estadoBueno: 'bueno' },
      { key: 'accesorios', titulo: '📦 Accesorios', estadoBueno: 'bueno' },
      { key: 'documentos', titulo: '📄 Documentos', estadoBueno: 'bueno' },
    ];
    for (const sec of secciones) {
      if (!datos[sec.key]) continue;
      html += `<h2>${sec.titulo}</h2><table><tr><th>Ítem</th><th>Estado</th><th>Observación</th></tr>`;
      for (const [item, v] of Object.entries(datos[sec.key])) {
        const badge = v?.estado === sec.estadoBueno ? 'badge-ok' : v?.estado === 'n/a' ? 'badge-na' : 'badge-falla';
        const estadoLabel = v?.estado === 'bueno' ? 'OK' : v?.estado === 'malo' ? 'FALLA' : (v?.estado || '-');
        html += `<tr><td>${item}</td><td><span class="${badge}">${estadoLabel}</span></td><td>${v?.obs || '-'}</td></tr>`;
      }
      html += `</table>`;
    }
    if (datos.danos) {
      const danosMarcados = Object.entries(datos.danos).filter(([, v]) => v?.marcado);
      if (danosMarcados.length > 0) {
        html += `<h2>⚠️ Daños Visuales</h2><table><tr><th>Zona</th><th>Descripción</th></tr>`;
        for (const [zona, v] of danosMarcados) {
          html += `<tr><td>${zona.replace(/_/g, ' ')}</td><td>${v.descripcion || '-'}</td></tr>`;
        }
        html += `</table>`;
      }
    }
  }

  // Checklist pauta diaria
  if (insp.tipo_formulario === 'inspeccion_diaria') {
    const secciones = [
      { key: 'exterior', titulo: '🚗 Revisión Exterior' },
      { key: 'interior', titulo: '🪑 Revisión Interior' },
      { key: 'equipo_medico', titulo: '🏥 Equipos Médicos' },
      { key: 'accesorios_diaria', titulo: '📦 Accesorios' },
      { key: 'saneamiento', titulo: '🧹 Limpieza Básica' },
      { key: 'documentacion', titulo: '📄 Documentación' },
    ];
    for (const sec of secciones) {
      if (!datos[sec.key]) continue;
      html += `<h2>${sec.titulo}</h2><table><tr><th>Ítem</th><th>Estado</th><th>Observación</th></tr>`;
      for (const [item, v] of Object.entries(datos[sec.key])) {
        const badge = v?.estado === 'correcto' ? 'badge-ok' : v?.estado === 'n/a' ? 'badge-na' : 'badge-falla';
        const estadoLabel = v?.estado === 'correcto' ? 'OK' : v?.estado === 'incorrecto' ? 'FALLA' : (v?.estado || '-');
        html += `<tr><td>${item}</td><td><span class="${badge}">${estadoLabel}</span></td><td>${v?.obs || '-'}</td></tr>`;
      }
      html += `</table>`;
    }
    if (datos.problemasDetectados) html += `<h3>Problemas detectados:</h3><p>${datos.problemasDetectados}</p>`;
    if (datos.accionesTomadas) html += `<h3>Acciones tomadas:</h3><p>${datos.accionesTomadas}</p>`;
  }

  // Turno chofer / pauta anual: observaciones generales
  if (insp.tipo_formulario === 'turno_chofer' || insp.tipo_formulario === 'inspeccion_anual') {
    if (insp.observaciones) {
      html += `<h2>📝 Observaciones</h2><p>${insp.observaciones}</p>`;
    }
  }

  // Observaciones generales
  if (insp.observaciones && insp.tipo_formulario !== 'turno_chofer') {
    html += `<h2>📝 Observaciones Generales</h2><p>${insp.observaciones}</p>`;
  }

  // Nota del revisor y aprobación
  html += `<div class="aprobado">
    <strong>✅ Aprobado por:</strong> ${revisor.full_name || revisor.email}<br>
    <strong>Email:</strong> ${revisor.email}<br>
    <strong>Fecha de revisión:</strong> ${fechaRevision}
    ${insp.nota_revision ? `<br><strong>Nota:</strong> ${insp.nota_revision}` : ''}
  </div>`;

  html += `<div class="footer">Documento generado automáticamente por el Sistema de Gestión de Equipos · ${new Date().toLocaleDateString('es-CL')}</div>`;
  html += `</body></html>`;
  return html;
}

function htmlMantenimientoExterno(equipo, revisor) {
  const fecha = equipo.fecha_ultimo_informe_externo ? equipo.fecha_ultimo_informe_externo.split('-').reverse().join('/') : '-';
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">${estilosBase()}</head><body>`;
  html += `<h1>🔧 Informe de Mantenimiento Externo</h1>`;
  html += `<div class="meta">
    <div class="meta-row"><span class="meta-label">Equipo:</span><span>${equipo.numero_inventario || equipo.id}</span></div>
    <div class="meta-row"><span class="meta-label">Marca / Modelo:</span><span>${equipo.marca || '-'} ${equipo.modelo || ''}</span></div>
    <div class="meta-row"><span class="meta-label">Número de Serie:</span><span>${equipo.numero_serie || '-'}</span></div>
    <div class="meta-row"><span class="meta-label">Centro:</span><span>${equipo.centro_principal || '-'}${equipo.subsede ? ' · ' + equipo.subsede : ''}</span></div>
    <div class="meta-row"><span class="meta-label">Fecha del Informe:</span><span>${fecha}</span></div>
    <div class="meta-row"><span class="meta-label">Empresa Responsable:</span><span>${equipo.empresa_responsable_informe_externo || '-'}</span></div>
  </div>`;
  html += `<h2>👤 Responsable de Carga</h2>
    <div class="meta">
      <div class="meta-row"><span class="meta-label">Cargado por:</span><span>${revisor.full_name || revisor.email}</span></div>
      <div class="meta-row"><span class="meta-label">Email:</span><span>${revisor.email}</span></div>
      <div class="meta-row"><span class="meta-label">Fecha de registro:</span><span>${new Date().toLocaleDateString('es-CL')}</span></div>
    </div>`;
  if (equipo.url_ultimo_informe_externo) {
    html += `<h2>📎 Documento Original</h2><p><a href="${equipo.url_ultimo_informe_externo}">Ver informe original adjunto</a></p>`;
  }
  html += `<div class="footer">Documento generado automáticamente por el Sistema de Gestión de Equipos · ${new Date().toLocaleDateString('es-CL')}</div>`;
  html += `</body></html>`;
  return html;
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tipo, inspeccion_id, equipo_id } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Carpeta raíz: BITÁCORA
    const rootDriveId = await obtenerRootDriveId(accessToken);
    const raizId = await obtenerOCrearCarpeta('BITÁCORA', rootDriveId, accessToken);

    if (tipo === 'inspeccion') {
      // ── Subir PDF de inspección aprobada ──
      const insp = await base44.asServiceRole.entities.InspeccionPendiente.get(inspeccion_id);
      if (!insp) return Response.json({ error: 'Inspección no encontrada' }, { status: 404 });

      const datos = (() => { try { return insp.datos_json ? JSON.parse(insp.datos_json) : {}; } catch { return {}; } })();
      const equipo = datos.equipo || {};

      const establecimiento = normalizarEstablecimiento(equipo.centro_principal) || 'Sin Establecimiento';
      const categoriaEquipo = TIPO_FORMULARIO_LABEL[insp.tipo_formulario] === 'Turno Chofer'
        ? 'Turno Chofer'
        : TIPO_EQUIPO_CATEGORIA[equipo.tipo] || equipo.tipo || 'Otros';

      // Determinar mes desde fecha de inspección
      const fechaObj = insp.fecha ? new Date(insp.fecha + 'T12:00:00') : new Date();
      const mesLabel = MESES[fechaObj.getMonth()];
      const anio = fechaObj.getFullYear();

      // Estructura: BITÁCORA / [Cesfam X] / [Categoría] / [Mes Año]
      const establecimientoId = await obtenerOCrearCarpeta(establecimiento, raizId, accessToken);
      const categoriaCarpetaId = await obtenerOCrearCarpeta(categoriaEquipo, establecimientoId, accessToken);
      const mesCarpetaId = await obtenerOCrearCarpeta(`${mesLabel} ${anio}`, categoriaCarpetaId, accessToken);

      const tipoLabel = TIPO_FORMULARIO_LABEL[insp.tipo_formulario] || insp.tipo_formulario;
      const nombreArchivo = `${tipoLabel} - ${insp.equipo_label || insp.equipo_id} - ${insp.fecha || 'sin-fecha'}`;

      const revisorInfo = { full_name: insp.revisor_nombre || user.full_name, email: insp.revisor_email || user.email };
      const htmlContent = htmlInspeccion(insp, revisorInfo);
      const archivo = await subirHtmlComoPDF(nombreArchivo, htmlContent, mesCarpetaId, accessToken);

      // Guardar link en la inspección
      if (archivo.id) {
        await base44.asServiceRole.entities.InspeccionPendiente.update(inspeccion_id, {
          nota_revision: (insp.nota_revision ? insp.nota_revision + ' | ' : '') + `Drive: ${archivo.webViewLink || archivo.id}`,
        });
      }

      return Response.json({ ok: true, archivo });

    } else if (tipo === 'mantenimiento_externo') {
      // ── Subir copia del informe de mantenimiento externo ──
      const equipo = await base44.asServiceRole.entities.Equipo.get(equipo_id);
      if (!equipo) return Response.json({ error: 'Equipo no encontrado' }, { status: 404 });

      const establecimiento = normalizarEstablecimiento(equipo.centro_principal) || 'Sin Establecimiento';
      const categoriaEquipo = TIPO_EQUIPO_CATEGORIA[equipo.tipo] || equipo.tipo || 'Otros';

      const fechaObj = equipo.fecha_ultimo_informe_externo
        ? new Date(equipo.fecha_ultimo_informe_externo + 'T12:00:00')
        : new Date();
      const mesLabel = MESES[fechaObj.getMonth()];
      const anio = fechaObj.getFullYear();

      // Estructura: BITÁCORA / [Cesfam X] / [Categoría] / [Mes Año]
      const establecimientoId = await obtenerOCrearCarpeta(establecimiento, raizId, accessToken);
      const categoriaCarpetaId = await obtenerOCrearCarpeta(categoriaEquipo, establecimientoId, accessToken);
      const mesCarpetaId = await obtenerOCrearCarpeta(`${mesLabel} ${anio}`, categoriaCarpetaId, accessToken);

      const nombreArchivo = `Mantenimiento Externo - ${equipo.numero_inventario || equipo.id} - ${equipo.fecha_ultimo_informe_externo || 'sin-fecha'}`;

      const htmlContent = htmlMantenimientoExterno(equipo, user);
      const archivo = await subirHtmlComoPDF(nombreArchivo, htmlContent, mesCarpetaId, accessToken);

      return Response.json({ ok: true, archivo });

    } else {
      return Response.json({ error: 'Tipo inválido' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});