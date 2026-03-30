import { differenceInDays, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle, Wrench, Car, Monitor, Activity, Zap } from "lucide-react";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO } from "@/lib/centros";

const TIPO_ICONS = {
  dea: Zap,
  monitor_desfibrilador: Activity,
  ambulancia: Car,
  monitor_multiparametros: Monitor
};

export default function EquipoCard({ equipo, parches, onClick, onEdit }) {
  const hoy = new Date();
  const estado = ESTADOS_EQUIPO.find(e => e.value === equipo.estado) || ESTADOS_EQUIPO[0];
  const tipoLabel = TIPOS_EQUIPO.find(t => t.value === equipo.tipo)?.label || equipo.tipo;
  const Icon = TIPO_ICONS[equipo.tipo] || Monitor;

  const parchesAlerta = parches.filter(p => {
    if (!p.fecha_vencimiento) return false;
    const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy);
    return dias <= 90;
  });

  const batAlerta = equipo.fecha_vencimiento_bateria
    ? differenceInDays(parseISO(equipo.fecha_vencimiento_bateria), hoy) <= 90
    : false;

  const tieneAlerta = parchesAlerta.length > 0 || batAlerta;

  return (
    <div
      className="bg-white rounded-2xl shadow hover:shadow-md transition-all cursor-pointer border border-slate-100 overflow-hidden"
      onClick={onClick}
    >
      <div className="h-2" style={{ background: estado.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
              <Icon className="w-5 h-5" style={{ color: "#1d4ed8" }} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{equipo.marca} {equipo.modelo}</p>
              <p className="text-xs text-slate-400">#{equipo.numero_inventario}</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: estado.color, background: estado.bg }}>
            {estado.label}
          </span>
        </div>

        <div className="space-y-1 mb-3">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            {tipoLabel}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
            {equipo.centro_principal}
            {equipo.subsede && ` › ${equipo.subsede}`}
          </p>
          {equipo.ubicacion_especifica && (
            <p className="text-xs text-slate-400 pl-3">{equipo.ubicacion_especifica}</p>
          )}
          {equipo.patente && (
            <p className="text-xs text-slate-500 font-medium">🚑 {equipo.patente}</p>
          )}
        </div>

        {tieneAlerta && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            {parchesAlerta.length > 0 && `${parchesAlerta.length} parche(s) por vencer`}
            {parchesAlerta.length > 0 && batAlerta && " · "}
            {batAlerta && "Batería por vencer"}
          </div>
        )}
      </div>
    </div>
  );
}