import { useState, useMemo } from "react";
import { getTodayStr, getTimeStr } from "../../../utils/date";
import { useMandados } from "../logic/useMandados";
import { useToast } from "../../../components/ToastContext";

export default function MandadoForm() {
  const { createMandado } = useMandados();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    fecha: getTodayStr(),
    hora: getTimeStr(),
    clienteNombre: "",
    descripcion: "",
    gastoCompra: "",          // reembolso
    cobroServicio: "20",      // fee por defecto
    cantidad: 1,              // NUEVO: informativo (no altera cálculos)
    metodoPago: "efectivo",
    notas: "",
  });

  const [errors, setErrors] = useState({
    fecha: "",
    hora: "",
    clienteNombre: "",
    descripcion: "",
    gastoCompra: "",
    cobroServicio: "",
    cantidad: "",            // NUEVO
    metodoPago: "",
    notas: "",
  });

  // helper para sanitizar números (acepta “,”)
  const sanitizeNumber = (val) => (typeof val === "string" ? val.replace(",", ".") : val);

  function handleChange(e) {
    const { name, value } = e.target;
    const sanitized =
      name === "gastoCompra" || name === "cobroServicio"
        ? sanitizeNumber(value)
        : value;

    setForm((prev) => ({ ...prev, [name]: sanitized }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  // Stepper de cantidad (solo informativa)
  function incCantidad() {
    setForm((prev) => ({ ...prev, cantidad: Math.max(1, Number(prev.cantidad || 1) + 1) }));
    if (errors.cantidad) setErrors((prev) => ({ ...prev, cantidad: "" }));
  }
  function decCantidad() {
    setForm((prev) => ({ ...prev, cantidad: Math.max(1, Number(prev.cantidad || 1) - 1) }));
    if (errors.cantidad) setErrors((prev) => ({ ...prev, cantidad: "" }));
  }

  // Cálculos en vivo (igual que original)
  const { totalCobrarPreview, utilidadPreview } = useMemo(() => {
    const g = Number(form.gastoCompra || 0);
    const c = Number(form.cobroServicio || 0);
    const validG = !Number.isNaN(g);
    const validC = !Number.isNaN(c);
    return {
      totalCobrarPreview: validG && validC ? (g + c).toFixed(2) : "—",
      utilidadPreview: validC ? c.toFixed(2) : "—",
    };
  }, [form.gastoCompra, form.cobroServicio]);

  function validate() {
    const e = {
      fecha: "",
      hora: "",
      clienteNombre: "",
      descripcion: "",
      gastoCompra: "",
      cobroServicio: "",
      cantidad: "",
      metodoPago: "",
      notas: "",
    };

    if (!form.fecha?.trim()) e.fecha = "La fecha es obligatoria";
    if (!form.hora?.trim()) e.hora = "La hora es obligatoria";
    if (!form.clienteNombre?.trim()) e.clienteNombre = "Poné el nombre del cliente";
    if (!form.descripcion?.trim()) e.descripcion = "Describí el mandado";

    // gastoCompra: obligatorio y >= 0
    if (form.gastoCompra === "" || form.gastoCompra === null) {
      e.gastoCompra = "El gasto de la compra es obligatorio";
    } else {
      const num = Number(form.gastoCompra);
      if (Number.isNaN(num)) e.gastoCompra = "El gasto debe ser numérico";
      else if (num < 0) e.gastoCompra = "El gasto no puede ser negativo";
    }

    // cobroServicio: obligatorio y > 0
    if (!form.cobroServicio?.trim()) {
      e.cobroServicio = "El cobro de servicio es obligatorio";
    } else {
      const num = Number(form.cobroServicio);
      if (Number.isNaN(num)) e.cobroServicio = "El cobro debe ser numérico";
      else if (num <= 0) e.cobroServicio = "El cobro debe ser mayor que 0";
    }

    // cantidad: entero >= 1 (solo informativo)
    const qty = Math.floor(Number(form.cantidad));
    if (Number.isNaN(qty) || qty < 1) {
      e.cantidad = "La cantidad debe ser un entero ≥ 1";
    }

    if (!["efectivo", "transferencia", "pendiente"].includes(form.metodoPago)) {
      e.metodoPago = "Seleccioná método de pago";
    }

    if (form.notas && form.notas.length > 120) e.notas = "Máximo 120 caracteres";

    setErrors(e);

    const hasError =
      e.fecha || e.hora || e.clienteNombre || e.descripcion ||
      e.gastoCompra || e.cobroServicio || e.cantidad || e.metodoPago || e.notas;

    return !hasError;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      showToast("⚠️ Revisá los campos marcados", "error");
      return;
    }

    const pagado = form.metodoPago !== "pendiente";
    const gasto = Number(form.gastoCompra);
    const fee = Number(form.cobroServicio);
    const totalCobrar = gasto + fee;     // igual que original
    const utilidad = fee;                // igual que original

    // impactos de caja/banco
    let cajaDelta = 0;
    let bancoDelta = 0;
    let porCobrar = 0;

    if (form.metodoPago === "efectivo") {
      cajaDelta = -gasto + totalCobrar; // neto en caja = fee
    } else if (form.metodoPago === "transferencia") {
      cajaDelta = -gasto;
      bancoDelta = totalCobrar;
    } else {
      cajaDelta = -gasto;
      porCobrar = totalCobrar;
    }

    const mandado = {
      ...form,
      gastoCompra: gasto,
      cobroServicio: fee,
      totalCobrar,
      utilidad,
      pagado,
      porCobrar,
      cajaDelta,
      bancoDelta,
    };

    createMandado(mandado);

    if (!navigator.onLine) {
      showToast(
        `📦 Guardado offline (${pagado ? "PAGADO" : "PENDIENTE"}). Se sincroniza cuando haya internet.`,
        "info"
      );
    } else {
      showToast(
        pagado ? "✅ Mandado guardado (pagado)" : "💸 Mandado creado como PENDIENTE",
        pagado ? "success" : "info"
      );
    }

    // reset
    setForm({
      fecha: getTodayStr(),
      hora: getTimeStr(),
      clienteNombre: "",
      descripcion: "",
      gastoCompra: "",
      cobroServicio: "20",
      cantidad: 1,
      metodoPago: "efectivo",
      notas: "",
    });
    setErrors({
      fecha: "",
      hora: "",
      clienteNombre: "",
      descripcion: "",
      gastoCompra: "",
      cobroServicio: "",
      cantidad: "",
      metodoPago: "",
      notas: "",
    });
  }

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
      <h2 className="text-xl font-bold text-center text-gray-700">Registrar Mandado</h2>

      {/* Fecha / Hora */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className={inputClass("rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white", !!errors.fecha)}
          />
          {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>}
        </div>
        <div className="flex flex-col">
          <input
            type="time"
            name="hora"
            value={form.hora}
            onChange={handleChange}
            className={inputClass("rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white", !!errors.hora)}
          />
          {errors.hora && <p className="text-xs text-red-500 mt-1">{errors.hora}</p>}
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
          className={inputClass("rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white", !!errors.clienteNombre)}
        />
        {errors.clienteNombre && <p className="text-xs text-red-500 mt-1">{errors.clienteNombre}</p>}
      </div>

      {/* Descripción */}
      <div className="flex flex-col">
        <textarea
          name="descripcion"
          placeholder="Descripción del mandado (ej. súper y panadería)"
          value={form.descripcion}
          onChange={handleChange}
          className={inputClass("rounded-lg p-2 w-full h-20 border focus:outline-none focus:ring-2 bg-white resize-none", !!errors.descripcion)}
        />
        {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
      </div>

      {/* Gasto de la compra + Cobro de servicio */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            name="gastoCompra"
            placeholder="Gasto compra (C$)"
            value={form.gastoCompra}
            onChange={handleChange}
            className={inputClass("rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white", !!errors.gastoCompra)}
          />
          {errors.gastoCompra && <p className="text-xs text-red-500 mt-1">{errors.gastoCompra}</p>}
        </div>
        <div className="flex flex-col">
          <input
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            name="cobroServicio"
            placeholder="Cobro servicio (C$)"
            value={form.cobroServicio}
            onChange={handleChange}
            className={inputClass("rounded-lg p-2 w-full border focus:outline-none focus:ring-2 bg-white", !!errors.cobroServicio)}
          />
          {errors.cobroServicio && <p className="text-xs text-red-500 mt-1">{errors.cobroServicio}</p>}
        </div>
      </div>

      {/* Cantidad (Stepper) */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Cantidad de mandados <span className="text-red-500">*</span>
        </label>
        <div className={`flex items-center gap-2 rounded-lg p-2 border ${errors.cantidad ? "border-red-400" : "border-gray-300"}`}>
          <button
            type="button"
            onClick={decCantidad}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 active:scale-[.98]"
            aria-label="Disminuir cantidad"
          >
            –
          </button>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            name="cantidad"
            value={form.cantidad}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                cantidad: Math.max(1, Math.floor(Number(e.target.value || 1))),
              }))
            }
            className="w-20 text-center rounded-lg p-2 border border-gray-300 focus:outline-none focus:ring-2"
          />
          <button
            type="button"
            onClick={incCantidad}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 active:scale-[.98]"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
        {errors.cantidad && <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>}
      </div>

      {/* Totales en vivo */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-600">Total a cobrar</span>
          <span className="font-semibold">C$ {totalCobrarPreview}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-600">Utilidad</span>
          <span className="font-semibold">C$ {utilidadPreview}</span>
        </div>
      </div>

      {/* Método de pago */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 mb-1">
          Método de pago <span className="text-red-500">*</span>
        </span>
        <div className={`flex flex-wrap gap-3 rounded-lg p-2 border ${errors.metodoPago ? "border-red-400" : "border-gray-300"}`}>
          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input type="radio" name="metodoPago" value="efectivo" checked={form.metodoPago === "efectivo"} onChange={handleChange} />
            Efectivo
          </label>
          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input type="radio" name="metodoPago" value="transferencia" checked={form.metodoPago === "transferencia"} onChange={handleChange} />
            Transferencia
          </label>
          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input type="radio" name="metodoPago" value="pendiente" checked={form.metodoPago === "pendiente"} onChange={handleChange} />
            Pendiente
          </label>
        </div>
        {errors.metodoPago && <p className="text-xs text-red-500 mt-1">{errors.metodoPago}</p>}
      </div>

      {/* Notas */}
      <div className="flex flex-col">
        <textarea
          name="notas"
          placeholder="Notas (opcional)"
          value={form.notas}
          onChange={handleChange}
          className={inputClass("rounded-lg p-2 w-full h-16 border focus:outline-none focus:ring-2 bg-white resize-none", !!errors.notas)}
          maxLength={200}
        />
        <div className="flex justify-between">
          {errors.notas ? (
            <p className="text-xs text-red-500 mt-1">{errors.notas}</p>
          ) : (
            <p className="text-[11px] text-gray-500 mt-1">Máx 120 caracteres útiles</p>
          )}
          <p className="text-[11px] text-gray-400 mt-1">{form.notas.length}/200</p>
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
