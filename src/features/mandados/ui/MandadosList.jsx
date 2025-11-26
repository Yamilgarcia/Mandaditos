// src/features/mandados/ui/MandadosList.jsx

import React, { useState, useMemo, useEffect } from "react";
// Se eliminan las importaciones de framer-motion y los íconos no utilizados
import {
  Sun,
  Search as IconSearch,
  Edit2,
  Trash2,
  CreditCard,
  Calendar,
  Clock,
  X,
  ChevronLeft, // Usaremos estos para el paginado
  ChevronRight, // Usaremos estos para el paginado
} from "lucide-react";
import { useMandados } from "../logic/useMandados";
import { useToast } from "../../../components/ToastContext";

/* ===================== HELPERS ===================== */
function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// Se actualiza getTotalCobrar para usar la cantidad
function getTotalCobrar(m) {
  if (m.totalCobrar !== undefined) return toNum(m.totalCobrar);
  const legacy = toNum(m.monto);
  const cant = Math.max(1, toNum(m.cantidad) || 1);
  const calc = toNum(m.gastoCompra) + toNum(m.cobroServicio) * cant;
  return calc > 0 ? calc : legacy;
}

// Se actualiza getUtilidad para usar la cantidad
function getUtilidad(m) {
  if (m.utilidad !== undefined) return toNum(m.utilidad);
  const legacy = toNum(m.monto);
  const cant = Math.max(1, toNum(m.cantidad) || 1);
  const fee = toNum(m.cobroServicio) * cant;
  return fee > 0 ? fee : legacy;
}

function getHoraOrEmpty(m) {
  return typeof m.hora === "string" ? m.hora : "";
}

function dedupeByOriginId(list) {
  const map = new Map();
  for (const item of list) {
    const key = item.originId || item.remoteId || item.id;
    const prev = map.get(key);
    if (!prev) map.set(key, item);
    else {
      const score = (x) => (x.syncStatus === "synced" ? 3 : x.remoteId ? 2 : 1);
      map.set(key, score(item) >= score(prev) ? item : prev);
    }
  }
  return Array.from(map.values());
}

function getTodayLocalStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Clase para campos con error en modales
function inputClass(base, hasError) {
  return (
    base +
    " " +
    (hasError
      ? "border-red-400 focus:ring-red-400"
      : "border-gray-300 focus:ring-blue-400")
  );
}

/* ===================== MAIN COMPONENT ===================== */
export default function MandadosList() {
  const { mandados = [], updateMandado, deleteMandado } = useMandados();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null); // id or "__new"
  const [deletingId, setDeletingId] = useState(null);

  // edit modal state (shared)
  const [editData, setEditData] = useState({
    clienteNombre: "",
    descripcion: "",
    fecha: "",
    hora: "",
    gastoCompra: "",
    cobroServicio: "20",
    cantidad: 1,
    metodoPago: "efectivo",
    pagado: true,
    notas: "",
  });
  const [editErrors, setEditErrors] = useState({});

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem("mandaditos_pageSize"));
      return Number.isFinite(saved) && [10, 20, 50].includes(saved) ? saved : 20;
    } catch {
      return 20;
    }
  });

  // Guardar pageSize en localStorage
  useEffect(() => {
    try {
      localStorage.setItem("mandaditos_pageSize", String(pageSize));
    } catch (err) {
      if (typeof console !== "undefined" && console.debug) {
        console.debug("No se pudo guardar pageSize en localStorage:", err);
      }
    }
  }, [pageSize]);

  const todayStr = getTodayLocalStr();

  // Dedupe + filtered logic
  const baseList = useMemo(() => dedupeByOriginId(mandados || []), [mandados]);

  // Contador de hoy
  const totalHoy = useMemo(
    () =>
      baseList.filter(
        (m) => (m.fecha || "") === todayStr || (m.fechaPago || "") === todayStr
      ).length,
    [baseList, todayStr]
  );

  // Filtrar + ordenar
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const bySearch = !q
      ? baseList
      : baseList.filter((m) => {
          const totalCobrar = getTotalCobrar(m);
          const utilidad = getUtilidad(m);
          const hay = [
            m.fecha?.toString()?.toLowerCase(),
            m.hora?.toString()?.toLowerCase(),
            m.clienteNombre?.toLowerCase(),
            m.descripcion?.toLowerCase(),
            m.metodoPago?.toLowerCase(),
            m.pagado ? "pagado" : "pendiente",
            totalCobrar.toString(),
            utilidad.toString(),
            (m.cantidad ?? 1).toString(),
          ].some((f) => f?.includes(q));
          return hay;
        });

    const filtrados = showTodayOnly
      ? bySearch.filter(
          (m) => (m.fecha || "") === todayStr || (m.fechaPago || "") === todayStr
        )
      : bySearch;

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
  }, [query, baseList, showTodayOnly, todayStr]);

  // Resetear página al cambiar filtros o tamaño de página
  useEffect(() => setPage(1), [query, pageSize, showTodayOnly]);

  // Lógica de paginación
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const visibles = filtered.slice(startIndex, endIndex);

  // small helpers
  function toggleExpanded(id) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  function openEditFor(m) {
    if (!m) return;
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
      cantidad: m.cantidad !== undefined ? Number(m.cantidad) : 1,
      metodoPago: m.metodoPago || (m.pagado ? "efectivo" : "pendiente"),
      pagado: !!m.pagado,
      notas: m.notas || "",
    });
    setEditErrors({});
  }

 

  function askDelete(m) {
    setDeletingId(m.id);
  }

  function confirmDelete() {
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

  // format
  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  if (!mandados || mandados.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 pb-32">
        <div className="text-center text-gray-500 mt-8">
          No hay mandados registrados aún.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 pb-32">
      {/* TOPBAR */}
      <div className="sticky top-2 z-30">
        <div className="backdrop-blur-sm bg-white/90 rounded-xl p-3 shadow-md border flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Sun size={16} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Mandaditos</div>
              <div className="text-sm font-semibold">Lista rápida</div>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch size={14} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por cliente, fecha, método, monto..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => setShowTodayOnly((v) => !v)}
              className={`text-xs px-2 py-1 rounded-lg ${
                showTodayOnly
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
              title={totalHoy === 0 ? "Hoy no hay mandados" : "Mostrar solo hoy"}
              disabled={totalHoy === 0}
            >
              {showTodayOnly ? "Solo hoy" : "Hoy"}
            </button>
            <div className="text-[11px] text-gray-400">
              {filtered.length} resultados
            </div>
          </div>
        </div>
      </div>
      
      {/* CONTROLES DE PAGINACIÓN */}
      <div className="sticky top-[78px] z-20 mt-2">
        <div className="backdrop-blur-sm bg-white/90 rounded-xl p-3 shadow-sm border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
                <label className="text-gray-600">Por pág:</label>
                <select
                    className="border rounded-lg p-1 bg-white text-sm"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                >
                    {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <button
                    className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={14} />
                </button>
                <div className="text-gray-600">
                    <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                    <span className="ml-2 text-gray-400">({startIndex + 1}–{endIndex} de {total})</span>
                </div>
                <button
                    className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
      </div>
      
      {/* LIST */}
      <div className="mt-4 space-y-3">
        {visibles.map((m) => {
          const totalCobrar = getTotalCobrar(m);
          const utilidad = getUtilidad(m);
          const gasto = toNum(m.gastoCompra);
          const fee = toNum(m.cobroServicio);
          const cant = Math.max(1, Number(m.cantidad || 1));
          const esHoy = (m.fecha || "") === todayStr;
          const key = m.id;

          return (
            <article
              key={key}
              className={`rounded-2xl p-3 shadow-sm border bg-white overflow-hidden transition-all duration-300 ease-in-out ${
                m.pagado ? "border-green-100" : "border-yellow-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${
                        esHoy
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {m.clienteNombre?.slice(0, 2).toUpperCase() || "—"}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-800">
                          {m.clienteNombre || "Sin nombre"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {m.fecha}
                          {m.hora ? ` • ${m.hora}` : ""}
                        </div>
                      </div>
                      <div className="text-[13px] text-gray-600 truncate">
                        {m.descripcion}
                      </div>
                    </div>
                  </div>

                  {/* badges row */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] px-2 py-1 rounded-full bg-gray-100 text-gray-700 border">
                      x{cant}
                    </span>
                    <span className="text-[12px] px-2 py-1 rounded-full bg-white text-gray-700 border">
                      C$ {fmt(totalCobrar)}
                    </span>
                    <span
                      className={`text-[12px] px-2 py-1 rounded-full border ${
                        m.pagado
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {m.pagado ? "Pagado" : "Pendiente"}
                    </span>
                    {m.fechaPago === todayStr && (
                      <span className="text-[12px] px-2 py-1 rounded-full bg-green-600 text-white">
                        Pagado hoy
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm font-semibold">
                    C$ {fmt(utilidad)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditFor(m)}
                      aria-label="Editar"
                      className="p-2 rounded-md bg-white border shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => askDelete(m)}
                      aria-label="Eliminar"
                      className="p-2 rounded-md bg-white border shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* expandable details - usando visibilidad simple en lugar de framer-motion */}
              <div
                className={`mt-3 overflow-hidden ${
                  expandedId === key ? "h-auto pt-3 border-t border-gray-100 transition-all duration-300 ease-in-out" : "h-0"
                }`}
                style={{
                  maxHeight: expandedId === key ? '500px' : '0', // Usamos max-height para la transición
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: expandedId === key ? 1 : 0
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2 bg-gray-50 border">
                    <div className="text-[11px] text-gray-500">Compra</div>
                    <div className="font-semibold">C$ {fmt(gasto)}</div>
                    <div className="text-[12px] text-gray-400 mt-1">
                      Servicio C$ {fmt(fee)}
                    </div>
                  </div>
                  <div className="rounded-lg p-2 bg-gray-50 border">
                    <div className="text-[11px] text-gray-500">Método</div>
                    <div className="font-semibold flex items-center gap-2">
                      <CreditCard size={14} />{" "}
                      {m.metodoPago || (m.pagado ? "efectivo" : "pendiente")}
                    </div>
                    <div className="text-[12px] text-gray-400 mt-1">
                      Cantidad: x{cant}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[12px] text-gray-500 flex items-center gap-2">
                    <Calendar size={14} /> {m.fecha || "—"}{" "}
                    {m.hora && (
                      <>
                        <Clock size={12} /> {m.hora}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(key)}
                      className="text-xs px-2 py-1 rounded-lg bg-white border hover:bg-gray-50"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>

              {/* quick actions row */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="text-[12px] text-gray-500">
                  Utilidad: C$ {fmt(utilidad)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="text-[13px] px-3 py-1 rounded-full bg-blue-50 text-blue-700 border hover:bg-blue-100 transition-colors"
                  >
                    {expandedId === key ? 'Ocultar' : 'Detalles'}
                  </button>
                  <button
                    onClick={() => {
                      try {
                        updateMandado(m.id, {
                          pagado: !m.pagado,
                          metodoPago: !m.pagado ? "efectivo" : m.metodoPago,
                        });
                        showToast(
                          !m.pagado
                            ? "✅ Marcado como pagado"
                            : "↺ Marcado como pendiente",
                          "success"
                        );
                      } catch {
                        showToast("❌ Error al actualizar", "error");
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      m.pagado
                        ? "bg-yellow-50 text-yellow-700 border hover:bg-yellow-100"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {m.pagado ? "Marcar pendiente" : "Marcar pagado"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {visibles.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No hay mandados que coincidan.
          </div>
        )}
      </div>

    

      {/* DELETE CONFIRM - Sin AnimatePresence */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-4 max-w-xs w-full shadow">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                ¿Eliminar este mandado?
              </div>
              <button
                onClick={() => setDeletingId(null)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Esta acción no se puede deshacer.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (edición y creación) - Sin AnimatePresence */}
      {editingId && (
        <EditModal
          id={editingId}
          initialData={editData}
          initialErrors={editErrors}
          setInitialData={setEditData}
          setInitialErrors={setEditErrors}
          onClose={() => setEditingId(null)}
          onSave={(id, payload) => {
            try {
              if (id === "__new") {
                if (typeof updateMandado === "function") {
                  updateMandado(null, payload); // Asume que updateMandado maneja la creación si el id es null
                }
                showToast("✨ Mandado creado", "success");
              } else {
                updateMandado(id, payload);
                showToast("✅ Mandado actualizado", "success");
              }
            } catch {
              showToast("❌ Error guardando mandado", "error");
            } finally {
              setEditingId(null);
            }
          }}
        />
      )}
    </div>
  );
}

/* ===================== EDIT MODAL COMPONENT ===================== */
// Se mantiene la función inputClass ya definida arriba

function EditModal({ id, initialData, initialErrors, setInitialData, setInitialErrors, onClose, onSave }) {
    const [data, setData] = useState(() => ({ ...initialData }));
    const [errors, setErrors] = useState(() => ({ ...initialErrors }));

    // Sincronizar estado interno con props al abrir/cambiar
    useEffect(() => {
        setData({ ...initialData });
        setErrors({ ...initialErrors });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData?.clienteNombre, id]);

    function handleFieldChange(field, value) {
        setData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
        // Reflejar al estado del componente padre
        if (typeof setInitialData === "function") {
          setInitialData((prev) => ({ ...prev, [field]: value }));
        }
    }

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

        if (!data.clienteNombre?.trim()) e.clienteNombre = "Ingresá el nombre del cliente";
        if (!data.descripcion?.trim()) e.descripcion = "Ingresá una descripción";
        if (!data.fecha?.trim()) e.fecha = "Seleccioná una fecha";

        if (data.gastoCompra === "" || data.gastoCompra === null) {
            e.gastoCompra = "El gasto de la compra es obligatorio";
        } else {
            const g = Number(data.gastoCompra);
            if (Number.isNaN(g)) e.gastoCompra = "El gasto debe ser numérico";
            else if (g < 0) e.gastoCompra = "El gasto no puede ser negativo";
        }

        if (!data.cobroServicio?.toString().trim()) {
            e.cobroServicio = "El cobro de servicio es obligatorio";
        } else {
            const c = Number(data.cobroServicio);
            if (Number.isNaN(c)) e.cobroServicio = "El cobro debe ser numérico";
            else if (c <= 0) e.cobroServicio = "El cobro debe ser mayor que 0";
        }

        const qty = Math.floor(Number(data.cantidad));
        if (Number.isNaN(qty) || qty < 1) e.cantidad = "Cantidad debe ser un entero ≥ 1";

        if (!["efectivo", "transferencia", "pendiente"].includes(data.metodoPago)) {
            e.metodoPago = "Seleccioná un método de pago";
        }

        setErrors(e);
        if (typeof setInitialErrors === "function") setInitialErrors(e);

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

    function handleSave() {
        if (!validateForm()) {
            // Muestra el toast de error si la validación falla
            // (Necesitarías pasar showToast al modal o manejarlo aquí si está disponible)
            return;
        }

        const gasto = toNum(data.gastoCompra);
        const fee = toNum(data.cobroServicio);
        const cantidad = Math.max(1, Math.floor(Number(data.cantidad || 1)));
        const totalCobrar = gasto + fee * cantidad;
        const utilidad = fee * cantidad;
        const metodoPago = data.metodoPago;
        const pagado = metodoPago === "pendiente" ? false : !!data.pagado;

        const payload = {
            ...data,
            gastoCompra: gasto,
            cobroServicio: fee,
            cantidad,
            totalCobrar,
            utilidad,
            metodoPago,
            pagado,
        };

        onSave(id, payload);
    }

    const g = toNum(data.gastoCompra);
    const c = toNum(data.cobroServicio);
    const qty = Math.max(1, Math.floor(Number(data.cantidad || 1)));
    const totalPreview = Number.isFinite(g) && Number.isFinite(c) ? g + c * qty : null;
    

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4 transform transition-transform duration-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{id === "__new" ? "Nuevo mandado" : "Editar mandado"}</h3>
                    <button onClick={onClose} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"><X size={16} /></button>
                </div>

                <div className="mt-3 grid gap-3 text-sm">
                    {/* Cliente */}
                    <label className="flex flex-col">
                        <span className="text-gray-600 font-medium">Cliente <span className="text-red-500">*</span></span>
                        <input className={inputClass("border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white", !!errors.clienteNombre)} value={data.clienteNombre} onChange={(e) => handleFieldChange("clienteNombre", e.target.value)} />
                        {errors.clienteNombre && <p className="text-xs text-red-500 mt-1">{errors.clienteNombre}</p>}
                    </label>

                    {/* Descripción */}
                    <label className="flex flex-col">
                        <span className="text-gray-600 font-medium">Descripción <span className="text-red-500">*</span></span>
                        <textarea className={inputClass("border rounded-lg px-2 py-1 h-20 resize-none focus:outline-none focus:ring-2 bg-white", !!errors.descripcion)} value={data.descripcion} onChange={(e) => handleFieldChange("descripcion", e.target.value)} />
                        {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
                    </label>

                    {/* Fecha / Hora */}
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col">
                            <span className="text-gray-600 font-medium">Fecha <span className="text-red-500">*</span></span>
                            <input type="date" className={inputClass("border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white", !!errors.fecha)} value={data.fecha} onChange={(e) => handleFieldChange("fecha", e.target.value)} />
                            {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>}
                        </label>
                        <label className="flex flex-col">
                            <span className="text-gray-600 font-medium">Hora</span>
                            <input type="time" className="border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white" value={data.hora || ""} onChange={(e) => handleFieldChange("hora", e.target.value)} />
                        </label>
                    </div>

                    {/* Gasto / Servicio */}
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col">
                            <span className="text-gray-600 font-medium">Gasto compra (C$) <span className="text-red-500">*</span></span>
                            <input type="number" min="0" step="0.01" className={inputClass("border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white", !!errors.gastoCompra)} value={data.gastoCompra} onChange={(e) => handleFieldChange("gastoCompra", e.target.value)} />
                            {errors.gastoCompra && <p className="text-xs text-red-500 mt-1">{errors.gastoCompra}</p>}
                        </label>

                        <label className="flex flex-col">
                            <span className="text-gray-600 font-medium">Cobro servicio (C$) <span className="text-red-500">*</span></span>
                            <input type="number" min="0.01" step="0.01" className={inputClass("border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white", !!errors.cobroServicio)} value={data.cobroServicio} onChange={(e) => handleFieldChange("cobroServicio", e.target.value)} />
                            {errors.cobroServicio && <p className="text-xs text-red-500 mt-1">{errors.cobroServicio}</p>}
                        </label>
                    </div>

                    {/* Cantidad (Stepper) */}
                    <label className="flex flex-col">
                        <span className="text-gray-600 font-medium">Cantidad de mandados <span className="text-red-500">*</span></span>
                        <div className={`flex items-center gap-2 rounded-lg p-2 border ${errors.cantidad ? "border-red-400" : "border-gray-300"}`}>
                            <button type="button" onClick={() => handleFieldChange("cantidad", Math.max(1, qty - 1))} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors">–</button>
                            <input type="number" min="1" step="1" value={qty} onChange={(e) => handleFieldChange("cantidad", Math.max(1, Math.floor(Number(e.target.value || 1))))} className="w-20 text-center rounded-lg p-2 border border-gray-300 focus:outline-none focus:ring-2" />
                            <button type="button" onClick={() => handleFieldChange("cantidad", qty + 1)} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors">+</button>
                        </div>
                        {errors.cantidad && <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>}
                    </label>

                    {/* Preview totales */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border p-2 bg-gray-50">
                            <p className="text-[11px] text-gray-500">Total a cobrar</p>
                            <p className="font-semibold">{totalPreview !== null ? `C$ ${totalPreview.toFixed(2)}` : "—"}</p>
                        </div>
                        <div className="rounded-lg border p-2 bg-gray-50">
                            <p className="text-[11px] text-gray-500">Utilidad</p>
                            <p className="font-semibold">C$ {(toNum(data.cobroServicio) * qty).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Método de pago */}
                    <label className="flex flex-col">
                        <span className="text-gray-600 font-medium">Método de pago <span className="text-red-500">*</span></span>
                        <select className={inputClass("border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white", !!errors.metodoPago)} value={data.metodoPago} onChange={(e) => handleFieldChange("metodoPago", e.target.value)}>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="pendiente">Pendiente</option>
                        </select>
                        {errors.metodoPago && <p className="text-xs text-red-500 mt-1">{errors.metodoPago}</p>}
                    </label>

                    {/* Pagado */}
                    <label className="flex items-center gap-2 text-gray-700">
                        <input type="checkbox" checked={data.pagado} onChange={(e) => handleFieldChange("pagado", e.target.checked)} disabled={data.metodoPago === "pendiente"} title={data.metodoPago === "pendiente" ? "Si es pendiente no puede marcarse como pagado" : ""} />
                        <span className="text-sm font-medium">¿Pagado?</span>
                    </label>

                    {/* Notas */}
                    <label className="flex flex-col">
                        <span className="text-gray-600 font-medium">Notas</span>
                        <input className="border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 bg-white" value={data.notas} onChange={(e) => handleFieldChange("notas", e.target.value)} />
                    </label>
                </div>

                {/* Botones */}
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Guardar</button>
                </div>
            </div>
        </div>
    );
}