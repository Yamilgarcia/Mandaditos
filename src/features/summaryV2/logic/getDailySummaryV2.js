// === Resumen del Día (nuevo): cálculos con distinción PAGADO vs PENDIENTE ===
function toNum(v) { const n = Number(v); return Number.isNaN(n) ? 0 : n; }
const qty = (x) => Math.max(1, toNum(x ?? 1));

/**
 * Calcula KPIs del día (HOY = ymd) y agrega pendientes GLOBAL (todas las fechas)
 * @param {{ mandados: any[], gastos: any[], aperturaMonto: number }} data
 * @param {string} ymd - "YYYY-MM-DD"
 */
export function getDailySummaryV2({ mandados = [], gastos = [], aperturaMonto = 0 }, ymd) {
  // ---- Normalización común (TODAS las fechas) ----
  const all = (mandados || []).map(m => {
    const gasto   = toNum(m.gastoCompra);
    const fee     = toNum(m.cobroServicio);
    const q       = qty(m.cantidad);
    const tot     = toNum(m.totalCobrar ?? (gasto + fee * q));
    const uti     = toNum(m.utilidad    ?? (fee * q));
    const metodo  = (m.metodoPago || "efectivo").toLowerCase();
    const pagadoFlag = !!m.pagado;

    // Regla robusta para "pendiente":
    // - explícito por método "pendiente"
    // - o cuando NO está marcado pagado y no es un método de cobro inmediato
    const esPendiente =
      (metodo === "pendiente") ||
      (!pagadoFlag && metodo !== "efectivo" && metodo !== "tarjeta" && metodo !== "transferencia");

    return {
      fecha: m.fecha,
      gasto, fee, q, tot, uti,
      cliente: m.clienteNombre || "",
      metodo,
      hora: (m.hora || "00:00").slice(0, 2),
      esPendiente,
    };
  });

  // ---- HOY (filtrado por fecha) ----
  const ms = all.filter(x => x.fecha === ymd);

  // Conteos HOY
  const mandadosCountRegistros = ms.length;
  const mandadosHechos = ms.reduce((a, x) => a + x.q, 0);

  // Reembolsos e ingresos HOY
  const reembolsoCompras = ms.reduce((a, x) => a + x.gasto, 0);
  const ingresoServicioTotal = ms.reduce((a, x) => a + x.uti, 0);
  const ingresoServicioPagado = ms.filter(x => !x.esPendiente).reduce((a, x) => a + x.uti, 0);
  const ingresoServicioPendiente = ingresoServicioTotal - ingresoServicioPagado;

  // Totales a cobrar HOY (gasto + servicio*q)
  const totalCobrarTotal = ms.reduce((a, x) => a + x.tot, 0);
  const totalCobrarPagado = ms.filter(x => !x.esPendiente).reduce((a, x) => a + x.tot, 0);
  const totalCobrarPendiente = totalCobrarTotal - totalCobrarPagado;

  // Egresos HOY
  const egresos = (gastos || [])
    .filter(g => g?.fecha === ymd)
    .reduce((a, g) => a + toNum(g.monto), 0);

  const apertura = toNum(aperturaMonto);

  // Cajas HOY
  const cajaEsperada = apertura + ingresoServicioPagado - egresos; // solo lo cobrado hoy
  const cajaTotalInfo = apertura + ingresoServicioTotal - egresos; // informativa (incluye pendientes hoy)

  const clientesUnicos = new Set(ms.map(x => x.cliente)).size;

  // Desgloses HOY
  const porMetodoCobrado = ms.reduce((a, x) => {
    a[x.metodo] = (a[x.metodo] || 0) + x.tot;
    return a;
  }, {});

  const porHora = ms.reduce((a, x) => {
    a[x.hora] = (a[x.hora] || 0) + 1;
    return a;
  }, {});

  // ---- NUEVO: Pendientes GLOBAL (todas las fechas) ----
  const pendientesGlobal = all.filter(x => x.esPendiente);
  const pendienteGlobalTotalCobrar = pendientesGlobal.reduce((a, x) => a + x.tot, 0);
  const pendienteGlobalUtilidad    = pendientesGlobal.reduce((a, x) => a + x.uti, 0);

  return {
    fecha: ymd,

    // Conteos HOY
    mandadosCountRegistros,
    mandadosHechos,
    clientesUnicos,

    // Ingresos (utilidad) HOY
    ingresoServicioTotal,
    ingresoServicioPagado,
    ingresoServicioPendiente,

    // Total a cobrar HOY
    totalCobrarTotal,
    totalCobrarPagado,
    totalCobrarPendiente,

    // Otros HOY
    reembolsoCompras,
    egresos,
    apertura,

    // Cajas HOY
    cajaEsperada,
    cajaTotalInfo,

    // Desgloses HOY
    porMetodoCobrado,
    porHora,

    // === GLOBAL (todas las fechas) ===
    pendienteGlobalTotalCobrar,
    pendienteGlobalUtilidad,
  };
}
