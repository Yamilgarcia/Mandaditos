const STORAGE_KEY = "aperturas_data";

export function getAperturas() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setAperturas(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Obtener por fecha (YYYY-MM-DD)
export function getAperturaByDateLocal(fecha) {
  const all = getAperturas();
  const same = all.filter((a) => a.fecha === fecha);
  if (same.length === 0) return null;
  return same.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
}

// Crear nueva (solo cajaInicial + notas)
export function saveAperturaLocal(data) {
  const all = getAperturas();
  const item = {
    fecha: data.fecha,
    cajaInicial: Number(data.cajaInicial || 0),
    notas: data.notas || "",
    id: crypto.randomUUID(),
    remoteId: null,
    needsUpload: true,
    needsUpdate: false,
    createdAt: Date.now(),
  };
  all.push(item);
  setAperturas(all);
  return item;
}

// Actualizar por fecha (marca needsUpdate)
export function updateAperturaLocalByDate(fecha, changes) {
  const all = getAperturas();
  const updated = all.map((a) => {
    if (a.fecha === fecha) {
      return {
        ...a,
        cajaInicial:
          changes.cajaInicial !== undefined ? Number(changes.cajaInicial || 0) : a.cajaInicial,
        notas: changes.notas !== undefined ? changes.notas : a.notas,
        needsUpdate: true,
      };
    }
    return a;
  });
  setAperturas(updated);
  return updated;
}

export function markUploadedLocal(localId, remoteId) {
  const all = getAperturas();
  const updated = all.map((a) => {
    if (a.id === localId) {
      return {
        ...a,
        remoteId,
        needsUpload: false,
        needsUpdate: false,
      };
    }
    return a;
  });
  setAperturas(updated);
  return updated;
}

export function clearNeedsUpdate(localId) {
  const all = getAperturas();
  const updated = all.map((a) => {
    if (a.id === localId) return { ...a, needsUpdate: false };
    return a;
  });
  setAperturas(updated);
  return updated;
}
