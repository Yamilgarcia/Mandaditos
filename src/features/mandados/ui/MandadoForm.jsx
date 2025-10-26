import { useState } from "react";
import { getTodayStr, getTimeStr } from "../../../utils/date";
import { useMandados } from "../logic/useMandados";

export default function MandadoForm() {
  const { createMandado } = useMandados();
  const [form, setForm] = useState({
    fecha: getTodayStr(),
    hora: getTimeStr(),
    clienteNombre: "",
    descripcion: "",
    monto: "",
    metodoPago: "efectivo",
    notas: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pagado = form.metodoPago !== "pendiente";
    const mandado = { ...form, pagado };

    createMandado(mandado);
    alert(pagado
      ? "✅ Mandado guardado correctamente."
      : "⚠ Mandado guardado como PENDIENTE de pago.");

    setForm({
      fecha: getTodayStr(),
      hora: getTimeStr(),
      clienteNombre: "",
      descripcion: "",
      monto: "",
      metodoPago: "efectivo",
      notas: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-md mt-6 space-y-4"
    >
      <h2 className="text-xl font-bold text-center text-gray-700">
        Registrar Mandado
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          name="fecha"
          value={form.fecha}
          onChange={handleChange}
          className="border rounded-lg p-2 w-full"
        />
        <input
          type="time"
          name="hora"
          value={form.hora}
          onChange={handleChange}
          className="border rounded-lg p-2 w-full"
        />
      </div>

      <input
        type="text"
        name="clienteNombre"
        placeholder="Cliente o persona"
        value={form.clienteNombre}
        onChange={handleChange}
        className="border rounded-lg p-2 w-full"
      />

      <textarea
        name="descripcion"
        placeholder="Descripción del mandado"
        value={form.descripcion}
        onChange={handleChange}
        className="border rounded-lg p-2 w-full h-20"
      />

      <input
        type="number"
        name="monto"
        placeholder="Precio (C$)"
        value={form.monto}
        onChange={handleChange}
        className="border rounded-lg p-2 w-full"
      />

      <div className="flex gap-2">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="metodoPago"
            value="efectivo"
            checked={form.metodoPago === "efectivo"}
            onChange={handleChange}
          />
          Efectivo
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="metodoPago"
            value="transferencia"
            checked={form.metodoPago === "transferencia"}
            onChange={handleChange}
          />
          Transferencia
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="metodoPago"
            value="pendiente"
            checked={form.metodoPago === "pendiente"}
            onChange={handleChange}
          />
          Pendiente
        </label>
      </div>

      <textarea
        name="notas"
        placeholder="Notas (opcional)"
        value={form.notas}
        onChange={handleChange}
        className="border rounded-lg p-2 w-full h-16"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 w-full"
      >
        Guardar Mandado
      </button>
    </form>
  );
}
