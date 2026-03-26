import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

const TIPOS = {
  parches_adulto: "Parches Adulto",
  parches_nino: "Parches Niño",
  parches_mixto: "Parches Mixto",
  bateria: "Batería",
  mantenimiento: "Mantenimiento",
};

const ESTADO_COLOR = {
  pendiente: { bg: "#fff7ed", text: "#c2410c", label: "Pendiente" },
  aprobada: { bg: "#f0fdf4", text: "#15803d", label: "Aprobada" },
  rechazada: { bg: "#fef2f2", text: "#b91c1c", label: "Rechazada" },
  completada: { bg: "#eff6ff", text: "#1d4ed8", label: "Completada" },
};

export default function InformeSolicitudesPDF({ solicitudes, equipos }) {
  const [generando, setGenerando] = useState(false);

  const generarPDF = async () => {
    setGenerando(true);

    const appConfig = await base44.entities.AppConfig.list().catch(() => []);
    const logo = appConfig[0]?.logo_url || null;
    const appNombre = appConfig[0]?.nombre_app || "DEA Manager";

    const hoy = new Date();

    const resumen = {
      total: solicitudes.length,
      pendiente: solicitudes.filter(s => s.estado === "pendiente").length,
      aprobada: solicitudes.filter(s => s.estado === "aprobada").length,
      rechazada: solicitudes.filter(s => s.estado === "rechazada").length,
      completada: solicitudes.filter(s => s.estado === "completada").length,
    };

    const filas = solicitudes.map(s => {
      const eq = equipos.find(e => e.id === s.equipo_id);
      const est = ESTADO_COLOR[s.estado] || { bg: "#f8fafc", text: "#334155", label: s.estado };
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">
            ${TIPOS[s.tipo_solicitud] || s.tipo_solicitud}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">
            ${eq ? `${eq.marca} ${eq.modelo}` : "—"}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">
            ${eq?.establecimiento || "—"}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;">
            ${s.cantidad ?? "—"}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;max-width:200px;">
            ${s.descripcion || "—"}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#94a3b8;">
            ${s.solicitante_email || "—"}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;">
            <span style="background:${est.bg};color:${est.text};padding:3px 10px;border-radius:20px;font-weight:600;white-space:nowrap;">
              ${est.label}
            </span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8;white-space:nowrap;">
            ${s.created_date ? format(new Date(s.created_date), "dd/MM/yyyy") : "—"}
          </td>
        </tr>
      `;
    }).join("");

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe de Solicitudes</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 32px;
      color: #1e293b;
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      border-radius: 14px;
      padding: 28px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .header-logo { width: 72px; height: 72px; object-fit: contain; background: rgba(255,255,255,0.15); border-radius: 12px; padding: 4px; }
    .header-title { color: white; }
    .header-title h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header-title p { margin: 4px 0 0; font-size: 14px; color: rgba(255,255,255,0.75); }
    .header-right { text-align: right; color: rgba(255,255,255,0.85); font-size: 13px; line-height: 1.8; }
    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }
    .resumen-card {
      background: white;
      border-radius: 12px;
      padding: 16px 14px;
      text-align: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      border-top: 3px solid var(--card-color);
    }
    .resumen-card .num { font-size: 28px; font-weight: 700; color: var(--card-color); }
    .resumen-card .lbl { font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.4px; }
    .table-wrap { background: white; border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); overflow: hidden; margin-bottom: 24px; }
    .table-header { padding: 18px 24px; border-bottom: 2px solid #f1f5f9; display: flex; align-items: center; gap: 10px; }
    .table-header h2 { margin: 0; font-size: 17px; font-weight: 700; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #f8fafc; }
    thead th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
    tbody tr:hover { background: #f8fafc; }
    .footer { text-align: center; padding: 20px 0 0; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .print-btn {
      position: fixed; bottom: 24px; right: 24px;
      background: #2563eb; color: white; border: none; border-radius: 12px;
      padding: 14px 24px; font-size: 15px; font-weight: 600; cursor: pointer;
      box-shadow: 0 4px 16px rgba(37,99,235,0.4);
      display: flex; align-items: center; gap: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logo ? `<img src="${logo}" class="header-logo" alt="Logo"/>` : ""}
      <div class="header-title">
        <h1>Informe de Solicitudes</h1>
        <p>${appNombre} — Gestión de Stock y Mantenimiento</p>
      </div>
    </div>
    <div class="header-right">
      <div><strong>Fecha:</strong> ${format(hoy, "dd/MM/yyyy")}</div>
      <div><strong>Hora:</strong> ${format(hoy, "HH:mm")} hrs</div>
      <div><strong>Total:</strong> ${resumen.total} solicitud(es)</div>
    </div>
  </div>

  <div class="resumen-grid">
    <div class="resumen-card" style="--card-color:#64748b">
      <div class="num">${resumen.total}</div>
      <div class="lbl">Total</div>
    </div>
    <div class="resumen-card" style="--card-color:#ea580c">
      <div class="num">${resumen.pendiente}</div>
      <div class="lbl">Pendientes</div>
    </div>
    <div class="resumen-card" style="--card-color:#16a34a">
      <div class="num">${resumen.aprobada}</div>
      <div class="lbl">Aprobadas</div>
    </div>
    <div class="resumen-card" style="--card-color:#1d4ed8">
      <div class="num">${resumen.completada}</div>
      <div class="lbl">Completadas</div>
    </div>
    <div class="resumen-card" style="--card-color:#dc2626">
      <div class="num">${resumen.rechazada}</div>
      <div class="lbl">Rechazadas</div>
    </div>
  </div>

  <div class="table-wrap">
    <div class="table-header">
      <h2>📋 Detalle de Solicitudes</h2>
    </div>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Equipo</th>
          <th>Establecimiento</th>
          <th>Cantidad</th>
          <th>Descripción</th>
          <th>Solicitante</th>
          <th>Estado</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${filas || `<tr><td colspan="8" style="text-align:center;padding:24px;color:#94a3b8;">Sin solicitudes registradas</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Sistema de Gestión de Equipos DEA &nbsp;•&nbsp; Informe generado automáticamente el ${format(hoy, "dd/MM/yyyy")} a las ${format(hoy, "HH:mm")} hrs
  </div>

  <button class="print-btn no-print" onclick="window.print()">
    🖨️ Imprimir / Guardar PDF
  </button>
</body>
</html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setGenerando(false);
  };

  return (
    <button
      onClick={generarPDF}
      disabled={generando}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
      style={{ background: "#6366f1" }}
    >
      {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {generando ? "Generando..." : "Exportar Informe PDF"}
    </button>
  );
}