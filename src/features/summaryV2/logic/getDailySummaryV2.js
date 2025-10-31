// === Resumen del Día (nuevo): cálculos con distinción PAGADO vs PENDIENTE ===
function toNum(v){ const n = Number(v); return Number.isNaN(n) ? 0 : n; }
const qty = (x)=> Math.max(1, toNum(x ?? 1));

export function getDailySummaryV2({ mandados = [], gastos = [], aperturaMonto = 0 }, ymd) {
  const ms = mandados
    .filter(m => m?.fecha === ymd)
    .map(m => {
      const gasto = toNum(m.gastoCompra);
      const fee   = toNum(m.cobroServicio);
      const q     = qty(m.cantidad);
      const tot   = toNum(m.totalCobrar ?? (gasto + fee*q));
      const uti   = toNum(m.utilidad    ?? (fee*q));
      const metodo = (m.metodoPago || "efectivo").toLowerCase();
      const pagadoFlag = !!m.pagado; // por si lo usas
      const esPendiente = (metodo === "pendiente") || (!pagadoFlag && metodo !== "efectivo" && metodo !== "tarjeta" && metodo !== "transferencia" ? false : (metodo === "pendiente"));

      return {
        gasto, fee, q, tot, uti,
        cliente: m.clienteNombre || "",
        metodo,
        hora: (m.hora || "00:00").slice(0,2),
        esPendiente,
      };
    });

  // Totales
  const mandadosCountRegistros = ms.length;
  const mandadosHechos = ms.reduce((a,x)=> a + x.q, 0); // suma cantidades

  const reembolsoCompras = ms.reduce((a,x)=> a + x.gasto, 0);
  const ingresoServicioTotal = ms.reduce((a,x)=> a + x.uti, 0);
  const ingresoServicioPagado = ms.filter(x=>!x.esPendiente).reduce((a,x)=> a + x.uti, 0);
  const ingresoServicioPendiente = ingresoServicioTotal - ingresoServicioPagado;

  const totalCobrarTotal = ms.reduce((a,x)=> a + x.tot, 0);
  const totalCobrarPagado = ms.filter(x=>!x.esPendiente).reduce((a,x)=> a + x.tot, 0);
  const totalCobrarPendiente = totalCobrarTotal - totalCobrarPagado;

  const egresos = gastos
    .filter(g => g?.fecha === ymd)
    .reduce((a,g)=> a + toNum(g.monto), 0);

  const apertura = toNum(aperturaMonto);

  // Cajas:
  // - Caja "operativa" o esperada (lo que realmente debes tener): solo lo pagado
  const cajaEsperada = apertura + ingresoServicioPagado - egresos;
  // - Caja con info total (pagado + pendiente): informativa
  const cajaTotalInfo = apertura + ingresoServicioTotal - egresos;

  const clientesUnicos = new Set(ms.map(x=>x.cliente)).size;

  // Desgloses
  const porMetodoCobrado = ms.reduce((a,x)=>{
    a[x.metodo] = (a[x.metodo] || 0) + x.tot;
    return a;
  }, {});
  const porHora = ms.reduce((a,x)=>{ a[x.hora]=(a[x.hora]||0)+1; return a; }, {});

  return {
    fecha: ymd,
    // Conteos
    mandadosCountRegistros,
    mandadosHechos,
    clientesUnicos,

    // Ingresos (utilidad)
    ingresoServicioTotal,
    ingresoServicioPagado,
    ingresoServicioPendiente,

    // Total a cobrar (gasto + servicio*q)
    totalCobrarTotal,
    totalCobrarPagado,
    totalCobrarPendiente,

    // Otros
    reembolsoCompras,
    egresos,
    apertura,

    // Cajas
    cajaEsperada,   // = apertura + utilidadPagada - egresos  (como tu “caja esperada”)
    cajaTotalInfo,  // = apertura + utilidadTotal - egresos   (informativa)

    // Desgloses
    porMetodoCobrado,
    porHora,
  };
}
