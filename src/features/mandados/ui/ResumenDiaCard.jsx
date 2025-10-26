import { useMandados } from "../logic/useMandados";
import { useGastos } from "../../gastos/logic/useGastos";
import { getTodayStr } from "../../../utils/date";

export default function ResumenDiaCard() {
  const { mandados } = useMandados();
  const { gastos } = useGastos();
  const hoy = getTodayStr();

  // Mandados de HOY
  const mandadosHoy = mandados.filter((m) => m.fecha === hoy);

  const totalGanado = mandadosHoy
    .filter((m) => m.pagado)
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const totalPendiente = mandadosHoy
    .filter((m) => !m.pagado)
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  // Gastos de HOY
  const gastosHoy = gastos.filter((g) => g.fecha === hoy);
  const totalGastado = gastosHoy.reduce(
    (acc, g) => acc + Number(g.monto || 0),
    0
  );

  // Lo que te queda limpio hoy
  const restante = totalGanado - totalGastado;

  // Color de la card según si quedaste positivo o negativo
  const colorClase =
    restante >= 0 ? "bg-green-100" : "bg-red-100";

  return (
    <div
      className={`max-w-md mx-auto mt-6 p-5 rounded-2xl shadow-md ${colorClase}`}
    >
      <h2 className="text-lg font-bold text-gray-800 text-center">
        Resumen del Día ({hoy})
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Ganado (pagado)</p>
          <p className="text-lg font-bold text-gray-800">
            C$ {totalGanado}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Pendiente cobrar</p>
          <p className="text-lg font-bold text-yellow-600">
            C$ {totalPendiente}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">Gastos hoy</p>
          <p className="text-lg font-bold text-red-600">
            C$ {totalGastado}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-3">
          <p className="text-xs text-gray-500 font-medium">
            Restante del día
          </p>
          <p className="text-lg font-bold text-gray-800">
            C$ {restante}
          </p>
        </div>
      </div>

      <p className="text-center text-gray-600 text-sm mt-4">
        Mandados hechos hoy: {mandadosHoy.length}
      </p>
    </div>
  );
}
