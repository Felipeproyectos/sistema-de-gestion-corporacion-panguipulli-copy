import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Edit, Trash2, Plus, Activity, Package, Car, Loader2 } from "lucide-react";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO, TIPOS_ACTIVIDAD, CENTROS_ESTRUCTURA } from "@/lib/centros";
import { format, parseISO, differenceInDays } from "date-fns";
import ParchesPanelV2 from "./ParchesPanelV2";
import ActividadForm from "./ActividadForm";

export default function EquipoDetalleModal({ equipo, parches, onClose, onEdit, onDeleted, user, onActividadCreada }) {
  const [actividades, setActividades] = useState([]);
  const [showActForm, setShowActForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState("info");

  const isAdmin = user?.role === "admin";
  const estado = ESTADOS_EQUIPO.find(e => e.value === equipo.estado);
  const tipoLabel = TIPOS_EQUIPO.find(t => t.value === equipo.tipo)?.label || equipo.tipo;

  useEffect(() => {
    base44.entities.Actividad.filter({ equipo_id: equipo.id }).then(setActividades).catch(() => {});
  }, [equipo.id]);

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este equipo? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    await base44.entities.Equipo.delete(equipo.id);
    onDeleted();
  };

  const hoy = new Date();
  const batDias = equipo.fecha_vencimiento_bateria
    ? differenceInDays(parseISO(equipo.fecha_vencimiento_bateria), hoy)
    : null;

  const tabs = [
    { key: "info", label: "Información" },
    ...(equipo.tipo !== "ambulancia" ? [{ key: "parches", label: `Parches (${parches.length})` }] : []),
    { key: "actividades", label: `Actividades (${actividades.length})` },
    ...(equipo.tipo === "ambulancia" ? [{ key: "km", label: "Kilometraje" }] : [])
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-7 pt-7 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: estado?.color, background: estado?.bg }}>{estado?.label}</span>
              <span className="text-xs text-slate-400">{tipoLabel}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{equipo.marca} {equipo.modelo}</h2>
            <p className="text-xs text-slate-400">#{equipo.numero_inventario}{equipo.numero_serie ? ` · S/N: ${equipo.numero_serie}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><Edit className="w-4 h-4" /></button>
            {isAdmin && <button onClick={handleDelete} disabled={deleting} className="p-2 rounded-xl hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-7 pt-4 flex gap-1 border-b border-slate-100">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-all ${tab === t.key ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-7 py-5">
          {tab === "info" && (
            <div className="space-y-4">
              {equipo.foto_url && <img src={equipo.foto_url} alt="equipo" className="w-full h-40 object-cover rounded-xl" />}

              {/* Información General */}
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Información General</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Centro", equipo.centro_principal],
                  ["Subsede", equipo.subsede || "—"],
                  ["Ubicación", equipo.ubicacion_especifica || "—"],
                  ["Año adq.", equipo.anio_adquisicion || "—"],
                  ["Batería vence", equipo.fecha_vencimiento_bateria ? format(parseISO(equipo.fecha_vencimiento_bateria), "dd/MM/yyyy") : "—"],
                  ...(equipo.patente ? [["Patente", equipo.patente]] : [])
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                    <p className="text-sm font-semibold text-slate-800">{v}</p>
                  </div>
                ))}
              </div>

              {batDias !== null && batDias <= 90 && (
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${batDias < 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                  ⚠️ Batería {batDias < 0 ? `vencida hace ${Math.abs(batDias)} días` : `vence en ${batDias} días`}
                </div>
              )}

              {/* Sección exclusiva ambulancias */}
              {equipo.tipo === "ambulancia" && (
                <>
                  {equipo.conductor_responsable && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">Conductor Responsable</p>
                      <p className="text-sm font-semibold text-slate-800">{equipo.conductor_responsable}</p>
                    </div>
                  )}

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-1">Estado del Vehículo</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Neumáticos", equipo.estado_neumaticos],
                      ["Luces", equipo.estado_luces],
                      ["Batería Vehículo", equipo.estado_bateria_vehiculo],
                      ["Sirena", equipo.estado_sirena],
                    ].map(([k, v]) => {
                      const colorMap = { ok: "text-green-700 bg-green-50", desgastado: "text-amber-700 bg-amber-50", requiere_cambio: "text-red-700 bg-red-50", baja_carga: "text-amber-700 bg-amber-50", requiere_reemplazo: "text-red-700 bg-red-50", falla_leve: "text-amber-700 bg-amber-50", falla_grave: "text-red-700 bg-red-50" };
                      const labelMap = { ok: "OK", desgastado: "Desgastado", requiere_cambio: "Requiere Cambio", baja_carga: "Baja Carga", requiere_reemplazo: "Requiere Reemplazo", falla_leve: "Falla Leve", falla_grave: "Falla Grave" };
                      return (
                        <div key={k} className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-1">{k}</p>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${colorMap[v] || "bg-slate-100 text-slate-600"}`}>{labelMap[v] || v || "—"}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Revisión Técnica */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">Revisión Técnica</p>
                      {(() => { const cm = { ok: "text-green-700 bg-green-50", en_gestion: "text-blue-700 bg-blue-50", pendiente: "text-amber-700 bg-amber-50", vencida: "text-red-700 bg-red-50" }; const lm = { ok: "OK", en_gestion: "En Gestión", pendiente: "Pendiente", vencida: "Vencida" }; const v = equipo.estado_revision_tecnica; return <span className={`text-xs font-bold px-2 py-1 rounded-full ${cm[v] || "bg-slate-100 text-slate-600"}`}>{lm[v] || v || "—"}</span>; })()}
                      {equipo.fecha_vencimiento_revision_tecnica && <p className="text-xs text-slate-500 mt-1">Vence: {format(parseISO(equipo.fecha_vencimiento_revision_tecnica), "dd/MM/yyyy")}</p>}
                    </div>
                    {/* Permiso Circulación */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">Permiso Circulación</p>
                      {(() => { const cm = { ok: "text-green-700 bg-green-50", en_gestion: "text-blue-700 bg-blue-50", pendiente: "text-amber-700 bg-amber-50", vencido: "text-red-700 bg-red-50" }; const lm = { ok: "OK", en_gestion: "En Gestión", pendiente: "Pendiente", vencido: "Vencido" }; const v = equipo.estado_permiso_circulacion; return <span className={`text-xs font-bold px-2 py-1 rounded-full ${cm[v] || "bg-slate-100 text-slate-600"}`}>{lm[v] || v || "—"}</span>; })()}
                      {equipo.fecha_vencimiento_permiso_circulacion && <p className="text-xs text-slate-500 mt-1">Vence: {format(parseISO(equipo.fecha_vencimiento_permiso_circulacion), "dd/MM/yyyy")}</p>}
                    </div>
                  </div>
                </>
              )}

              {equipo.notas && (
                <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">
                  <p className="text-xs font-semibold text-blue-500 mb-1">Notas</p>
                  {equipo.notas}
                </div>
              )}
            </div>
          )}

          {tab === "parches" && (
            <ParchesPanelV2 equipo={equipo} parches={parches} user={user} onUpdated={onActividadCreada} />
          )}

          {tab === "actividades" && (
            <div className="space-y-3">
              <button
                onClick={() => setShowActForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #1565c0, #0288d1)" }}
              >
                <Plus className="w-4 h-4" /> Registrar Actividad
              </button>
              {actividades.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No hay actividades registradas</p>
              ) : (
                actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(act => {
                  const tipo = TIPOS_ACTIVIDAD.find(t => t.value === act.tipo);
                  return (
                    <div key={act.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-800">{tipo?.label || act.tipo}</span>
                        <span className="text-xs text-slate-400">{act.fecha}</span>
                      </div>
                      {act.observaciones && <p className="text-xs text-slate-500">{act.observaciones}</p>}
                      {act.usuario_nombre && <p className="text-xs text-slate-400 mt-1">Por: {act.usuario_nombre}</p>}
                      {act.tipo === "traslado" && act.centro_destino && (
                        <p className="text-xs text-blue-600 mt-1">→ {act.centro_destino}{act.subsede_destino ? ` › ${act.subsede_destino}` : ""}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "km" && (
            <KilometrajePanel equipo={equipo} />
          )}
        </div>
      </div>

      {showActForm && (
        <ActividadForm
          equipo={equipo}
          user={user}
          onClose={() => setShowActForm(false)}
          onSaved={() => {
            setShowActForm(false);
            base44.entities.Actividad.filter({ equipo_id: equipo.id }).then(setActividades);
            onActividadCreada && onActividadCreada();
          }}
        />
      )}
    </div>
  );
}

function KilometrajePanel({ equipo }) {
  const [registros, setRegistros] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fecha: new Date().toISOString().split("T")[0], valor_km: "", conductor: "", observaciones: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Kilometraje.filter({ equipo_id: equipo.id }).then(setRegistros).catch(() => {});
  }, [equipo.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Kilometraje.create({ ...form, equipo_id: equipo.id, valor_km: Number(form.valor_km) });
    const updated = await base44.entities.Kilometraje.filter({ equipo_id: equipo.id });
    setRegistros(updated);
    setShowForm(false);
    setSaving(false);
  };

  const sorted = [...registros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(!showForm)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #1565c0, #0288d1)" }}>
        <Plus className="w-4 h-4 inline mr-2" />Registrar Kilometraje
      </button>
      {showForm && (
        <form onSubmit={handleSave} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Fecha</label>
              <input type="date" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Km Actual</label>
              <input type="number" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.valor_km} onChange={e => setForm(f => ({ ...f, valor_km: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Conductor</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" value={form.conductor} onChange={e => setForm(f => ({ ...f, conductor: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#1565c0" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </form>
      )}
      {sorted.length === 0 ? (
        <p className="text-center text-slate-400 py-8">Sin registros de kilometraje</p>
      ) : sorted.map(r => (
        <div key={r.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-slate-800">{r.valor_km?.toLocaleString()} km</p>
            {r.conductor && <p className="text-xs text-slate-500">Conductor: {r.conductor}</p>}
          </div>
          <span className="text-xs text-slate-400">{r.fecha}</span>
        </div>
      ))}
    </div>
  );
}