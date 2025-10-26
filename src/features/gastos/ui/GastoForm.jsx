import { useState } from "react";
import { useGastos } from "../logic/useGastos";

export default function GastoForm() {
  const { createGasto } = useGastos();

  const [form, setForm] = useState({
    categoria: "gasolina",
    monto: "",
    nota: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.monto) {
      alert("Poné un monto");
      return;
    }

    createGasto({
      categoria: form.categoria,
      monto: form.monto,
      nota: form.nota,
    });

    alert("💸 Gasto guardado");

    // limpiar
    setForm({
      categoria: "gasolina",
      monto: "",
      nota: "",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-md mt-6 space-y-4"
    >
      <h2 className="text-xl font-bold text-center text-gray-700">
        Registrar Gasto Personal
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoría
        </label>
        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className="border rounded-lg p-2 w-full"
        >
          <option value="gasolina">Gasolina</option>
          <option value="comida">Comida</option>
          <option value="recarga">Recarga</option>
          <option value="mantenimiento">Mantenimiento moto</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto (C$)
        </label>
        <input
          type="number"
          name="monto"
          value={form.monto}
          onChange={handleChange}
          placeholder="Ej: 120"
          className="border rounded-lg p-2 w-full"
        />
      </div>

      <div>
        <textarea
          name="nota"
          value={form.nota}
          onChange={handleChange}
          placeholder="Ej: recarga claro / almuerzo / aceite moto"
          className="border rounded-lg p-2 w-full h-16"
        />
      </div>

      <button
        type="submit"
        className="bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 w-full"
      >
        Guardar Gasto
      </button>
    </form>
  );
}
