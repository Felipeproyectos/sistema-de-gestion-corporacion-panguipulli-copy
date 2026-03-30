export const CENTROS_ESTRUCTURA = [
  {
    nombre: "CESFAM Panguipulli",
    subsedes: ["Posta Bocatoma", "Posta Cayumapu", "Posta Melefquén", "Posta Huitar", "SAR Panguipulli"]
  },
  {
    nombre: "CESFAM Coñaripe",
    subsedes: ["EMR Pucura", "CECOSF Liquiñe"]
  },
  {
    nombre: "CESFAM Choshuenco",
    subsedes: ["CECOSF Neltume", "CCR Neltume", "Posta Lago Neltume", "EMR Puerto Fuy", "Posta Pirehueico"]
  },
  {
    nombre: "Corporación Municipal de Panguipulli",
    subsedes: []
  }
];

export const TIPOS_EQUIPO = [
  { value: "dea", label: "DEA" },
  { value: "monitor_desfibrilador", label: "Monitor Desfibrilador" },
  { value: "ambulancia", label: "Ambulancia" },
  { value: "monitor_multiparametros", label: "Monitor Multiparámetros" }
];

export const TIPOS_ACTIVIDAD = [
  { value: "cambio_parches", label: "Cambio de Parches" },
  { value: "mantenimiento_preventivo", label: "Mantenimiento Preventivo" },
  { value: "mantenimiento_correctivo", label: "Mantenimiento Correctivo" },
  { value: "error_calibracion", label: "Error de Calibración" },
  { value: "inspeccion", label: "Inspección" },
  { value: "traslado", label: "Traslado" }
];

export const TIPOS_SOLICITUD = [
  { value: "compra_repuestos", label: "Compra de Repuestos" },
  { value: "cambio_parches", label: "Cambio de Parches" },
  { value: "mantenimiento_preventivo", label: "Mantenimiento Preventivo" },
  { value: "mantenimiento_correctivo", label: "Mantenimiento Correctivo" },
  { value: "revision_tecnica", label: "Revisión Técnica" },
  { value: "otros", label: "Otros" }
];

export const ESTADOS_EQUIPO = [
  { value: "operativo", label: "Operativo", color: "#16a34a", bg: "#f0fdf4" },
  { value: "mantenimiento", label: "En Mantenimiento", color: "#d97706", bg: "#fffbeb" },
  { value: "fuera_de_servicio", label: "Fuera de Servicio", color: "#dc2626", bg: "#fef2f2" }
];