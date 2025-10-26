import { useState, useMemo } from "react";
import { useGastos } from "../logic/useGastos";
import { useToast } from "../../../components/ToastContext"; // ajustá ruta según tu estructura

export default function GastosList() {
  const { gastos, editGasto, deleteGasto } = useGastos();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");

  // modal de edición
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    categoria: "gasolina",
    monto: "",
    nota: "",
    fecha: "",
    hora: "",
  });

  const [editErrors, setEditErrors] = useState({
    categoria: "",
    monto: "",
    nota: "",
    fecha: "",
    hora: "",
  });

  // modal de confirmación de borrado
  const [deletingId, setDeletingId] = useState(null);

  // filtro de búsqueda
  const gastosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gastos;

    return gastos.filter((g) => {
      const byFecha = g.fecha?.toLowerCase().includes(q);
      const byHora = g.hora?.toLowerCase().includes(q);
      const byCat = g.categoria?.toLowerCase().includes(q);
      const byNota = g.nota?.toLowerCase().includes(q);
      const byMonto = g.monto?.toString().toLowerCase().includes(q);

      return byFecha || byHora || byCat || byNota || byMonto;
    });
  }, [search, gastos]);

  // abrir modal de edición
  function handleOpenEdit(gasto) {
    setEditingId(gasto.id);
    setEditData({
      categoria: gasto.categoria || "gasolina",
      monto: gasto.monto || "",
      nota: gasto.nota || "",
      fecha: gasto.fecha || "",
      hora: gasto.hora || "",
    });
    setEditErrors({
      categoria: "",
      monto: "",
      nota: "",
      fecha: "",
      hora: "",
    });
  }

  // validar datos editados
  function validateEdit() {
    const errs = {
      categoria: "",
      monto: "",
      nota: "",
      fecha: "",
      hora: "",
    };

    if (!editData.categoria || editData.categoria.trim() === "") {
      errs.categoria = "Seleccioná una categoría";
    }

    if (!editData.monto || editData.monto.trim() === "") {
      errs.monto = "El monto es obligatorio";
    } else {
      const num = Number(editData.monto);
      if (Number.isNaN(num)) {
        errs.monto = "El monto debe ser un número";
      } else if (num <= 0) {
        errs.monto = "El monto debe ser mayor que 0";
      }
    }

    if (editData.nota && editData.nota.length > 120) {
      errs.nota = "Máximo 120 caracteres";
    }

    if (!editData.fecha || editData.fecha.trim() === "") {
      errs.fecha = "La fecha es obligatoria";
    }

    if (!editData.hora || editData.hora.trim() === "") {
      errs.hora = "La hora es obligatoria";
    }

    setEditErrors(errs);

    const hasError =
      errs.categoria || errs.monto || errs.nota || errs.fecha || errs.hora;

    return !hasError;
  }

  // guardar edición
  function handleSaveEdit() {
    if (!editingId) return;

    if (!validateEdit()) {
      showToast("⚠️ Revisá los campos marcados", "error");
      return;
    }

    editGasto(editingId, { ...editData });

    if (!navigator.onLine) {
      showToast("✍️ Editado offline, se sincroniza cuando haya internet", "info");
    } else {
      showToast("✅ Cambios guardados", "success");
    }

    setEditingId(null);
  }

  // abrir modal de confirmación de borrado
  function handleAskDelete(gasto) {
    setDeletingId(gasto.id);
  }

  // confirmar borrado
  function handleConfirmDelete() {
    if (!deletingId) return;
    deleteGasto(deletingId);
    setDeletingId(null);

    showToast("🗑 Gasto eliminado", "info");
  }

  // cancelar borrado
  function handleCancelDelete() {
    setDeletingId(null);
  }

  // si aún no hay gastos
  if (!gastos || gastos.length === 0) {
    return (
      <div className="flex flex-col items-center pt-8 px-4 text-gray-800">
        <SearchBar value={search} onChange={setSearch} />
        <p className="text-center text-white/80 text-sm bg-black/30 rounded-lg py-4 px-4 mt-6 backdrop-blur-sm">
          No hay gastos registrados aún.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-8 px-4 text-gray-800 pb-24">
      <h1 className="text-xl font-semibold text-gray-100 drop-shadow-sm mb-2">
        Gastos del día / Históricos
      </h1>

      <SearchBar value={search} onChange={setSearch} />

      <div className="w-full max-w-xl mt-4 space-y-4">
        {gastosFiltrados.length === 0 ? (
          <div className="text-center text-white/80 text-sm bg-black/30 rounded-lg py-4 px-4 backdrop-blur-sm">
            No hay resultados para “{search}”.
          </div>
        ) : (
          gastosFiltrados.map((g) => (
            <div
              key={g.id}
              className="rounded-xl shadow-md border border-purple-200/60 bg-white/90 backdrop-blur-sm"
            >
              {/* header tarjeta */}
              <div className="flex justify-between items-start p-4 pb-2">
                <div>
                  <p className="font-semibold text-gray-800 capitalize">
                    {g.categoria}
                  </p>
                  <span className="text-xs text-gray-500 block">
                    {g.fecha} • {g.hora}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    onClick={() => handleOpenEdit(g)}
                  >
                    <span role="img" aria-label="edit">
                      ✏️
                    </span>
                    Editar
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 shadow-sm"
                    onClick={() => handleAskDelete(g)}
                  >
                    <span role="img" aria-label="delete">
                      🗑
                    </span>
                    Eliminar
                  </button>
                </div>
              </div>

              {/* body tarjeta */}
              <div className="px-4 pb-4 text-sm">
                <p className="text-gray-900 font-semibold">C$ {g.monto}</p>

                {g.nota && (
                  <p className="text-gray-700 mt-1 break-words">{g.nota}</p>
                )}
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

      {/* MODAL BORRADO */}
      {deletingId && (
        <ConfirmDeleteModal
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

/* ----------------------------------
   SUBCOMPONENTES
-----------------------------------*/

function SearchBar({ value, onChange }) {
  return (
    <div className="w-full max-w-xl flex flex-col items-center">
      <div className="relative w-full">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
        <input
          className="w-full rounded-lg border border-gray-300 bg-white/90 pl-8 pr-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Buscar... ej: gasolina, 150, comida, 2025-10-26"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="text-[11px] text-gray-100 mt-1 drop-shadow">
        Filtra por categoría, monto, nota, fecha, hora.
      </p>
    </div>
  );
}

// helper para estilos de inputs en el modal
function inputClass(base, hasError) {
  return (
    base +
    " " +
    (hasError
      ? "border-red-400 focus:ring-red-400"
      : "border-gray-300 focus:ring-purple-400")
  );
}

function EditModal({ data, setData, errors, setErrors, onClose, onSave }) {
  // cuando el usuario escribe limpiamos el error de ese campo
  function handleFieldChange(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Editar gasto
        </h2>

        <div className="grid gap-3 text-sm">
          {/* Categoría */}
          <label className="flex flex-col">
            <span className="text-gray-600 font-medium">
              Categoría <span className="text-red-500">*</span>
            </span>
            <select
              className={inputClass(
                "rounded-lg px-2 py-1 capitalize border focus:outline-none focus:ring-2 bg-white",
                !!errors.categoria
              )}
              value={data.categoria}
              onChange={(e) => handleFieldChange("categoria", e.target.value)}
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
          </label>

          {/* Monto */}
          <label className="flex flex-col">
            <span className="text-gray-600 font-medium">
              Monto (C$) <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              className={inputClass(
                "rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 bg-white",
                !!errors.monto
              )}
              value={data.monto}
              onChange={(e) => handleFieldChange("monto", e.target.value)}
            />
            {errors.monto && (
              <p className="text-xs text-red-500 mt-1">{errors.monto}</p>
            )}
          </label>

          {/* Nota */}
          <label className="flex flex-col">
            <span className="text-gray-600 font-medium">
              Nota{" "}
              <span className="text-gray-400 text-xs font-normal">
                (opcional)
              </span>
            </span>
            <textarea
              className={inputClass(
                "rounded-lg px-2 py-1 h-16 border focus:outline-none focus:ring-2 bg-white resize-none",
                !!errors.nota
              )}
              value={data.nota}
              onChange={(e) => handleFieldChange("nota", e.target.value)}
              placeholder="Ej: gasolina Shell, almuerzo, llanta nueva..."
              maxLength={200}
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
                {data.nota.length}/200
              </p>
            </div>
          </label>

          {/* Fecha / Hora */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col">
              <span className="text-gray-600 font-medium">
                Fecha <span className="text-red-500">*</span>
              </span>
              <input
                type="date"
                className={inputClass(
                  "rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 bg-white",
                  !!errors.fecha
                )}
                value={data.fecha}
                onChange={(e) => handleFieldChange("fecha", e.target.value)}
              />
              {errors.fecha && (
                <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>
              )}
            </label>

            <label className="flex flex-col">
              <span className="text-gray-600 font-medium">
                Hora <span className="text-red-500">*</span>
              </span>
              <input
                type="time"
                className={inputClass(
                  "rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 bg-white",
                  !!errors.hora
                )}
                value={data.hora}
                onChange={(e) => handleFieldChange("hora", e.target.value)}
              />
              {errors.hora && (
                <p className="text-xs text-red-500 mt-1">{errors.hora}</p>
              )}
            </label>
          </div>
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
            className="px-3 py-1 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700 shadow"
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
        <h2 className="text-lg font-semibold text-gray-800">
          ¿Eliminar este gasto?
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Esta acción no se puede deshacer.
        </p>

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
