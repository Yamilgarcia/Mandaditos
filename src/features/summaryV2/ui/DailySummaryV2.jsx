import { useMemo, useState } from "react";
import { getTodayStr } from "../../../utils/date";
import { getDailySummaryV2 } from "../logic/getDailySummaryV2";

import { useMandados } from "../../mandados/logic/useMandados";
import { useGastos } from "../../gastos/logic/useGastos";
import { useAperturaDia } from "../../aperturas/logic/useAperturaDia";

export default function DailySummaryV2() {
  const [fecha, setFecha] = useState(getTodayStr());
  const [modo, setModo] = useState("pagado"); // "pagado" | "total"

  const { mandados = [] } = useMandados?.() || { mandados: [] };
  const { gastos = [] } = useGastos?.() || { gastos: [] };
  const { apertura } = useAperturaDia(fecha);
  const aperturaMonto = Number(apertura?.cajaInicial || 0);

  const r = useMemo(
    () => getDailySummaryV2({ mandados, gastos, aperturaMonto }, fecha),
    [mandados, gastos, aperturaMonto, fecha]
  );

  const C = (n) =>
    `C$ ${Number(n || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const ingresoServicio =
    modo === "pagado" ? r.ingresoServicioPagado : r.ingresoServicioTotal;
  const totalCobrar =
    modo === "pagado" ? r.totalCobrarPagado : r.totalCobrarTotal;
  const caja = modo === "pagado" ? r.cajaEsperada : r.cajaTotalInfo;

  return (
    <div className="px-3 sm:px-4 md:px-6 py-3 max-w-6xl mx-auto w-full">
      {/* Header responsive */}
      <header className="mb-4 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-xl font-bold leading-tight">Resumen del día (nuevo)</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm w-full sm:w-48"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <ModeToggle modo={modo} setModo={setModo} />
        </div>
      </header>

      {/* KPIs principales */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Mandados (registros)" value={r.mandadosCountRegistros} />
        <KPI label="Mandados hechos (cantidad)" value={r.mandadosHechos} />
        <KPI label="Clientes únicos" value={r.clientesUnicos} />
        <KPI
          label={`Ingreso servicio ${modo === "pagado" ? "(pagado)" : "(total)"}`}
          value={C(ingresoServicio)}
        />
        <KPI label="Gasto en compras" value={C(r.reembolsoCompras)} />
        <KPI
          label={`Total a cobrar ${modo === "pagado" ? "(pagado)" : "(total)"}`}
          value={C(totalCobrar)}
        />
        <KPI label="Gastos" value={C(r.egresos)} />
        <KPI label="Apertura" value={C(r.apertura)} />
        <KPI
          label={modo === "pagado" ? "Caja esperada" : "Caja (info total)"}
          value={C(caja)}
        />
      </section>

      {/* Bloques informativos (compactos en móvil) */}
      <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Info
          label="Ganado (utilidad pagada)"
          value={C(r.ingresoServicioPagado)}
          accent="text-emerald-700"
        />
        <Info
          label="Pendiente cobrar (utilidad)"
          value={C(r.ingresoServicioPendiente)}
          accent="text-amber-700"
        />
        <Info label="Ingresado hoy (info total)" value={C(r.ingresoServicioTotal)} />
      </section>

      {/* Desgloses */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Por método de pago (totalCobrar)">
          <ListKV
            rows={Object.entries(r.porMetodoCobrado).map(([k, v]) => [k, C(v)])}
            empty="Sin datos"
          />
        </Card>

        <Card title="Mandados por hora (registros)">
          <ListKV
            rows={Object.keys(r.porHora)
              .sort()
              .map((h) => [`${h}:00`, r.porHora[h]])}
            empty="Sin datos"
          />
        </Card>
      </section>

      <p className="text-[11px] sm:text-xs text-gray-500 mt-6">
        Nota: “Caja esperada” usa solo utilidad <b>pagada</b>. “Caja (info total)”
        incluye pendientes.
      </p>
    </div>
  );
}

/* ==== UI helpers con estilos móviles ==== */

function ModeToggle({ modo, setModo }) {
  return (
    <div className="flex w-full sm:w-auto rounded-lg border overflow-hidden">
      <button
        className={`flex-1 sm:flex-none px-3 py-2 text-sm ${
          modo === "pagado" ? "bg-gray-900 text-white" : "bg-white text-gray-700"
        }`}
        onClick={() => setModo("pagado")}
      >
        Solo pagado
      </button>
      <button
        className={`flex-1 sm:flex-none px-3 py-2 text-sm ${
          modo === "total" ? "bg-gray-900 text-white" : "bg-white text-gray-700"
        }`}
        onClick={() => setModo("total")}
      >
        Total (info)
      </button>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="bg-white/95 rounded-xl sm:rounded-2xl shadow p-3 sm:p-4">
      <div className="text-xs sm:text-sm text-gray-500 line-clamp-1">{label}</div>
      <div className="text-base sm:text-lg font-semibold break-words">{value}</div>
    </div>
  );
}
function Info({ label, value, accent = "" }) {
  return (
    <div className="bg-white/95 rounded-xl sm:rounded-2xl shadow p-3 sm:p-4">
      <div className={`text-xs sm:text-sm ${accent || "text-gray-500"} line-clamp-1`}>{label}</div>
      <div className="text-base sm:text-lg font-semibold break-words">{value}</div>
    </div>
  );
}
function Card({ title, children }) {
  return (
    <div className="bg-white/95 rounded-xl sm:rounded-2xl shadow p-3 sm:p-4">
      <h2 className="font-semibold mb-3 text-sm sm:text-base">{title}</h2>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
function ListKV({ rows = [], empty }) {
  if (!rows.length) return <div className="text-gray-500 text-sm">{empty}</div>;
  return (
    <ul className="space-y-1">
      {rows.map(([k, v]) => (
        <li
          key={k}
          className="flex justify-between items-center gap-3 border-b last:border-0 py-1 text-sm"
        >
          <span className="capitalize truncate">{k}</span>
          <span className="font-medium shrink-0">{v}</span>
        </li>
      ))}
    </ul>
  );
}
