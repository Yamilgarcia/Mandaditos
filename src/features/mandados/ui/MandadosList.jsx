import { useMandados } from "../logic/useMandados";

export default function MandadosList() {
  const { mandados } = useMandados();

  if (mandados.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-6">
        No hay mandados registrados aún.
      </p>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-6 space-y-3">
      {mandados.map((m, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl shadow-md ${
            m.pagado ? "bg-green-50" : "bg-yellow-50"
          }`}
        >
          <div className="flex justify-between">
            <h3 className="font-semibold text-gray-800">{m.clienteNombre}</h3>
            <span className="text-sm text-gray-500">{m.fecha}</span>
          </div>

          <p className="text-gray-600">{m.descripcion}</p>

          <p className="text-gray-800 font-medium mt-1">
            C$ {m.monto}
          </p>

          <p
            className={`text-sm ${
              m.pagado ? "text-green-700" : "text-yellow-700"
            }`}
          >
            {m.metodoPago === "pendiente"
              ? "💸 Pendiente de pago"
              : `✅ Pagado por ${m.metodoPago}`}
          </p>
        </div>
      ))}
    </div>
  );
}
