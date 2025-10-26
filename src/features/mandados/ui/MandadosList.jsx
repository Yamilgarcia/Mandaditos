import { useState, useMemo } from "react";
import { useMandados } from "../logic/useMandados";
import { useToast } from "../../../components/ToastContext"; // ajustá la ruta si cambia

export default function MandadosList() {
  const { mandados, updateMandado, deleteMandado } = useMandados();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");

  // modal de edición
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    clienteNombre: "",
    descripcion: "",
    monto: "",
    fecha: "",
    metodoPago: "efectivo",
    pagado: true,
  });

  // errores del modal
  const [editErrors, setEditErrors] = useState({
    clienteNombre: "",
    descripcion: "",
    monto: "",
    fecha: "",
    metodoPago: "",
  });

  // modal de confirmación de borrado
  const [deletingId, setDeletingId] = useState(null);

  // filtrar por búsqueda
  const mandadosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mandados;

    return mandados.filter((m) => {
      const matchFecha = m.fecha?.toString().toLowerCase().includes(q);
      const matchNombre = m.clienteNombre?.toLowerCase().includes(q);
      const matchDesc = m.descripcion?.toLowerCase().includes(q);
      const matchMonto = m.monto?.toString().toLowerCase().includes(q);
      const matchMetodo = m.metodoPago?.toLowerCase().includes(q);
      const matchEstado = m.pagado
        ? "pagado pagado por efectivo pagado por transferencia".includes(q)
        : "pendiente deuda no pagado".includes(q);

      return (
        matchFecha ||
        matchNombre ||
        matchDesc ||
        matchMonto ||
        matchMetodo ||
        matchEstado
      );
    });
  }, [search, mandados]);

  // abrir modal de edición con datos actuales
  function handleOpenEdit(m) {
    setEditingId(m.id);
    setEditData({
      clienteNombre: m.clienteNombre || "",
      descripcion: m.descripcion || "",
      monto: m.monto?.toString?.() || "",
      fecha: m.fecha || "",
      metodoPago: m.metodoPago || "efectivo",
      pagado: !!m.pagado,
    });
    setEditErrors({
      clienteNombre: "",
      descripcion: "",
      monto: "",
      fecha: "",
      metodoPago: "",
    });
  }

  // validar campos del modal
  function validateForm() {
    const errs = {
      clienteNombre: "",
      descripcion: "",
      monto: "",
      fecha: "",
      metodoPago: "",
    };

    if (!editData.clienteNombre || editData.clienteNombre.trim() === "") {
      errs.clienteNombre = "Ingresá el nombre del cliente";
    }

    if (!editData.descripcion || editData.descripcion.trim() === "") {
      errs.descripcion = "Ingresá una descripción del mandado";
    }

    if (!editData.monto || editData.monto.toString().trim() === "") {
      errs.monto = "Ingresá un monto";
    } else {
      const num = Number(editData.monto);
      if (Number.isNaN(num)) {
        errs.monto = "El monto debe ser un número";
      } else if (num <= 0) {
        errs.monto = "El monto debe ser mayor que 0";
      }
    }

    if (!editData.fecha || editData.fecha.trim() === "") {
      errs.fecha = "Seleccioná una fecha";
    }

    if (
      !editData.metodoPago ||
      !["efectivo", "transferencia", "pendiente"].includes(editData.metodoPago)
    ) {
      errs.metodoPago = "Seleccioná un método de pago";
    }

    setEditErrors(errs);
    const hasError =
      errs.clienteNombre || errs.descripcion || errs.monto || errs.fecha || errs.metodoPago;

    return !hasError;
  }

  // guardar cambios desde el modal
  function handleSaveEdit() {
    if (!editingId) return;

    if (!validateForm()) {
      showToast("⚠️ Revisá los campos marcados", "error");
      return;
    }

    // guardar tal cual el checkbox (no forzar pagado)
    const dataToSave = { ...editData };

    try {
      updateMandado(editingId, dataToSave);

      if (!navigator.onLine) {
        showToast("✍️ Cambios guardados offline. Se sincronizan cuando haya internet.", "info");
      } else {
        showToast("Mandado actualizado", "success");
      }
      setEditingId(null);
    } catch {
      showToast("❌ No se pudo guardar. Probá de nuevo.", "error");
    }
  }

  // abrir modal de confirmación de borrado
  function handleAskDelete(m) {
    setDeletingId(m.id);
  }

  // confirmar eliminar
  function handleConfirmDelete() {
    if (!deletingId) return;

    try {
      deleteMandado(deletingId);
      showToast("🗑 Mandado eliminado", "info");
    } catch {
      showToast("❌ No se pudo eliminar. Probá de nuevo.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCancelDelete() {
    setDeletingId(null);
  }

  // si no hay mandados
  if (!mandados || mandados.length === 0) {
    return (
      <div className="flex flex-col items-center pt-8 px-4 text-gray-800">
        <SearchBar value={search} onChange={setSearch} />
        <p className="text-center text-white/80 text-sm bg-black/30 rounded-lg py-4 px-4 mt-6 backdrop-blur-sm">
          No hay mandados registrados aún.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-8 px-4 text-gray-800 pb-24">
      <h1 className="text-xl font-semibold text-gray-100 drop-shadow-sm mb-2">
        Historial / Pendientes
      </h1>

      <SearchBar value={search} onChange={setSearch} />

      <div className="w-full max-w-xl mt-4 space-y-4">
        {mandadosFiltrados.length === 0 ? (
          <div className="text-center text-white/80 text-sm bg-black/30 rounded-lg py-4 px-4 backdrop-blur-sm">
            No hay resultados para “{search}”.
          </div>
        ) : (
          mandadosFiltrados.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl shadow-md border backdrop-blur-sm ${
                m.pagado ? "bg-green-50/90 border-green-200" : "bg-yellow-50/90 border-yellow-200"
              }`}
            >
              {/* header tarjeta */}
              <div className="flex justify-between items-start p-4 pb-2">
                <div>
                  <p className="font-semibold text-gray-800">{m.clienteNombre}</p>
                  <span className="text-xs text-gray-500 block">{m.fecha}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    onClick={() => handleOpenEdit(m)}
                  >
                    <span role="img" aria-label="edit">✏️</span>
                    Editar
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 shadow-sm"
                    onClick={() => handleAskDelete(m)}
                  >
                    <span role="img" aria-label="delete">🗑</span>
                    Eliminar
                  </button>
                </div>
              </div>

              {/* body tarjeta */}
              <div className="px-4 pb-4 text-sm">
                <p className="text-gray-700">{m.descripcion}</p>

                <p className="text-gray-900 font-semibold mt-2">C$ {m.monto}</p>

                <p
                  className={`text-sm mt-1 flex items-center gap-1 ${
                    m.pagado ? "text-green-700" : "text-yellow-700"
                  }`}
                >
                  {m.pagado ? (
                    <>
                      <span>✅</span>
                      <span>Pagado por {m.metodoPago}</span>
                    </>
                  ) : (
                    <>
                      <span>💸</span>
                      <span>Pendiente de pago</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL EDICIÓN */}
      {editingId && (
        <EditModal
          data={editData}
          setData={setEditData}
          errors={editErrors}
          setErrors={setEditErrors}
          onClose={() => setEditingId(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* MODAL BORRAR */}
      {deletingId && (
        <ConfirmDeleteModal onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} />
      )}
    </div>
  );
}

/* -------------------------------------------------
   SUBCOMPONENTES
--------------------------------------------------*/

function SearchBar({ value, onChange }) {
  return (
    <div className="w-full max-w-xl flex flex-col items-center">
      <div className="relative w-full">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          className="w-full rounded-lg border border-gray-300 bg-white/90 pl-8 pr-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar... ej: Yamil, 2025-10-26, efectivo, 40, pendiente"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="text-[11px] text-gray-100 mt-1 drop-shadow">
        Filtra por nombre, fecha, método de pago, monto, etc.
      </p>
    </div>
  );
}

// helper de estilo para inputs en el modal
function inputClass(base, hasError) {
  return (
    base +
    " " +
    (hasError ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400")
  );
}

function EditModal({ data, setData, errors, setErrors, onClose, onSave }) {
  // limpiar error si escribe
  function handleFieldChange(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Editar mandado</h2>

        <div className="grid gap-3 text-sm">
          {/* Cliente */}
          <label className="flex flex-col">
            <span className="text-gray-600 font-medium">
              Cliente <span className="text-red-500">*</span>
            </span>
            <input
              className={inputClass(
                "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
                !!errors.clienteNombre
              )}
              value={data.clienteNombre}
              onChange={(e) => handleFieldChange("clienteNombre", e.target.value)}
            />
            {errors.clienteNombre && (
              <p className="text-xs text-red-500 mt-1">{errors.clienteNombre}</p>
            )}
          </label>

          {/* Descripción */}
          <label className="flex flex-col">
            <span className="text-gray-600 font-medium">
              Descripción <span className="text-red-500">*</span>
            </span>
            <textarea
              className={inputClass(
                "border rounded-lg px-2 py-1 h-16 resize-none focus:outline-none focus:ring-2 bg-white",
                !!errors.descripcion
              )}
              value={data.descripcion}
              onChange={(e) => handleFieldChange("descripcion", e.target.value)}
              placeholder="Ej: Atol, compra en pulpería, etc."
            />
            {errors.descripcion && (
              <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>
            )}
          </label>

          {/* Monto / Fecha */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col">
              <span className="text-gray-600 font-medium">
                Monto (C$) <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                className={inputClass(
                  "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
                  !!errors.monto
                )}
                value={data.monto}
                onChange={(e) => handleFieldChange("monto", e.target.value)}
              />
              {errors.monto && <p className="text-xs text-red-500 mt-1">{errors.monto}</p>}
            </label>

            <label className="flex flex-col">
              <span className="text-gray-600 font-medium">
                Fecha <span className="text-red-500">*</span>
              </span>
              <input
                type="date"
                className={inputClass(
                  "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
                  !!errors.fecha
                )}
                value={data.fecha}
                onChange={(e) => handleFieldChange("fecha", e.target.value)}
              />
              {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>}
            </label>
          </div>

          {/* Método de pago */}
          <label className="flex flex-col">
            <span className="text-gray-600 font-medium">
              Método de pago <span className="text-red-500">*</span>
            </span>
            <select
              className={inputClass(
                "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
                !!errors.metodoPago
              )}
              value={data.metodoPago}
              onChange={(e) => handleFieldChange("metodoPago", e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="pendiente">Pendiente</option>
            </select>
            {errors.metodoPago && <p className="text-xs text-red-500 mt-1">{errors.metodoPago}</p>}
          </label>

          {/* Pagado sí/no */}
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={data.pagado}
              onChange={(e) => handleFieldChange("pagado", e.target.checked)}
            />
            <span className="text-sm font-medium">¿Pagado?</span>
          </label>
        </div>

        {/* Botones modal */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="px-3 py-1 rounded-lg text-sm bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-3 py-1 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 shadow"
            onClick={onSave}
          >
            Guardar
          </button>
        </div>

        {!navigator.onLine && (
          <p className="text-[11px] text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center mt-2">
            Estás sin internet. Guardamos local y sincronizamos cuando vuelva 📶
          </p>
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-5">
        <h2 className="text-lg font-semibold text-gray-800">¿Eliminar este mandado?</h2>
        <p className="text-sm text-gray-600 mt-2">Esta acción no se puede deshacer.</p>

        <div className="flex justify-end gap-2 mt-5">
          <button
            className="px-3 py-1 rounded-lg text-sm bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="px-3 py-1 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 shadow"
            onClick={onConfirm}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
