import { useState, useMemo, useEffect } from "react";
import { useMandados } from "../../mandados/logic/useMandados";
import { useGastos } from "../../gastos/logic/useGastos";
import { useAperturaDia } from "../../aperturas/logic/useAperturaDia";
import { getTodayStr } from "../../../utils/date";

/* ================= UTILS ================= */
function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export default function CalculadoraCierre() {
  const today = getTodayStr();
  const [fecha, setFecha] = useState(today);

  // Hooks de datos
  const { mandados } = useMandados();
  const { gastos } = useGastos();
  const { apertura } = useAperturaDia(fecha);

  // Estados de selección
  const [selectedMandados, setSelectedMandados] = useState(new Set());
  const [selectedGastos, setSelectedGastos] = useState(new Set());

  // === 1. Filtrar datos (LÓGICA ACTUALIZADA) ===
  const mandadosDelDia = useMemo(() => {
    return (mandados || [])
      .filter((m) => {
        // A. Creado en la fecha seleccionada (es del día)
        const esDeLaFecha = m.fecha === fecha;
        
        // B. Viejo pero pagado en la fecha seleccionada (Recuperación de deuda)
        // Nota: debe estar pagado Y tener fechaPago igual a la fecha del filtro
        const esViejoPagadoHoy = m.pagado && m.fechaPago === fecha;

        return esDeLaFecha || esViejoPagadoHoy;
      })
      .sort((a, b) => {
        // Ordenar: primero los creados hoy, luego los viejos pagados hoy (o por hora)
        if (a.fecha === b.fecha) return (a.hora || "").localeCompare(b.hora || "");
        return b.fecha.localeCompare(a.fecha); // Pone los más recientes primero
      });
  }, [mandados, fecha]);

  const gastosDelDia = useMemo(() => {
    return (gastos || [])
      .filter((g) => g.fecha === fecha)
      .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  }, [gastos, fecha]);

  // Limpiar selección al cambiar fecha
  useEffect(() => {
    setSelectedMandados(new Set());
    setSelectedGastos(new Set());
  }, [fecha]);

  // === 2. Funciones de selección ===
  const toggleMandado = (id) => {
    const newSet = new Set(selectedMandados);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMandados(newSet);
  };

  const toggleGasto = (id) => {
    const newSet = new Set(selectedGastos);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedGastos(newSet);
  };

  const selectAll = () => {
    if (
      selectedMandados.size === mandadosDelDia.length &&
      selectedGastos.size === gastosDelDia.length
    ) {
      setSelectedMandados(new Set());
      setSelectedGastos(new Set());
    } else {
      setSelectedMandados(new Set(mandadosDelDia.map((m) => m.id)));
      setSelectedGastos(new Set(gastosDelDia.map((g) => g.id)));
    }
  };

  // === 3. Lógica Matemática ===
  const calculo = useMemo(() => {
    const base = toNum(apertura?.cajaInicial || 0);

    let ingresosMandados = 0;
    let egresosMandados = 0;

    mandadosDelDia.forEach((m) => {
      if (selectedMandados.has(m.id)) {
        const gastoCompra = toNum(m.gastoCompra);
        const cobroServicio = toNum(m.cobroServicio);
        const totalCobrar = toNum(m.totalCobrar) || (gastoCompra + cobroServicio);
        const esViejo = m.fecha !== fecha;

        // LÓGICA DE SALIDAS (COMPRAS):
        // Si el mandado es de HOY, asumimos que sacaste dinero hoy para comprarlo.
        // Si el mandado es VIEJO (ej. de ayer), el dinero de la compra ya salió ayer, 
        // así que HOY no restamos nada, solo sumamos el cobro (recuperación).
        if (!esViejo) {
          egresosMandados += gastoCompra;
        }

        // LÓGICA DE ENTRADAS (COBROS):
        if (m.metodoPago === "efectivo") {
          ingresosMandados += totalCobrar;
        }
      }
    });

    let egresosGastos = 0;
    gastosDelDia.forEach((g) => {
      if (selectedGastos.has(g.id)) {
        egresosGastos += toNum(g.monto);
      }
    });

    const totalCaja = base - egresosMandados + ingresosMandados - egresosGastos;

    return { base, ingresosMandados, egresosMandados, egresosGastos, totalCaja };
  }, [apertura, mandadosDelDia, gastosDelDia, selectedMandados, selectedGastos, fecha]);

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-32">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          🧮 Calculadora de Caja
        </h1>
        <div className="flex items-center justify-between mt-2">
          <input
            type="date"
            className="text-sm border rounded-lg px-2 py-1 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <button
            onClick={selectAll}
            className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1 rounded border border-blue-200"
          >
            {selectedMandados.size === mandadosDelDia.length && mandadosDelDia.length > 0
              ? "Desmarcar todo"
              : "Marcar todo"}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        
        {/* 1. APERTURA */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            1. Base (Caja Inicial)
          </h2>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
            <span className="text-gray-700 text-sm">Inicio del día</span>
            <span className="font-bold text-gray-900">C$ {fmt(calculo.base)}</span>
          </div>
        </section>

        {/* 2. MANDADOS (DEL DÍA + VIEJOS PAGADOS HOY) */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              2. Mandados ({mandadosDelDia.length})
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Marcados: {selectedMandados.size}
            </span>
          </div>

          {mandadosDelDia.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">No hay movimientos registrados hoy.</p>
          ) : (
            <div className="space-y-2">
              {mandadosDelDia.map((m) => {
                const isSelected = selectedMandados.has(m.id);
                const isTransfer = m.metodoPago === "transferencia";
                const isOld = m.fecha !== fecha; // Es un cobro de un día anterior
                const total = toNum(m.totalCobrar);
                
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMandado(m.id)}
                    className={`relative p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-white border-gray-200 opacity-80"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isSelected && <span className="text-xs font-bold">✓</span>}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? "text-blue-900" : "text-gray-600"}`}>
                            {m.clienteNombre}
                            {isOld && (
                              <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                                De {m.fecha}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate w-40">
                            {m.descripcion}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <p className={`text-sm font-bold ${isSelected ? "text-gray-900" : "text-gray-500"}`}>
                          C$ {fmt(total)}
                        </p>
                        <div className="flex gap-1">
                            {isTransfer ? (
                              <span className="text-[10px] text-purple-600 bg-purple-50 px-1 rounded border border-purple-100">
                                Transf. 📲
                              </span>
                            ) : (
                              <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-100">
                                Efectivo 💵
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. GASTOS */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            3. Gastos / Salidas ({gastosDelDia.length})
          </h2>
          {gastosDelDia.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-2">No hay gastos hoy.</p>
          ) : (
            <div className="space-y-2">
              {gastosDelDia.map((g) => {
                const isSelected = selectedGastos.has(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => toggleGasto(g.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                      isSelected
                        ? "bg-red-50 border-red-300 shadow-sm"
                        : "bg-white border-gray-200 opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          isSelected
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && <span className="text-xs font-bold">✓</span>}
                      </div>
                      <span className={`text-sm font-medium capitalize ${isSelected ? "text-red-900" : "text-gray-600"}`}>
                        {g.categoria}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${isSelected ? "text-red-700" : "text-gray-400"}`}>
                      - C$ {fmt(toNum(g.monto))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* FOOTER FIXED */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-30">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm text-gray-500 font-medium">Caja Esperada</span>
            <span className={`text-2xl font-black ${calculo.totalCaja >= 0 ? "text-gray-900" : "text-red-600"}`}>
              C$ {fmt(calculo.totalCaja)}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 border-t pt-2">
            <span>Base: {fmt(calculo.base)}</span>
            <span>Entr: +{fmt(calculo.ingresosMandados)}</span>
            <span>Comp: -{fmt(calculo.egresosMandados)}</span>
            <span>Gastos: -{fmt(calculo.egresosGastos)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}