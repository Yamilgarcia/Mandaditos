const STORAGE_KEY = "gastos_data";

// --- utils ---
const ensureNumber = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const newLocalId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

// leer todos los gastos locales
export function getGastos() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// sobreescribir todos los gastos locales
export function setGastos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// guardar un nuevo gasto local (idempotente por originId)
export function saveGastoLocal(data) {
  const all = getGastos();

  // normalizamos número y flags por si no vienen
  const payload = {
    ...data,
    monto: ensureNumber(data.monto),
    originId: data.originId || newLocalId(), // si no vino, lo generamos
    syncStatus: data.syncStatus || (navigator.onLine ? "syncing" : "pending"),
    needsUpload: data.needsUpload !== undefined ? data.needsUpload : true,
    needsUpdate: data.needsUpdate !== undefined ? data.needsUpdate : false,
  };

  // si ya existe por originId (o remoteId) => upsert para NO duplicar
  const idxByOrigin = all.findIndex(
    (g) =>
      (payload.originId && g.originId === payload.originId) ||
      (payload.remoteId && g.remoteId && g.remoteId === payload.remoteId)
  );

  if (idxByOrigin >= 0) {
    const merged = {
      ...all[idxByOrigin],
      ...payload,
      // preservamos ids locales y remotos existentes
      id: all[idxByOrigin].id || newLocalId(),
      remoteId: payload.remoteId ?? all[idxByOrigin].remoteId ?? null,
    };
    all[idxByOrigin] = merged;
    setGastos(all);
    return merged;
  }

  // si no existía, creamos uno nuevo con id local
  const newGasto = {
    ...payload,
    id: newLocalId(), // id local único
    remoteId: payload.remoteId ?? null, // id de Firestore (si no existe aún)
  };

  all.push(newGasto);
  setGastos(all);
  return newGasto;
}

// actualizar un gasto local por id
export function updateGastoLocalById(id, changes) {
  const all = getGastos();

  const updated = all.map((g) => {
    if (g.id !== id) return g;

    const next = {
      ...g,
      ...changes,
      monto:
        changes.monto !== undefined ? ensureNumber(changes.monto) : g.monto,
      // Si el hook no envía needsUpdate, y ya hay remoteId, marcamos update;
      // si el hook lo envía explícito, respetamos su valor.
      needsUpdate:
        changes.needsUpdate !== undefined
          ? changes.needsUpdate
          : g.remoteId
          ? true
          : g.needsUpdate ?? false,
      // syncStatus: si hay cambios y tenemos remoteId, probablemente quede "syncing"
      syncStatus:
        changes.syncStatus !== undefined
          ? changes.syncStatus
          : g.remoteId
          ? "syncing"
          : g.syncStatus ?? "pending",
    };

    return next;
  });

  setGastos(updated);
  return updated;
}

// marcar que un gasto ya fue subido completamente al server
export function markGastoUploadedLocal(localId, remoteId) {
  const all = getGastos();
  const updated = all.map((g) => {
    if (g.id === localId) {
      return {
        ...g,
        remoteId,
        needsUpload: false,
        needsUpdate: false,
        syncStatus: "synced",
      };
    }
    return g;
  });
  setGastos(updated);
  return updated;
}

// marcar que ya subimos el update pendiente al server
export function clearGastoNeedsUpdate(localId) {
  const all = getGastos();
  const updated = all.map((g) => {
    if (g.id === localId) {
      return {
        ...g,
        needsUpdate: false,
        syncStatus: "synced",
      };
    }
    return g;
  });

  setGastos(updated);
  return updated;
}
