// src/features/mandados/ui/ResumenDiaCard.jsx
import { useMemo } from "react";
import { useMandados } from "../logic/useMandados";
import { useGastos } from "../../gastos/logic/useGastos";
import { useAperturaDia } from "../../aperturas/logic/useAperturaDia";
import { getTodayStr } from "../../../utils/date";

function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// Cantidad entera ≥ 1 (soporta "x2", "2 pedidos", etc.)
function getQty(v) {
  if (v == null) return 1;
  if (typeof v === "number") return Math.max(1, Math.floor(v));
  const m = String(v).match(/\d+/);
  const n = m ? Number(m[0]) : 1;
  return Math.max(1, Math.floor(n));
}

export default function ResumenDiaCard() {
  const { mandados } = useMandados();
  const { gastos } = useGastos();
  const hoy = getTodayStr();
  const { apertura } = useAperturaDia(hoy); // sólo caja inicial

  // === Conjuntos base ===

  // Mandados CREADOS hoy (para el contador "hechos hoy" y pendientes del día)
  const mandadosHoy = useMemo(
    () => (mandados || []).filter((m) => m.fecha === hoy),
    [mandados, hoy]
  );

  // Mandados COBRADOS hoy (pagados hoy por fechaPago; fallback: fecha para datos viejos sin fechaPago)
  const cobradosHoy = useMemo(
    () =>
      (mandados || []).filter(
        (m) =>
          m.pagado &&
          ((m.fechaPago && m.fechaPago === hoy) ||
            (!m.fechaPago && m.fecha === hoy))
      ),
    [mandados, hoy]
  );

  // --- Mandados que tienen fechaPago === hoy (marcados como pagados HOY) ---
  // Nos interesa separarlos por si fueron creados hoy o en días anteriores.
  const cobradosConFechaPagoHoy = useMemo(
    () => (mandados || []).filter((m) => m.pagado && m.fechaPago === hoy),
    [mandados, hoy]
  );

  const cobradosHoyDesdeHoy = useMemo(
    () => cobradosConFechaPagoHoy.filter((m) => m.fecha === hoy),
    [cobradosConFechaPagoHoy]
  );

  const cobradosHoyDesdeAntiguos = useMemo(
    () => cobradosConFechaPagoHoy.filter((m) => m.fecha !== hoy),
    [cobradosConFechaPagoHoy]
  );

  // Pendientes del día (solo informativo)
  const pendientesHoy = useMemo(
    () => mandadosHoy.filter((m) => !m.pagado),
    [mandadosHoy]
  );

  // Pendientes globales (lo que se mostrará como "Pendiente cobrar")
  const pendientesGlobal = useMemo(
    () => (mandados || []).filter((m) => !m.pagado),
    [mandados]
  );

  // === Métricas ===

  // Contador de unidades creadas hoy
  const totalMandadosHoy = useMemo(
    () => mandadosHoy.reduce((acc, m) => acc + getQty(m.cantidad), 0),
    [mandadosHoy]
  );

  // ✅ Utilidad PAGADA hoy (usa fechaPago o fallback)
  const utilidadPagada = useMemo(
    () => cobradosHoy.reduce((acc, m) => acc + toNum(m.cobroServicio), 0),
    [cobradosHoy]
  );

  // ✅ Total cobrado HOY (reembolso + fee total) por fechaPago / fallback
  const ingresadoHoy = useMemo(
    () =>
      cobradosHoy.reduce(
        (acc, m) => acc + toNum(m.gastoCompra) + toNum(m.cobroServicio),
        0
      ),
    [cobradosHoy]
  );

  // === Totales específicos por origen de los cobros marcados HOY ===
  const utilidadCobradosHoyDesdeAntiguos = useMemo(
    () =>
      cobradosHoyDesdeAntiguos.reduce(
        (acc, m) => acc + toNum(m.cobroServicio),
        0
      ),
    [cobradosHoyDesdeAntiguos]
  );

  const totalCobradosHoyDesdeAntiguos = useMemo(
    () =>
      cobradosHoyDesdeAntiguos.reduce(
        (acc, m) => acc + toNum(m.gastoCompra) + toNum(m.cobroServicio),
        0
      ),
    [cobradosHoyDesdeAntiguos]
  );

  const utilidadCobradosHoyDesdeHoy = useMemo(
    () => cobradosHoyDesdeHoy.reduce((acc, m) => acc + toNum(m.cobroServicio), 0),
    [cobradosHoyDesdeHoy]
  );

  const totalCobradosHoyDesdeHoy = useMemo(
    () =>
      cobradosHoyDesdeHoy.reduce(
        (acc, m) => acc + toNum(m.gastoCompra) + toNum(m.cobroServicio),
        0
      ),
    [cobradosHoyDesdeHoy]
  );

  // Total combinado: todo lo que hoy se cobró y provenía de pendientes (antiguos + del propio día)
  const utilidadCobradosHoyDesdePendientes = useMemo(
    () => utilidadCobradosHoyDesdeAntiguos + utilidadCobradosHoyDesdeHoy,
    [utilidadCobradosHoyDesdeAntiguos, utilidadCobradosHoyDesdeHoy]
  );

  const totalCobradosHoyDesdePendientes = useMemo(
    () => totalCobradosHoyDesdeAntiguos + totalCobradosHoyDesdeHoy,
    [totalCobradosHoyDesdeAntiguos, totalCobradosHoyDesdeHoy]
  );

  // Pendiente cobrar (UTILIDAD) — GLOBAL
  const pendienteUtilidadGlobal = useMemo(
    () => pendientesGlobal.reduce((acc, m) => acc + toNum(m.cobroServicio), 0),
    [pendientesGlobal]
  );

  // Pendiente del día (UTILIDAD) — informativo
  const pendienteUtilidadHoy = useMemo(
    () => pendientesHoy.reduce((acc, m) => acc + toNum(m.cobroServicio), 0),
    [pendientesHoy]
  );

  // ⚠️ Pendiente cobrar (TOTAL: compra + servicio)
  const pendienteTotalGlobal = useMemo(
    () =>
      pendientesGlobal.reduce(
        (acc, m) => acc + toNum(m.gastoCompra) + toNum(m.cobroServicio),
        0
      ),
    [pendientesGlobal]
  );

  const pendienteTotalHoy = useMemo(
    () =>
      pendientesHoy.reduce(
        (acc, m) => acc + toNum(m.gastoCompra) + toNum(m.cobroServicio),
        0
      ),
    [pendientesHoy]
  );

  // 🟢 Compras de mandados CREADOS hoy (pagados o no)
  const comprasHoy = useMemo(
    () => mandadosHoy.reduce((acc, m) => acc + toNum(m.gastoCompra), 0),
    [mandadosHoy]
  );

  // Gastos del día (gastos personales)
  const gastosHoy = useMemo(
    () => (gastos || []).filter((g) => g.fecha === hoy),
    [gastos, hoy]
  );

  const totalGastado = useMemo(
    () => gastosHoy.reduce((acc, g) => acc + toNum(g.monto), 0),
    [gastosHoy]
  );

  // Restante del día (utilidad pagada HOY - gastos HOY)
  const restante = utilidadPagada - totalGastado;

  // Caja
  const cajaInicial = toNum(apertura?.cajaInicial || 0);

  // ✅ Caja esperada = Caja inicial - compras de HOY + todo lo cobrado HOY - gastos HOY
  const cajaEsperada = cajaInicial - comprasHoy + ingresadoHoy - totalGastado;

  const colorClase = restante >= 0 ? "bg-green-100" : "bg-red-100";
  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  return (
    <div className={`max-w-md mx-auto mt-6 p-5 rounded-2xl shadow-md ${colorClase}`}>
      <h2 className="text-lg font-bold text-gray-800 text-center">
        Resumen del Día ({hoy})
      </h2>

      {!apertura && (
        <p className="mt-2 text-[12px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
          Aún no cargaste la apertura de hoy. Caja inicial se considera C$ 0.00.
        </p>
      )}

      {/* Bloque principal */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Ganado (utilidad pagada)</p>
          <p className="text-lg font-bold text-gray-800">C$ {fmt(utilidadPagada)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Ingresado hoy (info): C$ {fmt(ingresadoHoy)}</p>
        </div>

        {/* TARJETA: Todo lo cobrado HOY que venía de pendientes (desglose) */}
        {/* TARJETA: Todo lo cobrado HOY (Desglosado: Antiguos vs Hoy) */}
        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Cobrado hoy (Total)</p>
          
          {/* 1. El número grande es la SUMA TOTAL (Antiguos + Hoy) */}
          <p className="text-lg font-bold text-emerald-800">
            C$ {fmt(totalCobradosHoyDesdePendientes)}
          </p>
          
          {/* 2. Desglose detallado: Antiguos vs Hoy, cada uno con su Total y Utilidad */}
          <div className="mt-2 flex flex-col gap-1 border-t pt-2">
            
             {/* Fila: Antiguos */}
             <div className="flex justify-between items-center text-[11px]">
               <span className="text-gray-600">📅 Antiguos:</span>
               <span>
                 <span className="font-medium">C$ {fmt(totalCobradosHoyDesdeAntiguos)}</span>
                 <span className="text-emerald-600 ml-1 font-semibold text-[10px]">(Util: {fmt(utilidadCobradosHoyDesdeAntiguos)})</span>
               </span>
             </div>

             {/* Fila: De Hoy */}
             <div className="flex justify-between items-center text-[11px]">
               <span className="text-gray-600">🔵 De hoy:</span>
               <span>
                 <span className="font-medium">C$ {fmt(totalCobradosHoyDesdeHoy)}</span>
                 <span className="text-emerald-600 ml-1 font-semibold text-[10px]">(Util: {fmt(utilidadCobradosHoyDesdeHoy)})</span>
               </span>
             </div>

          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Pendiente cobrar (utilidad)</p>
          <p className="text-lg font-bold text-yellow-600">C$ {fmt(pendienteUtilidadGlobal)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Pendientes de hoy: C$ {fmt(pendienteUtilidadHoy)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Gastos hoy</p>
          <p className="text-lg font-bold text-red-600">C$ {fmt(totalGastado)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Restante del día</p>
          <p className="text-lg font-bold text-gray-800">C$ {fmt(restante)}</p>
        </div>

        {/* Pendiente cobrar (TOTAL) */}
        <div className="bg-white rounded-xl shadow p-3 col-span-2">
          <p className="text-xs text-gray-500 font-medium">Pendiente cobrar (total: compra + servicio)</p>
          <p className="text-lg font-bold text-orange-600">C$ {fmt(pendienteTotalGlobal)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Pendientes de hoy (total): C$ {fmt(pendienteTotalHoy)}</p>
        </div>
      </div>

      {/* Caja inicial + Caja esperada */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Caja inicial</p>
          <p className="text-lg font-bold text-gray-800">C$ {fmt(cajaInicial)}</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <p className="text-xs text-emerald-700 font-medium">Caja esperada</p>
          <p className="text-lg font-bold text-emerald-800">C$ {fmt(cajaEsperada)}</p>
        </div>
      </div>

      <p className="text-center text-gray-600 text-sm mt-4">Mandados hechos hoy: {totalMandadosHoy}</p>
    </div>
  );
}
