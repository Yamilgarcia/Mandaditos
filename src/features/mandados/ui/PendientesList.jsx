import { useState, useMemo } from "react";
import { useMandados } from "../logic/useMandados";
import { useToast } from "../../../components/ToastContext"; // ajustá la ruta si cambia en tu proyecto

function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function getTotalCobrar(m) {
  if (m.totalCobrar !== undefined) return toNum(m.totalCobrar);
  // fallback para registros antiguos
  const calc = toNum(m.gastoCompra) + toNum(m.cobroServicio);
  const legacy = toNum(m.monto);
  return calc > 0 ? calc : legacy;
}

export default function PendientesList() {
  const { mandados, markAsPaid } = useMandados();
  const { showToast } = useToast();

  const [seleccionPago, setSeleccionPago] = useState({}); 
  // paginado
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // pendientes ordenados por fecha desc y hora desc (si existe)
  const pendientesOrdenados = useMemo(() => {
    return mandados
      .filter((m) => !m.pagado)
      .slice()
      .sort((a, b) => {
        const fa = a.fecha || "";
        const fb = b.fecha || "";
        if (fa < fb) return 1;
        if (fa > fb) return -1;
        const ha = typeof a.hora === "string" ? a.hora : "";
        const hb = typeof b.hora === "string" ? b.hora : "";
        if (ha < hb) return 1;
        if (ha > hb) return -1;
        return (a.id || "").localeCompare(b.id || "");
      });
  }, [mandados]);

  // paginación
  const total = pendientesOrdenados.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pendientes = pendientesOrdenados.slice(startIndex, endIndex);

  if (total === 0) {
    return (
      <p className="text-center text-gray-500 mt-6">
        No tenés pagos pendientes 🎉
      </p>
    );
  }

  async function handleMarkAsPaid(m) {
    const metodo = seleccionPago[m.id] || "efectivo";

    try {
      // actualizamos estado local offline-first
      await markAsPaid(m.id, metodo);

      if (!navigator.onLine) {
        showToast("📦 Marcado como pagado (offline). Se sincroniza cuando haya internet.", "info");
      } else {
        showToast(`Pagado por ${metodo}`, "success");
      }
    } catch (e) {
      console.error(e);
      showToast("❌ No se pudo marcar como pagado. Probá de nuevo.", "error");
    }
  }

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  return (
    <div className="max-w-md mx-auto mt-6 space-y-3">
      {/* barra de control (paginado) */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow border">
        <div className="text-sm text-gray-600">
          Pendientes: <span className="font-semibold">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Por página:</label>
          <select
            className="border rounded-lg p-1 bg-white text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {pendientes.map((m) => {
        const totalCobrar = getTotalCobrar(m);

        return (
          <div
            key={m.id}
            className="p-4 rounded-xl shadow-md bg-yellow-50 border border-yellow-200"
          >
            <div className="flex justify-between">
              <h3 className="font-semibold text-gray-800">{m.clienteNombre}</h3>
              <span className="text-sm text-gray-500">
                {m.fecha}{m.hora ? ` • ${m.hora}` : ""}
              </span>
            </div>

            <p className="text-gray-600">{m.descripcion}</p>

            <p className="text-gray-800 font-medium mt-1">
              Te debe: C$ {fmt(totalCobrar)}
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
              onClick={() => handleMarkAsPaid(m)}
            >
              Marcar como Pagado
            </button>

            {!navigator.onLine && (
              <p className="text-[11px] text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center mt-2">
                Estás sin internet. Guardamos local y sincronizamos cuando vuelva 📶
              </p>
            )}
          </div>
        );
      })}

      {/* paginador */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow border">
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
    </div>
  );
}
