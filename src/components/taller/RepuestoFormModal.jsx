import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Package } from "lucide-react";

const CATEGORIAS = [
  { value: "neumaticos", label: "Neumáticos" },
  { value: "frenos", label: "Frenos" },
  { value: "bateria", label: "Batería" },
  { value: "filtros", label: "Filtros" },
  { value: "lubricantes", label: "Lubricantes" },
  { value: "electrico", label: "Eléctrico" },
  { value: "sirena", label: "Sirena" },
  { value: "luces", label: "Luces" },
  { value: "otros", label: "Otros" },
];

export default function RepuestoFormModal({ open, onClose, onGuardar, editando, proveedores }) {
  const [form, setForm] = useState({
    codigo: "", nombre: "", categoria: "otros", marca_modelo_compat: "",
    stock_actual: 0, stock_minimo: 0, precio_unitario: 0,
    proveedor_id: "", proveedor_nombre: "", ubicacion_bodega: "", notas: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editando) {
      setForm({
        codigo: editando.codigo || "", nombre: editando.nombre || "",
        categoria: editando.categoria || "otros", marca_modelo_compat: editando.marca_modelo_compat || "",
        stock_actual: editando.stock_actual || 0, stock_minimo: editando.stock_minimo || 0,
        precio_unitario: editando.precio_unitario || 0,
        proveedor_id: editando.proveedor_id || "", proveedor_nombre: editando.proveedor_nombre || "",
        ubicacion_bodega: editando.ubicacion_bodega || "", notas: editando.notas || "",
      });
    } else {
      setForm({ codigo: "", nombre: "", categoria: "otros", marca_modelo_compat: "", stock_actual: 0, stock_minimo: 0, precio_unitario: 0, proveedor_id: "", proveedor_nombre: "", ubicacion_bodega: "", notas: "" });
    }
    setError("");
  }, [editando, open]);

  if (!open) return null;

  const handleProveedor = (id) => {
    const p = proveedores.find(x => x.id === id);
    setForm(f => ({ ...f, proveedor_id: id, proveedor_nombre: p?.nombre || "" }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        precio_unitario: Number(form.precio_unitario) || 0,
      };
      if (editando) {
        await base44.entities.Repuesto.update(editando.id, data);
      } else {
        await base44.entities.Repuesto.create(data);
      }
      onGuardar();
      onClose();
    } catch (e) {
      setError(e.message || "Error al guardar");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {editando ? "Editar Repuesto" : "Nuevo Repuesto"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Código</label>
              <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Ej: R-001" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Categoría</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nombre *</label>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Repuesto descriptivo" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Marca / Modelo Compatible</label>
            <input value={form.marca_modelo_compat} onChange={e => setForm(f => ({ ...f, marca_modelo_compat: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Ej: Toyota Hilux 2018" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Stock Actual</label>
              <input type="number" value={form.stock_actual} onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Stock Mínimo</label>
              <input type="number" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Precio Unit.</label>
              <input type="number" value={form.precio_unitario} onChange={e => setForm(f => ({ ...f, precio_unitario: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Proveedor</label>
            <select value={form.proveedor_id} onChange={e => handleProveedor(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
              <option value="">Sin proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ubicación en Bodega</label>
            <input value={form.ubicacion_bodega} onChange={e => setForm(f => ({ ...f, ubicacion_bodega: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Ej: Estante A-3" />
          </div>
          {error && <div className="text-xs text-red-600 font-semibold bg-red-50 rounded-xl px-3 py-2">{error}</div>}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "#2563EB" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}