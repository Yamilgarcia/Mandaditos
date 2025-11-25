import { useState, useMemo, useEffect } from "react";
import { useMandados } from "../logic/useMandados";
import { useToast } from "../../../components/ToastContext";

/* ===================== UTILS ===================== */
function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}
function getTotalCobrar(m) {
  if (m.totalCobrar !== undefined) return toNum(m.totalCobrar);
  const legacy = toNum(m.monto);
  const calc = toNum(m.gastoCompra) + toNum(m.cobroServicio);
  return calc > 0 ? calc : legacy;
}
function getUtilidad(m) {
  if (m.utilidad !== undefined) return toNum(m.utilidad);
  const legacy = toNum(m.monto);
  const fee = toNum(m.cobroServicio);
  return fee > 0 ? fee : legacy;
}
function getHoraOrEmpty(m) {
  return typeof m.hora === "string" ? m.hora : "";
}
function dedupeByOriginId(list) {
  const map = new Map();
  for (const m of list) {
    const key = m.originId || m.remoteId || m.id;
    const prev = map.get(key);
    if (!prev) map.set(key, m);
    else {
      const score = (x) => (x.syncStatus === "synced" ? 3 : x.remoteId ? 2 : 1);
      map.set(key, score(m) >= score(prev) ? m : prev);
    }
  }
  return Array.from(map.values());
}
// yyyy-mm-dd en horario local (evita desfases de toISOString/UTC)
function getTodayLocalStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ===================== COMPONENTE ===================== */
export default function MandadosList() {
  const { mandados, updateMandado, deleteMandado } = useMandados();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");

  // modal de edición
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    clienteNombre: "",
    descripcion: "",
    fecha: "",
    hora: "",
    gastoCompra: "",
    cobroServicio: "20",
    cantidad: 1, // ← NUEVO
    metodoPago: "efectivo",
    pagado: true,
    notas: "",
  });

  const [editErrors, setEditErrors] = useState({
    clienteNombre: "",
    descripcion: "",
    fecha: "",
    gastoCompra: "",
    cobroServicio: "",
    cantidad: "", // ← NUEVO
    metodoPago: "",
  });

  // paginación
  const [page, setPage] = useState(1);
  // estado inicial leyendo localStorage (cae a 50 si no hay nada)
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem("mandaditos_pageSize"));
      return Number.isFinite(saved) && [5, 10, 20, 50].includes(saved)
        ? saved
        : 50;
    } catch {
      return 50;
    }
  });
  // cada vez que cambie, lo guardás
  useEffect(() => {
    try {
      localStorage.setItem("mandaditos_pageSize", String(pageSize));
    } catch (err) {
      // Puede fallar en modo privado o si el storage está lleno
      if (typeof console !== "undefined" && console.debug) {
        console.debug("No se pudo guardar pageSize en localStorage:", err);
      }
    }
  }, [pageSize]);

  // ====== NUEVO: Hoy ======
  const todayStr = getTodayLocalStr();
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  // volver a página 1 cuando cambie búsqueda, pageSize o el toggle "Solo hoy"
  useEffect(() => {
    setPage(1);
  }, [search, pageSize, showTodayOnly]);

  // lista base sin duplicados
  const baseList = useMemo(() => dedupeByOriginId(mandados || []), [mandados]);

  // contador de hoy (para chip en UI)
  // ahora cuenta mandados cuya fecha sea hoy OR que tuvieron un pago hoy (fechaPago)
  const totalHoy = useMemo(
    () =>
      baseList.filter(
        (m) => (m.fecha || "") === todayStr || (m.fechaPago || "") === todayStr
      ).length,
    [baseList, todayStr]
  );

  // filtrar + ordenar
  const mandadosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtradosBusqueda = !q
      ? baseList
      : baseList.filter((m) => {
          const totalCobrar = getTotalCobrar(m);
          const utilidad = getUtilidad(m);
          const hay = [
            m.fecha?.toString().toLowerCase(),
            m.hora?.toString().toLowerCase(),
            m.clienteNombre?.toLowerCase(),
            m.descripcion?.toLowerCase(),
            m.metodoPago?.toLowerCase(),
            m.pagado ? "pagado" : "pendiente",
            totalCobrar.toString(),
            utilidad.toString(),
            (m.cantidad ?? 1).toString(), // ← NUEVO
          ].some((field) => field?.includes(q));
          return hay;
        });

    // NUEVO: si el toggle está activo, quedate solo con los de hoy
    const filtrados = showTodayOnly
  ? filtradosBusqueda.filter(
      (m) => (m.fecha || "") === todayStr || (m.fechaPago || "") === todayStr
    )
  : filtradosBusqueda;


    // ordenar por fecha desc, luego hora desc
    return filtrados.slice().sort((a, b) => {
      const fa = a.fecha || "";
      const fb = b.fecha || "";
      if (fa < fb) return 1;
      if (fa > fb) return -1;
      const ha = getHoraOrEmpty(a);
      const hb = getHoraOrEmpty(b);
      if (ha < hb) return 1;
      if (ha > hb) return -1;
      return (a.id || "").localeCompare(b.id || "");
    });
  }, [search, baseList, showTodayOnly, todayStr]);

  const total = mandadosFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const visibles = mandadosFiltrados.slice(startIndex, endIndex);

  // abrir modal de edición (mapea registros viejos)
  function handleOpenEdit(m) {
    setEditingId(m.id);
    setEditData({
      clienteNombre: m.clienteNombre || "",
      descripcion: m.descripcion || "",
      fecha: m.fecha || "",
      hora: m.hora || "",
      gastoCompra: m.gastoCompra !== undefined ? String(m.gastoCompra) : "",
      cobroServicio:
        m.cobroServicio !== undefined
          ? String(m.cobroServicio)
          : m.monto
          ? String(m.monto)
          : "20",
      cantidad: m.cantidad !== undefined ? Number(m.cantidad) : 1, // ← NUEVO
      metodoPago: m.metodoPago || (m.pagado ? "efectivo" : "pendiente"),
      pagado: !!m.pagado,
      notas: m.notas || "",
    });
    setEditErrors({
      clienteNombre: "",
      descripcion: "",
      fecha: "",
      gastoCompra: "",
      cobroServicio: "",
      cantidad: "", // ← NUEVO
      metodoPago: "",
    });
  }

  // validar modal
  function validateForm() {
    const e = {
      clienteNombre: "",
      descripcion: "",
      fecha: "",
      gastoCompra: "",
      cobroServicio: "",
      cantidad: "",
      metodoPago: "",
    };

    if (!editData.clienteNombre?.trim())
      e.clienteNombre = "Ingresá el nombre del cliente";
    if (!editData.descripcion?.trim())
      e.descripcion = "Ingresá una descripción";
    if (!editData.fecha?.trim()) e.fecha = "Seleccioná una fecha";

    if (editData.gastoCompra === "" || editData.gastoCompra === null) {
      e.gastoCompra = "El gasto de la compra es obligatorio";
    } else {
      const g = Number(editData.gastoCompra);
      if (Number.isNaN(g)) e.gastoCompra = "El gasto debe ser numérico";
      else if (g < 0) e.gastoCompra = "El gasto no puede ser negativo";
    }

    if (!editData.cobroServicio?.toString().trim()) {
      e.cobroServicio = "El cobro de servicio es obligatorio";
    } else {
      const c = Number(editData.cobroServicio);
      if (Number.isNaN(c)) e.cobroServicio = "El cobro debe ser numérico";
      else if (c <= 0) e.cobroServicio = "El cobro debe ser mayor que 0";
    }

    // cantidad >= 1 (solo informativa / persistente)
    const qty = Math.floor(Number(editData.cantidad));
    if (Number.isNaN(qty) || qty < 1)
      e.cantidad = "Cantidad debe ser un entero ≥ 1";

    if (
      !["efectivo", "transferencia", "pendiente"].includes(editData.metodoPago)
    ) {
      e.metodoPago = "Seleccioná un método de pago";
    }

    setEditErrors(e);
    const has =
      e.clienteNombre ||
      e.descripcion ||
      e.fecha ||
      e.gastoCompra ||
      e.cobroServicio ||
      e.cantidad ||
      e.metodoPago;
    return !has;
  }

  // guardar cambios desde el modal (recalcula derivados)
  function handleSaveEdit() {
    if (!editingId) return;
    if (!validateForm()) {
      showToast("⚠️ Revisá los campos marcados", "error");
      return;
    }

    const gasto = toNum(editData.gastoCompra);
    const fee = toNum(editData.cobroServicio);
    const totalCobrar = gasto + fee;
    const utilidad = fee;

    // coherencia pagado/pendiente
    const metodoPago = editData.metodoPago;
    const pagado = metodoPago === "pendiente" ? false : !!editData.pagado;

    const dataToSave = {
      ...editData,
      gastoCompra: gasto,
      cobroServicio: fee,
      totalCobrar,
      utilidad,
      metodoPago,
      pagado,
      // cantidad pasa intacta (ya validada) → se guarda local y se sincroniza
      cantidad: Math.max(1, Math.floor(Number(editData.cantidad || 1))),
    };

    try {
      updateMandado(editingId, dataToSave);
      if (!navigator.onLine) {
        showToast(
          "✍️ Cambios guardados offline. Se sincronizan cuando haya internet.",
          "info"
        );
      } else {
        showToast("Mandado actualizado", "success");
      }
      setEditingId(null);
    } catch {
      showToast("❌ No se pudo guardar. Probá de nuevo.", "error");
    }
  }

  // borrar
  const [deletingId, setDeletingId] = useState(null);
  function handleAskDelete(m) {
    setDeletingId(m.id);
  }
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

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  return (
    <div className="flex flex-col items-center pt-8 px-4 text-gray-800 pb-24">
      <h1 className="text-xl font-semibold text-gray-100 drop-shadow-sm mb-2">
        Historial / Mandados
      </h1>

      <SearchBar value={search} onChange={setSearch} />

      {/* controles de paginación + HOY */}
      <div className="w-full max-w-xl mt-3 flex items-center justify-between bg-white p-2 rounded-xl shadow border">
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <span>
            Resultados: <span className="font-semibold">{total}</span>
          </span>
          <span className="ml-2 text-xs px-2 py-[2px] rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            Hoy: {totalHoy}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle "Solo hoy" */}
          <button
            type="button"
            onClick={() => setShowTodayOnly((v) => !v)}
            disabled={totalHoy === 0}
            className={`text-xs px-2 py-1 rounded-lg border shadow-sm ${
              showTodayOnly
                ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } ${totalHoy === 0 ? "opacity-60 cursor-not-allowed" : ""}`}
            title={
              totalHoy === 0
                ? "Hoy no hay mandados registrados"
                : "Mostrar solo los mandados de hoy"
            }
          >
            {showTodayOnly ? "Solo hoy ✓" : "Solo hoy"}
          </button>

          <label className="text-sm text-gray-600">Por página:</label>
          <select
            className="border rounded-lg p-1 bg-white text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full max-w-xl mt-4 space-y-4">
        {visibles.length === 0 ? (
          <div className="text-center text-white/80 text-sm bg-black/30 rounded-lg py-4 px-4 backdrop-blur-sm">
            No hay resultados para “{search}”.
          </div>
        ) : (
          visibles.map((m) => {
            const totalCobrar = getTotalCobrar(m);
            const utilidad = getUtilidad(m);
            const gasto = toNum(m.gastoCompra);
            const fee = toNum(m.cobroServicio);
            const cant = Math.max(1, Number(m.cantidad || 1));
            const esHoy = (m.fecha || "") === todayStr;

            return (
              <div
                key={m.id}
                className={`rounded-xl shadow-md border backdrop-blur-sm ${
                  m.pagado
                    ? "bg-green-50/90 border-green-200"
                    : "bg-yellow-50/90 border-yellow-200"
                } ${esHoy ? "ring-2 ring-blue-300" : ""}`}
              >
                {/* header */}
                <div className="flex justify-between items-start p-4 pb-2">
                  <div>
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      {m.clienteNombre}
                      {/* Chip de cantidad */}
                      <span className="text-[11px] px-2 py-[2px] rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        x{cant}
                      </span>
                      {/* Chip HOY */}
                      {esHoy && (
                        <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-600 text-white">
                          HOY
                        </span>
                      )}

                      {/* Chip: si fue pagado hoy */}
                      {m.fechaPago === todayStr && (
                        <span className="text-[10px] px-2 py-[2px] rounded-full bg-green-600 text-white ml-2">
                          Pagado hoy
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-gray-500 block">
                      {m.fecha}
                      {m.hora ? ` • ${m.hora}` : ""}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                      onClick={() => handleOpenEdit(m)}
                    >
                      <span role="img" aria-label="edit">
                        ✏️
                      </span>
                      Editar
                    </button>
                    <button
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-100 border border-red-300 text-red-700 hover:bg-red-200 shadow-sm"
                      onClick={() => handleAskDelete(m)}
                    >
                      <span role="img" aria-label="delete">
                        🗑
                      </span>
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* body */}
                <div className="px-4 pb-4 text-sm">
                  <p className="text-gray-700">{m.descripcion}</p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg border p-2">
                      <p className="text-[11px] text-gray-500">
                        Total cobrado / a cobrar
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        C$ {fmt(totalCobrar)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Compra C$ {fmt(gasto)} + Servicio C$ {fmt(fee)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border p-2">
                      <p className="text-[11px] text-gray-500">Utilidad</p>
                      <p className="text-base font-semibold text-gray-900">
                        C$ {fmt(utilidad)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Cantidad: x{cant}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-sm mt-2 flex items-center gap-1 ${
                      m.pagado ? "text-green-700" : "text-yellow-700"
                    }`}
                  >
                    {m.pagado ? (
                      <>
                        <span>✅</span>
                        <span>
                          Pagado por {m.metodoPago || "—"}
                          {m.fechaPago === todayStr && " • hoy"}
                        </span>
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
            );
          })
        )}
      </div>

      {/* paginador */}
      <div className="w-full max-w-xl mt-3 flex items-center justify-between bg-white p-2 rounded-xl shadow border">
        <button
          className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ← Anterior
        </button>
        <div className="text-sm text-gray-600">
          Página <span className="font-semibold">{currentPage}</span> de{" "}
          <span className="font-semibold">{totalPages}</span>{" "}
          <span className="ml-2 text-gray-400">
            ({startIndex + 1}–{endIndex} de {total})
          </span>
        </div>
        <button
          className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Siguiente →
        </button>
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
        <ConfirmDeleteModal
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

/* --------------------- SUBCOMPONENTES ---------------------- */

function SearchBar({ value, onChange }) {
  return (
    <div className="w-full max-w-xl flex flex-col items-center">
      <div className="relative w-full">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
        <input
          className="w-full rounded-lg border border-gray-300 bg-white/90 pl-8 pr-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar... ej: Yamil, 2025-10-26, efectivo, pendiente, 20, compra, x2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="text-[11px] text-gray-100 mt-1 drop-shadow">
        Filtra por nombre, fecha, método de pago, total, utilidad o cantidad.
      </p>
    </div>
  );
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

function EditModal({ data, setData, errors, setErrors, onClose, onSave }) {
  function handleFieldChange(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  const g = toNum(data.gastoCompra);
  const c = toNum(data.cobroServicio);
  const total = Number.isNaN(g) || Number.isNaN(c) ? null : g + c;

  // Stepper cantidad
  const qty = Math.max(1, Math.floor(Number(data.cantidad || 1)));
  function inc() {
    handleFieldChange("cantidad", qty + 1);
  }
  function dec() {
    handleFieldChange("cantidad", Math.max(1, qty - 1));
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
              onChange={(e) =>
                handleFieldChange("clienteNombre", e.target.value)
              }
            />
            {errors.clienteNombre && (
              <p className="text-xs text-red-500 mt-1">
                {errors.clienteNombre}
              </p>
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
              placeholder="Ej: Compras en súper y panadería"
            />
            {errors.descripcion && (
              <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>
            )}
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
                  "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
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
              <span className="text-gray-600 font-medium">Hora</span>
              <input
                type="time"
                className={inputClass(
                  "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
                  false
                )}
                value={data.hora || ""}
                onChange={(e) => handleFieldChange("hora", e.target.value)}
              />
            </label>
          </div>

          {/* Gasto / Servicio */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col">
              <span className="text-gray-600 font-medium">
                Gasto compra (C$) <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass(
                  "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
                  !!errors.gastoCompra
                )}
                value={data.gastoCompra}
                onChange={(e) =>
                  handleFieldChange("gastoCompra", e.target.value)
                }
              />
              {errors.gastoCompra && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.gastoCompra}
                </p>
              )}
            </label>

            <label className="flex flex-col">
              <span className="text-gray-600 font-medium">
                Cobro servicio (C$) <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={inputClass(
                  "border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white",
                  !!errors.cobroServicio
                )}
                value={data.cobroServicio}
                onChange={(e) =>
                  handleFieldChange("cobroServicio", e.target.value)
                }
              />
              {errors.cobroServicio && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.cobroServicio}
                </p>
              )}
            </label>
          </div>

          {/* Cantidad (Stepper) */}
          <label className="flex flex-col">
            <span className="text-gray-600 font-medium">
              Cantidad de mandados <span className="text-red-500">*</span>
            </span>
            <div
              className={`flex items-center gap-2 rounded-lg p-2 border ${
                errors.cantidad ? "border-red-400" : "border-gray-300"
              }`}
            >
              <button
                type="button"
                onClick={dec}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 active:scale-[.98]"
                aria-label="Disminuir cantidad"
              >
                –
              </button>
              <input
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) =>
                  handleFieldChange(
                    "cantidad",
                    Math.max(1, Math.floor(Number(e.target.value || 1)))
                  )
                }
                className="w-20 text-center rounded-lg p-2 border border-gray-300 focus:outline-none focus:ring-2"
              />
              <button
                type="button"
                onClick={inc}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 active:scale-[.98]"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
            {errors.cantidad && (
              <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>
            )}
          </label>

          {/* Preview totales */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-2 bg-gray-50">
              <p className="text-[11px] text-gray-500">Total a cobrar</p>
              <p className="font-semibold">
                {Number.isFinite(total) ? `C$ ${total.toFixed(2)}` : "—"}
              </p>
            </div>
            <div className="rounded-lg border p-2 bg-gray-50">
              <p className="text-[11px] text-gray-500">Utilidad</p>
              <p className="font-semibold">
                C$ {toNum(data.cobroServicio).toFixed(2)}
              </p>
            </div>
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
            {errors.metodoPago && (
              <p className="text-xs text-red-500 mt-1">{errors.metodoPago}</p>
            )}
          </label>

          {/* Pagado */}
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={data.pagado}
              onChange={(e) => handleFieldChange("pagado", e.target.checked)}
              disabled={data.metodoPago === "pendiente"}
              title={
                data.metodoPago === "pendiente"
                  ? "Si es pendiente no puede marcarse como pagado"
                  : ""
              }
            />
            <span className="text-sm font-medium">¿Pagado?</span>
          </label>
        </div>

        {/* Botones */}
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
        <h2 className="text-lg font-semibold text-gray-800">
          ¿Eliminar este mandado?
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