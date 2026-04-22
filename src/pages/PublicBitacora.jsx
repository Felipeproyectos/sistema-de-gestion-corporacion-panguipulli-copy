import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Car, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

export default function PublicBitacora() {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({
    equipo_id: "",
    conductor: "",
    fecha: new Date().toISOString().split("T")[0],
    km_inicial: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("getPublicAmbulances", {})
      .then(res => setEquipos(res.data?.equipos || []))
      .catch(() => setError("No se pudieron cargar los equipos. Intenta recargar la página."));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.equipo_id || !form.conductor || !form.km_inicial) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await base44.functions.invoke("submitPublicBitacora", {
      ...form,
      km_inicial: Number(form.km_inicial),
      valor_km: Number(form.km_inicial),
    });
    setSaving(false);
    if (res.data?.ok) {
      setSuccess(true);
      setForm({ equipo_id: "", conductor: "", fecha: new Date().toISOString().split("T")[0], km_inicial: "", observaciones: "" });
    } else {
      setError("Ocurrió un error al guardar. Por favor intenta de nuevo.");
    }
  };

  const equipo = equipos.find(e => e.id === form.equipo_id);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 60%, #29b6f6 100%)" }}>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Bitácora de Conductores</h1>
          <p className="text-blue-200 mt-2 text-sm">Registro de asignación y kilometraje de ambulancias</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "#DCFCE7" }}>
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">¡Registro guardado!</h2>
              <p className="text-slate-500 text-sm">El registro fue guardado correctamente en el sistema.</p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#2563EB" }}>
                Registrar otro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Ambulancia */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                  Ambulancia *
                </label>
                <select
                  required
                  value={form.equipo_id}
                  onChange={e => setForm(f => ({ ...f, equipo_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50">
                  <option value="">Selecciona una ambulancia...</option>
                  {equipos.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.marca} {eq.modelo}{eq.patente ? ` — ${eq.patente}` : ""} ({eq.centro_principal})
                    </option>
                  ))}
                </select>
                {equipo && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {equipo.centro_principal}{equipo.subsede ? ` · ${equipo.subsede}` : ""}
                  </p>
                )}
              </div>

              {/* Conductor */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                  Nombre del conductor *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={form.conductor}
                  onChange={e => setForm(f => ({ ...f, conductor: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50" />
              </div>

              {/* Fecha y KM en fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                    Fecha *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                    KM Inicial *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ej: 45230"
                    value={form.km_inicial}
                    onChange={e => setForm(f => ({ ...f, km_inicial: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50" />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">
                  Observaciones (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Algún detalle adicional del turno..."
                  value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50 resize-none" />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Registrar en Bitácora"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-6 opacity-70">
          Sistema de Gestión de Equipos Médicos
        </p>
      </div>
    </div>
  );
}