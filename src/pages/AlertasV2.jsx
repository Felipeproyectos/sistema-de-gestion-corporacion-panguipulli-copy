import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle, Bell, Mail, Loader2, X, ChevronDown } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { CENTROS_ESTRUCTURA } from "@/lib/centros";

const NIVEL_CONFIG = {
  critica: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "Crítica" },
  advertencia: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Advertencia" },
  info: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "Info" }
};

const TIPO_LABELS = {
  parche_vencido: "Parche Vencido",
  parche_por_vencer: "Parche por Vencer",
  bateria_vencida: "Batería Vencida",
  bateria_por_vencer: "Batería por Vencer",
  mantenimiento_requerido: "Mantenimiento Requerido",
  equipo_fuera_servicio: "Equipo Fuera de Servicio"
};

export default function AlertasV2() {
  const [alertas, setAlertas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [parches, setParches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("activa");
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Equipo.list(),
      base44.entities.Parche.list(),
      base44.entities.Alerta.list()
    ]).then(([eqs, pa, al]) => {
      setEquipos(eqs);
      setParches(pa);
      // Generar alertas automáticas basadas en fechas
      generarAlertasAutomaticas(eqs, pa, al);
      setAlertas(al);
      setLoading(false);
    });
  }, []);

  const generarAlertasAutomaticas = async (eqs, pa, alertasExistentes) => {
    const hoy = new Date();
    const nuevasAlertas = [];

    for (const eq of eqs) {
      // Verificar parches
      const parchesEquipo = pa.filter(p => p.equipo_id === eq.id && p.activo !== false);
      for (const parche of parchesEquipo) {
        if (!parche.fecha_vencimiento) continue;
        const dias = differenceInDays(parseISO(parche.fecha_vencimiento), hoy);
        const tipo = dias < 0 ? "parche_vencido" : dias <= 90 ? "parche_por_vencer" : null;
        if (!tipo) continue;
        const yaExiste = alertasExistentes.some(a => a.equipo_id === eq.id && a.tipo === tipo && a.estado === "activa");
        if (!yaExiste) {
          nuevasAlertas.push({
            equipo_id: eq.id, tipo, nivel: dias < 0 ? "critica" : "advertencia",
            descripcion: `Parche ${parche.tipo} ${dias < 0 ? "vencido" : `vence en ${dias} días`}`,
            estado: "activa", centro: eq.centro_principal, subsede: eq.subsede || ""
          });
        }
      }
      // Verificar batería
      if (eq.fecha_vencimiento_bateria) {
        const dias = differenceInDays(parseISO(eq.fecha_vencimiento_bateria), hoy);
        const tipo = dias < 0 ? "bateria_vencida" : dias <= 90 ? "bateria_por_vencer" : null;
        if (tipo) {
          const yaExiste = alertasExistentes.some(a => a.equipo_id === eq.id && a.tipo === tipo && a.estado === "activa");
          if (!yaExiste) {
            nuevasAlertas.push({
              equipo_id: eq.id, tipo, nivel: dias < 0 ? "critica" : "advertencia",
              descripcion: `Batería ${dias < 0 ? "vencida" : `vence en ${dias} días`}`,
              estado: "activa", centro: eq.centro_principal, subsede: eq.subsede || ""
            });
          }
        }
      }
    }

    for (const a of nuevasAlertas) {
      await base44.entities.Alerta.create(a);
    }
    if (nuevasAlertas.length > 0) {
      const updated = await base44.entities.Alerta.list();
      setAlertas(updated);
    }
  };

  const handleResolver = async (alerta) => {
    await base44.entities.Alerta.update(alerta.id, {
      estado: "resuelta",
      fecha_resolucion: new Date().toISOString().split("T")[0]
    });
    setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, estado: "resuelta" } : a));
  };

  const filtradas = alertas.filter(a => filtro === "todos" ? true : a.estado === filtro)
    .sort((a, b) => {
      const order = { critica: 0, advertencia: 1, info: 2 };
      return (order[a.nivel] || 1) - (order[b.nivel] || 1);
    });

  const counts = {
    activa: alertas.filter(a => a.estado === "activa").length,
    resuelta: alertas.filter(a => a.estado === "resuelta").length,
    critica: alertas.filter(a => a.estado === "activa" && a.nivel === "critica").length
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="relative max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Sistema</p>
              <h1 className="text-3xl font-bold text-white">Alertas</h1>
              <p className="text-blue-100 text-sm mt-0.5">{counts.critica} crítica(s) activa(s)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-6 pb-10">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Activas", count: counts.activa, color: "#dc2626", bg: "#fef2f2" },
            { label: "Críticas", count: counts.critica, color: "#ea580c", bg: "#fff7ed" },
            { label: "Resueltas", count: counts.resuelta, color: "#16a34a", bg: "#f0fdf4" }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow border border-slate-100">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "activa", label: "Activas", count: counts.activa },
            { key: "resuelta", label: "Resueltas", count: counts.resuelta },
            { key: "todos", label: "Todas" }
          ].map(t => (
            <button key={t.key} onClick={() => setFiltro(t.key)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${filtro === t.key ? "text-white" : "bg-white text-slate-500 border border-slate-200"}`}
              style={filtro === t.key ? { background: "#1a2e4a" } : {}}>
              {t.label}{t.count !== undefined ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtradas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay alertas en esta categoría</p>
            </div>
          ) : filtradas.map(alerta => {
            const equipo = equipos.find(e => e.id === alerta.equipo_id);
            const cfg = NIVEL_CONFIG[alerta.nivel] || NIVEL_CONFIG.advertencia;
            return (
              <div key={alerta.id} className="bg-white rounded-2xl shadow border p-5 flex items-center justify-between gap-3" style={{ borderColor: cfg.border }}>
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>{TIPO_LABELS[alerta.tipo] || alerta.tipo}</span>
                      <span className="text-xs text-slate-400">{cfg.label}</span>
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {equipo ? `${equipo.marca} ${equipo.modelo}` : "Equipo desconocido"}
                    </p>
                    <p className="text-xs text-slate-500">{alerta.descripcion}</p>
                    <p className="text-xs text-slate-400">{alerta.centro}{alerta.subsede ? ` › ${alerta.subsede}` : ""}</p>
                  </div>
                </div>
                {alerta.estado === "activa" ? (
                  <button
                    onClick={() => handleResolver(alerta)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "#16a34a" }}
                  >
                    Resolver
                  </button>
                ) : (
                  <span className="flex-shrink-0 flex items-center gap-1.5 text-xs text-green-600 font-medium px-3 py-2 bg-green-50 rounded-xl">
                    <CheckCircle className="w-3.5 h-3.5" /> Resuelta
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}