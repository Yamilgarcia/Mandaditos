import { useState } from "react";
import { useAperturaDia } from "../logic/useAperturaDia";
import { useToast } from "../../../components/ToastContext";
import { getTodayStr } from "../../../utils/date";

export default function AperturaDiaCard({ fecha = getTodayStr() }) {
  const { apertura, crearApertura, editarApertura, syncing } = useAperturaDia(fecha);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    cajaInicial: "",
    notas: "",
  });
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({ cajaInicial: "", notas: "" });

  const isCreated = !!apertura;

  function startEdit() {
    if (!apertura) return;
    setForm({
      cajaInicial: String(apertura.cajaInicial ?? ""),
      notas: apertura.notas ?? "",
    });
    setErrors({ cajaInicial: "", notas: "" });
    setEditing(true);
  }

  function sanitizeNum(val) {
    if (typeof val !== "string") return val;
    return val.replace(",", ".");
  }

  function validate() {
    const e = { cajaInicial: "", notas: "" };
    const ci = Number(sanitizeNum(isCreated ? form.cajaInicial : form.cajaInicial || 0));
    if (Number.isNaN(ci) || ci < 0) e.cajaInicial = "Caja inicial debe ser un número ≥ 0";
    if (form.notas && form.notas.length > 120) e.notas = "Máximo 120 caracteres";
    setErrors(e);
    return !(e.cajaInicial || e.notas);
  }

  function handleCreate() {
    if (!validate()) return;
    try {
      const ci = Number(sanitizeNum(form.cajaInicial || 0));
      crearApertura({ cajaInicial: ci, notas: form.notas || "" });
      showToast("Apertura de día guardada", "success");
      setForm({ cajaInicial: "", notas: "" });
    } catch {
      showToast("No se pudo guardar la apertura", "error");
    }
  }

  function handleUpdate() {
    if (!validate()) return;
    try {
      const ci = Number(sanitizeNum(form.cajaInicial || 0));
      editarApertura({ cajaInicial: ci, notas: form.notas || "" });
      showToast("Apertura actualizada", "success");
      setEditing(false);
    } catch {
      showToast("No se pudo actualizar la apertura", "error");
    }
  }

  if (!isCreated) {
    return (
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow border border-white/30 text-gray-800 mt-4">
        <h3 className="font-semibold text-gray-800">¿Con cuánto efectivo iniciaste hoy?</h3>
        <p className="text-xs text-gray-500 mb-3">Fecha: {fecha}</p>

        <div className="flex flex-col">
          <label className="text-sm text-gray-700">Caja inicial (C$) *</label>
          <input
            type="number" min="0" step="0.01"
            value={form.cajaInicial}
            onChange={(e) => setForm((p) => ({ ...p, cajaInicial: e.target.value }))}
            className={`rounded-lg p-2 border ${errors.cajaInicial ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"} focus:outline-none focus:ring-2 bg-white`}
            placeholder="0.00"
          />
          {errors.cajaInicial && <p className="text-xs text-red-500 mt-1">{errors.cajaInicial}</p>}
        </div>

        <div className="flex flex-col mt-2">
          <label className="text-sm text-gray-700">Notas (opcional)</label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
            className={`rounded-lg p-2 border ${errors.notas ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"} focus:outline-none focus:ring-2 bg-white resize-none`}
            maxLength={120}
            placeholder="Algo a destacar del inicio del día…"
          />
          {errors.notas && <p className="text-xs text-red-500 mt-1">{errors.notas}</p>}
        </div>

        <button
          className="mt-3 w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 active:scale-[.98]"
          onClick={handleCreate}
          disabled={syncing}
        >
          Guardar apertura
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow border border-white/30 text-gray-800 mt-4">
      {!editing ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Apertura del día</h3>
              <p className="text-xs text-gray-500">Fecha: {fecha}</p>
            </div>
            <span className="text-[11px] px-2 py-[2px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              Guardada
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-2">
            <div className="rounded-lg border p-2 bg-gray-50">
              <p className="text-[11px] text-gray-500">Caja inicial</p>
              <p className="font-semibold">C$ {Number(apertura.cajaInicial || 0).toFixed(2)}</p>
            </div>
          </div>

          {apertura.notas ? (
            <p className="text-xs text-gray-600 mt-2">Notas: {apertura.notas}</p>
          ) : null}

          <button
            className="mt-3 w-full bg-gray-700 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-800 active:scale-[.98]"
            onClick={startEdit}
          >
            Editar apertura
          </button>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-gray-800">Editar apertura</h3>

          <div className="flex flex-col mt-2">
            <label className="text-sm text-gray-700">Caja inicial (C$)</label>
            <input
              type="number" min="0" step="0.01"
              value={form.cajaInicial}
              onChange={(e) => setForm((p) => ({ ...p, cajaInicial: e.target.value }))}
              className={`rounded-lg p-2 border ${errors.cajaInicial ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"} focus:outline-none focus:ring-2 bg-white`}
            />
            {errors.cajaInicial && <p className="text-xs text-red-500 mt-1">{errors.cajaInicial}</p>}
          </div>

          <div className="flex flex-col mt-2">
            <label className="text-sm text-gray-700">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              className={`rounded-lg p-2 border ${errors.notas ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"} focus:outline-none focus:ring-2 bg-white resize-none`}
              maxLength={120}
            />
            {errors.notas && <p className="text-xs text-red-500 mt-1">{errors.notas}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              className="w-full bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
            <button
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700"
              onClick={handleUpdate}
            >
              Guardar cambios
            </button>
          </div>
        </>
      )}

      {syncing && (
        <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 text-center mt-2">
          Sincronizando…
        </p>
      )}
      {!navigator.onLine && (
        <p className="text-[11px] text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center mt-2">
          Estás sin internet. Guardamos local y sincronizamos cuando vuelva 📶
        </p>
      )}
    </div>
  );
}
