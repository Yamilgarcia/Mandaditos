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

  // Mandados HOY
  const mandadosHoy = useMemo(
    () => (mandados || []).filter((m) => m.fecha === hoy),
    [mandados, hoy]
  );

  // Contador de unidades (si te interesa)
  const totalMandadosHoy = useMemo(
    () => mandadosHoy.reduce((acc, m) => acc + getQty(m.cantidad), 0),
    [mandadosHoy]
  );

  const pagadosHoy = useMemo(
    () => mandadosHoy.filter((m) => m.pagado),
    [mandadosHoy]
  );

  const pendientesHoy = useMemo(
    () => mandadosHoy.filter((m) => !m.pagado),
    [mandadosHoy]
  );

  // === MÉTRICAS (cobroServicio ya es TOTAL, SIN multiplicar) ===

  // ✅ Utilidad pagada
  const utilidadPagada = useMemo(
    () => pagadosHoy.reduce((acc, m) => acc + toNum(m.cobroServicio), 0),
    [pagadosHoy]
  );

  // Informativo: total cobrado hoy (compra + fee TOTAL)
  const ingresadoHoy = useMemo(
    () =>
      pagadosHoy.reduce(
        (acc, m) => acc + toNum(m.gastoCompra) + toNum(m.cobroServicio),
        0
      ),
    [pagadosHoy]
  );

  // Pendiente (como UTILIDAD total de los pendientes)
  const pendienteUtilidad = useMemo(
    () => pendientesHoy.reduce((acc, m) => acc + toNum(m.cobroServicio), 0),
    [pendientesHoy]
  );

  // Gastos del día
  const gastosHoy = useMemo(
    () => (gastos || []).filter((g) => g.fecha === hoy),
    [gastos, hoy]
  );

  const totalGastado = useMemo(
    () => gastosHoy.reduce((acc, g) => acc + toNum(g.monto), 0),
    [gastosHoy]
  );

  // Restante del día (utilidad - otros gastos)
  const restante = utilidadPagada - totalGastado;

  // Caja
  const cajaInicial = toNum(apertura?.cajaInicial || 0);

  // ✅ Caja esperada = Caja inicial + Utilidad pagada
  const cajaEsperada = cajaInicial + (utilidadPagada - totalGastado);


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
          <p className="text-[11px] text-gray-500 mt-1">
            Ingresado hoy (info): C$ {fmt(ingresadoHoy)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Pendiente cobrar (utilidad)</p>
          <p className="text-lg font-bold text-yellow-600">C$ {fmt(pendienteUtilidad)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Gastos hoy</p>
          <p className="text-lg font-bold text-red-600">C$ {fmt(totalGastado)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Restante del día</p>
          <p className="text-lg font-bold text-gray-800">C$ {fmt(restante)}</p>
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

      <p className="text-center text-gray-600 text-sm mt-4">
        Mandados hechos hoy: {totalMandadosHoy}
      </p>
    </div>
  );
}
