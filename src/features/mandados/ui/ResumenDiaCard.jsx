import { useMandados } from "../logic/useMandados";
import { useGastos } from "../../gastos/logic/useGastos";
import { getTodayStr } from "../../../utils/date";

function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export default function ResumenDiaCard() {
  const { mandados } = useMandados();
  const { gastos } = useGastos();
  const hoy = getTodayStr();

  // Mandados de HOY
  const mandadosHoy = mandados.filter((m) => m.fecha === hoy);

  const pagadosHoy = mandadosHoy.filter((m) => m.pagado);
  const pendientesHoy = mandadosHoy.filter((m) => !m.pagado);

  // Utilidad pagada hoy (tu ganancia real)
  const utilidadPagada = pagadosHoy.reduce(
    (acc, m) => acc + toNum(m.cobroServicio),
    0
  );

  // Ingresado hoy (totalCobrar de los pagados = gastoCompra + cobroServicio)
  const ingresadoHoy = pagadosHoy.reduce(
    (acc, m) =>
      acc +
      (m.totalCobrar !== undefined
        ? toNum(m.totalCobrar)
        : toNum(m.gastoCompra) + toNum(m.cobroServicio)),
    0
  );

  // Pendiente por cobrar (totalCobrar de los pendientes)
  const totalPendiente = pendientesHoy.reduce(
    (acc, m) =>
      acc +
      (m.totalCobrar !== undefined
        ? toNum(m.totalCobrar)
        : toNum(m.gastoCompra) + toNum(m.cobroServicio)),
    0
  );

  // Gastos de HOY (módulo de gastos)
  const gastosHoy = gastos.filter((g) => g.fecha === hoy);
  const totalGastado = gastosHoy.reduce((acc, g) => acc + toNum(g.monto), 0);

  // Lo que te queda limpio hoy (utilidad - otros gastos)
  const restante = utilidadPagada - totalGastado;

  // Color de la card según si quedaste positivo o negativo
  const colorClase = restante >= 0 ? "bg-green-100" : "bg-red-100";

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  return (
    <div className={`max-w-md mx-auto mt-6 p-5 rounded-2xl shadow-md ${colorClase}`}>
      <h2 className="text-lg font-bold text-gray-800 text-center">
        Resumen del Día ({hoy})
      </h2>

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

      <p className="text-center text-gray-600 text-sm mt-4">
        Mandados hechos hoy: {mandadosHoy.length}
      </p>
    </div>
  );
}
