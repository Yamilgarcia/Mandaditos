import { useMandados } from "../logic/useMandados";
import { useState } from "react";

export default function PendientesList() {
  const { mandados, markAsPaid } = useMandados();
  const [seleccionPago, setSeleccionPago] = useState({}); 
  // guarda temporalmente qué método de pago se eligió para cada pendiente

  const pendientes = mandados.filter((m) => !m.pagado);

  if (pendientes.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-6">
        No tenés pagos pendientes 🎉
      </p>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-6 space-y-3">
      {pendientes.map((m) => (
        <div
          key={m.id}
          className="p-4 rounded-xl shadow-md bg-yellow-50 border border-yellow-200"
        >
          <div className="flex justify-between">
            <h3 className="font-semibold text-gray-800">{m.clienteNombre}</h3>
            <span className="text-sm text-gray-500">{m.fecha}</span>
          </div>

          <p className="text-gray-600">{m.descripcion}</p>

          <p className="text-gray-800 font-medium mt-1">
            Te debe: C$ {m.monto}
          </p>

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ¿Cómo te pagó?
            </label>
            <select
              className="border rounded-lg p-2 w-full bg-white"
              value={seleccionPago[m.id] || "efectivo"}
              onChange={(e) =>
                setSeleccionPago({
                  ...seleccionPago,
                  [m.id]: e.target.value,
                })
              }
            >
              <option value="efectivo">Efectivo 💵</option>
              <option value="transferencia">Transferencia 📲</option>
            </select>
          </div>

          <button
            className="mt-3 w-full bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 active:scale-[.98]"
            onClick={() => {
              const metodo = seleccionPago[m.id] || "efectivo";
              markAsPaid(m.id, metodo);
              alert("✅ Marcado como pagado");
            }}
          >
            Marcar como Pagado
          </button>
        </div>
      ))}
    </div>
  );
}
