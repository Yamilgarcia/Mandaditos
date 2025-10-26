import { useState } from "react";
import { useGastos } from "../logic/useGastos";
import { useToast } from "../../../components/ToastContext"; // ajusta la ruta según tu estructura real

export default function GastoForm() {
  const { createGasto } = useGastos();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    categoria: "gasolina",
    monto: "",
    nota: "",
  });

  const [errors, setErrors] = useState({
    categoria: "",
    monto: "",
    nota: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // limpiar error en ese campo mientras escribe
  }

  function validate() {
    const newErrors = {
      categoria: "",
      monto: "",
      nota: "",
    };

    // categoría
    if (!form.categoria || form.categoria.trim() === "") {
      newErrors.categoria = "Seleccioná una categoría";
    }

    // monto
    if (!form.monto || form.monto.trim() === "") {
      newErrors.monto = "El monto es obligatorio";
    } else {
      const num = Number(form.monto);
      if (Number.isNaN(num)) {
        newErrors.monto = "El monto debe ser un número";
      } else if (num <= 0) {
        newErrors.monto = "El monto debe ser mayor que 0";
      }
    }

    // nota (opcional pero controlada)
    if (form.nota && form.nota.length > 120) {
      newErrors.nota = "Máximo 120 caracteres";
    }

    setErrors(newErrors);

    // ¿hay algún error?
    const hasError =
      newErrors.categoria || newErrors.monto || newErrors.nota;

    return !hasError;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      showToast("⚠️ Revisá los campos marcados", "error");
      return;
    }

    // guardar
    createGasto({
      categoria: form.categoria,
      monto: form.monto,
      nota: form.nota,
    });

    // feedback al usuario
    if (!navigator.onLine) {
      showToast(
        "📦 Guardado offline. Se subirá cuando tengas internet.",
        "info"
      );
    } else {
      showToast("💸 Gasto guardado correctamente", "success");
    }

    // limpiar
    setForm({
      categoria: "gasolina",
      monto: "",
      nota: "",
    });
    setErrors({
      categoria: "",
      monto: "",
      nota: "",
    });
  }

  // estilos helper para inputs con/ sin error
  function inputClass(base, hasError) {
    return (
      base +
      " " +
      (hasError
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 focus:ring-purple-400")
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-md mt-6 space-y-4 border border-white/30 text-gray-800"
    >
      <h2 className="text-xl font-bold text-center text-gray-700">
        Registrar Gasto Personal
      </h2>

      {/* CATEGORÍA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoría <span className="text-red-500">*</span>
        </label>

        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className={inputClass(
            "rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white",
            !!errors.categoria
          )}
        >
          <option value="gasolina">Gasolina</option>
          <option value="comida">Comida</option>
          <option value="recarga">Recarga</option>
          <option value="mantenimiento">Mantenimiento moto</option>
          <option value="otro">Otro</option>
        </select>

        {errors.categoria && (
          <p className="text-xs text-red-500 mt-1">{errors.categoria}</p>
        )}
      </div>

      {/* MONTO */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto (C$) <span className="text-red-500">*</span>
        </label>

        <input
          type="number"
          name="monto"
          value={form.monto}
          onChange={handleChange}
          placeholder="Ej: 120"
          className={inputClass(
            "rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white",
            !!errors.monto
          )}
        />

        {errors.monto && (
          <p className="text-xs text-red-500 mt-1">{errors.monto}</p>
        )}
      </div>

      {/* NOTA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nota / Detalle <span className="text-gray-400 text-xs">(opcional)</span>
        </label>

        <textarea
          name="nota"
          value={form.nota}
          onChange={handleChange}
          placeholder="Ej: gasolina / almuerzo / aceite moto"
          className={inputClass(
            "rounded-lg p-2 w-full h-16 border focus:outline-none focus:ring-2 bg-white resize-none",
            !!errors.nota
          )}
          maxLength={200} // hard limit extra de seguridad
        />

        <div className="flex justify-between">
          {errors.nota ? (
            <p className="text-xs text-red-500 mt-1">{errors.nota}</p>
          ) : (
            <p className="text-[11px] text-gray-500 mt-1">
              Máx 120 caracteres útiles
            </p>
          )}
          <p className="text-[11px] text-gray-400 mt-1">
            {form.nota.length}/200
          </p>
        </div>
      </div>

      {/* BOTÓN */}
      <button
        type="submit"
        className="bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 active:scale-[.98] transition-all w-full shadow"
      >
        Guardar Gasto
      </button>

      {/* Mensaje de estado conexión */}
      {!navigator.onLine && (
        <p className="text-[11px] text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center">
          Estás sin internet. Guardaremos todo local y lo subimos cuando vuelvas
          a tener señal 📶
        </p>
      )}
    </form>
  );
}
