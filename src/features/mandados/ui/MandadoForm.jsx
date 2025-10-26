import { useState } from "react";
import { getTodayStr, getTimeStr } from "../../../utils/date";
import { useMandados } from "../logic/useMandados";
import { useToast } from "../../../components/ToastContext"; // ajustá ruta si tu ToastContext vive en otro lado

export default function MandadoForm() {
  const { createMandado } = useMandados();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    fecha: getTodayStr(),
    hora: getTimeStr(),
    clienteNombre: "",
    descripcion: "",
    monto: "",
    metodoPago: "efectivo",
    notas: "",
  });

  // errores por campo
  const [errors, setErrors] = useState({
    fecha: "",
    hora: "",
    clienteNombre: "",
    descripcion: "",
    monto: "",
    metodoPago: "",
    notas: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // limpiar error mientras escribe
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const newErrors = {
      fecha: "",
      hora: "",
      clienteNombre: "",
      descripcion: "",
      monto: "",
      metodoPago: "",
      notas: "",
    };

    // fecha
    if (!form.fecha || form.fecha.trim() === "") {
      newErrors.fecha = "La fecha es obligatoria";
    }

    // hora
    if (!form.hora || form.hora.trim() === "") {
      newErrors.hora = "La hora es obligatoria";
    }

    // cliente
    if (!form.clienteNombre || form.clienteNombre.trim() === "") {
      newErrors.clienteNombre = "Poné el nombre del cliente";
    }

    // descripción
    if (!form.descripcion || form.descripcion.trim() === "") {
      newErrors.descripcion = "Describí el mandado";
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

    // método de pago
    if (
      !form.metodoPago ||
      !["efectivo", "transferencia", "pendiente"].includes(form.metodoPago)
    ) {
      newErrors.metodoPago = "Seleccioná método de pago";
    }

    // notas (opcional pero limitada)
    if (form.notas && form.notas.length > 120) {
      newErrors.notas = "Máximo 120 caracteres";
    }

    setErrors(newErrors);

    const hasError =
      newErrors.fecha ||
      newErrors.hora ||
      newErrors.clienteNombre ||
      newErrors.descripcion ||
      newErrors.monto ||
      newErrors.metodoPago ||
      newErrors.notas;

    return !hasError;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      showToast("⚠️ Revisá los campos marcados", "error");
      return;
    }

    const pagado = form.metodoPago !== "pendiente";
    const mandado = { ...form, pagado };

    createMandado(mandado);

    // Mensaje según estado de pago + conexión
    if (!navigator.onLine) {
      if (pagado) {
        showToast(
          "📦 Guardado offline como PAGADO. Se sube cuando haya internet.",
          "info"
        );
      } else {
        showToast(
          "📦 Guardado offline como PENDIENTE. Se sube cuando haya internet.",
          "info"
        );
      }
    } else {
      if (pagado) {
        showToast(" Mandado guardado (pagado)", "success");
      } else {
        showToast("💸 Mandado creado como PENDIENTE de pago", "info");
      }
    }

    // reset form
    setForm({
      fecha: getTodayStr(),
      hora: getTimeStr(),
      clienteNombre: "",
      descripcion: "",
      monto: "",
      metodoPago: "efectivo",
      notas: "",
    });

    // limpiar errores visuales
    setErrors({
      fecha: "",
      hora: "",
      clienteNombre: "",
      descripcion: "",
      monto: "",
      metodoPago: "",
      notas: "",
    });
  }

  // helper para clases de inputs con error/ok
  function inputClass(base, hasError) {
    return (
      base +
      " " +
      (hasError
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 focus:ring-blue-400")
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-md mt-6 space-y-4 border border-white/30 text-gray-800"
    >
      <h2 className="text-xl font-bold text-center text-gray-700">
        Registrar Mandado
      </h2>

      {/* Fecha / Hora */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className={inputClass(
              "rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white",
              !!errors.fecha
            )}
          />
          {errors.fecha && (
            <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>
          )}
        </div>

        <div className="flex flex-col">
          <input
            type="time"
            name="hora"
            value={form.hora}
            onChange={handleChange}
            className={inputClass(
              "rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white",
              !!errors.hora
            )}
          />
          {errors.hora && (
            <p className="text-xs text-red-500 mt-1">{errors.hora}</p>
          )}
        </div>
      </div>

      {/* Cliente */}
      <div className="flex flex-col">
        <input
          type="text"
          name="clienteNombre"
          placeholder="Cliente o persona"
          value={form.clienteNombre}
          onChange={handleChange}
          className={inputClass(
            "rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white",
            !!errors.clienteNombre
          )}
        />
        {errors.clienteNombre ? (
          <p className="text-xs text-red-500 mt-1">{errors.clienteNombre}</p>
        ) : (
          <p className="text-[11px] text-gray-500 mt-1">
        
          </p>
        )}
      </div>

      {/* Descripción */}
      <div className="flex flex-col">
        <textarea
          name="descripcion"
          placeholder="Descripción del mandado"
          value={form.descripcion}
          onChange={handleChange}
          className={inputClass(
            "rounded-lg p-2 w-full h-20 border focus:outline-none focus:ring-2 bg-white resize-none",
            !!errors.descripcion
          )}
        />
        {errors.descripcion && (
          <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>
        )}
      </div>

      {/* Monto */}
      <div className="flex flex-col">
        <input
          type="number"
          name="monto"
          placeholder="Precio (C$)"
          value={form.monto}
          onChange={handleChange}
          className={inputClass(
            "rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white",
            !!errors.monto
          )}
        />
        {errors.monto && (
          <p className="text-xs text-red-500 mt-1">{errors.monto}</p>
        )}
      </div>

      {/* Método de pago */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 mb-1">
          Método de pago <span className="text-red-500">*</span>
        </span>

        <div
          className={
            "flex flex-wrap gap-3 rounded-lg p-2 border " +
            (errors.metodoPago
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300")
          }
        >
          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input
              type="radio"
              name="metodoPago"
              value="efectivo"
              checked={form.metodoPago === "efectivo"}
              onChange={handleChange}
            />
            Efectivo
          </label>

          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input
              type="radio"
              name="metodoPago"
              value="transferencia"
              checked={form.metodoPago === "transferencia"}
              onChange={handleChange}
            />
            Transferencia
          </label>

          <label className="flex items-center gap-1 text-sm text-gray-700">
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

        {errors.metodoPago && (
          <p className="text-xs text-red-500 mt-1">{errors.metodoPago}</p>
        )}
      </div>

      {/* Notas */}
      <div className="flex flex-col">
        <textarea
          name="notas"
          placeholder="Notas (opcional)"
          value={form.notas}
          onChange={handleChange}
          className={inputClass(
            "rounded-lg p-2 w-full h-16 border focus:outline-none focus:ring-2 bg-white resize-none",
            !!errors.notas
          )}
          maxLength={200}
        />
        <div className="flex justify-between">
          {errors.notas ? (
            <p className="text-xs text-red-500 mt-1">{errors.notas}</p>
          ) : (
            <p className="text-[11px] text-gray-500 mt-1">
              Máx 120 caracteres útiles
            </p>
          )}
          <p className="text-[11px] text-gray-400 mt-1">
            {form.notas.length}/200
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 active:scale-[.98] transition-all w-full shadow"
      >
        Guardar Mandado
      </button>

      {!navigator.onLine && (
        <p className="text-[11px] text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center">
          Estás sin internet. Guardamos local y sincronizamos cuando vuelva 📶
        </p>
      )}
    </form>
  );
}
