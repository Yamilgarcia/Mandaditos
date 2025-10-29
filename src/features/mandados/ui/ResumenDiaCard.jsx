import { useMemo } from "react";
import { useMandados } from "../logic/useMandados";
import { useGastos } from "../../gastos/logic/useGastos";
import { useAperturaDia } from "../../aperturas/logic/useAperturaDia";
import { getTodayStr } from "../../../utils/date";

function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}


// Asegura una cantidad entera ≥ 1 aunque venga como "x2", "2 pedidos", etc.
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
  const { apertura } = useAperturaDia(hoy); // apertura del día (solo caja)

  // Mandados de HOY
  const mandadosHoy = useMemo(
    () => (mandados || []).filter((m) => m.fecha === hoy),
    [mandados, hoy]
  );

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

  // Utilidad pagada hoy (tu ganancia real)
  const utilidadPagada = useMemo(
    () => pagadosHoy.reduce((acc, m) => acc + toNum(m.cobroServicio), 0),
    [pagadosHoy]
  );

  // Ingresado hoy (totalCobrar de los pagados = gastoCompra + cobroServicio)
  const ingresadoHoy = useMemo(
    () =>
      pagadosHoy.reduce(
        (acc, m) =>
          acc +
          (m.totalCobrar !== undefined
            ? toNum(m.totalCobrar)
            : toNum(m.gastoCompra) + toNum(m.cobroServicio)),
        0
      ),
    [pagadosHoy]
  );

  // Pendiente por cobrar (totalCobrar de los pendientes)
  const totalPendiente = useMemo(
    () =>
      pendientesHoy.reduce(
        (acc, m) =>
          acc +
          (m.totalCobrar !== undefined
            ? toNum(m.totalCobrar)
            : toNum(m.gastoCompra) + toNum(m.cobroServicio)),
        0
      ),
    [pendientesHoy]
  );

  // Gastos de HOY (módulo de gastos)
  const gastosHoy = useMemo(
    () => (gastos || []).filter((g) => g.fecha === hoy),
    [gastos, hoy]
  );
  const totalGastado = useMemo(
    () => gastosHoy.reduce((acc, g) => acc + toNum(g.monto), 0),
    [gastosHoy]
  );

  // Lo que te queda limpio hoy (utilidad - otros gastos)
  const restante = utilidadPagada - totalGastado;

  // Agregados de flujo (con tus campos cajaDelta / porCobrar)
  const { cajaDelta, porCobrarDia } = useMemo(() => {
    let cD = 0, pC = 0;
    for (const m of mandadosHoy) {
      cD += toNum(m.cajaDelta);
      pC += toNum(m.porCobrar);
    }
    return { cajaDelta: cD, porCobrarDia: pC };
  }, [mandadosHoy]);

  // Apertura (si no hay, toma 0)
  const cajaInicial = toNum(apertura?.cajaInicial || 0);

  // Saldo esperado al momento (apertura + movimientos del día)
  const cajaEsperada = cajaInicial + cajaDelta;

  // Color de la card según si quedaste positivo o negativo (tu criterio original)
  const colorClase = restante >= 0 ? "bg-green-100" : "bg-red-100";

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  return (
    <div className={`max-w-md mx-auto mt-6 p-5 rounded-2xl shadow-md ${colorClase}`}>
      <h2 className="text-lg font-bold text-gray-800 text-center">
        Resumen del Día ({hoy})
      </h2>

      {/* Aviso suave si no hay apertura cargada (no bloquea nada) */}
      {!apertura && (
        <p className="mt-2 text-[12px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
          Aún no cargaste la apertura de hoy. Caja inicial se considera C$ 0.00.
        </p>
      )}

      {/* Bloque superior: tus métricas originales */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Ganado (utilidad pagada)</p>
          <p className="text-lg font-bold text-gray-800">C$ {fmt(utilidadPagada)}</p>
          <p className="text-[11px] text-gray-500 mt-1">
            Ingresado hoy: C$ {fmt(ingresadoHoy)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Pendiente cobrar</p>
          <p className="text-lg font-bold text-yellow-600">C$ {fmt(totalPendiente)}</p>
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

      {/* Nueva sección: Apertura + Movimientos + Saldo esperado */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Apertura */}
        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Caja inicial</p>
          <p className="text-lg font-bold text-gray-800">C$ {fmt(cajaInicial)}</p>
        </div>

        {/* Movimientos del día (Δ) */}
        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Δ Caja (movimientos)</p>
          <p className="text-lg font-bold text-gray-800">C$ {fmt(cajaDelta)}</p>
        </div>

        {/* Estado esperado ahora */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 col-span-2">
          <p className="text-xs text-emerald-700 font-medium">Caja esperada</p>
          <p className="text-lg font-bold text-emerald-800">C$ {fmt(cajaEsperada)}</p>
        </div>
      </div>

      <p className="text-center text-gray-600 text-sm mt-4">
        Mandados hechos hoy: {totalMandadosHoy} · Por cobrar del día (según mandados): C$ {fmt(porCobrarDia)}
      </p>
    </div>
  );
}
