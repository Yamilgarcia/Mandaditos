const STORAGE_KEY = "gastos_data";

// leer todos los gastos locales
export function getGastos() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// sobreescribir todos los gastos locales
export function setGastos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// guardar un nuevo gasto local (pendiente de subir)
export function saveGastoLocal(data) {
  const all = getGastos();

  const newGasto = {
    ...data,
    id: crypto.randomUUID(),   // id local único
    remoteId: null,            // id de Firestore (si no existe aún)
    needsUpload: true,         // hay que subirlo cuando haya internet
    needsUpdate: false,        // aún no es una edición
  };

  all.push(newGasto);
  setGastos(all);
  return newGasto;
}

// actualizar un gasto local por id (por ejemplo si luego querés editarlo)
export function updateGastoLocalById(id, changes) {
  const all = getGastos();

  const updated = all.map(g => {
    if (g.id === id) {
      return {
        ...g,
        ...changes,
        needsUpdate: true, // marcamos que este cambio debe subirse al server
      };
    }
    return g;
  });

  setGastos(updated);
  return updated;
}

// marcar que un gasto ya fue subido completamente al server
export function markGastoUploadedLocal(localId, remoteId) {
  const all = getGastos();
  const updated = all.map(g => {
    if (g.id === localId) {
      return {
        ...g,
        remoteId,
        needsUpload: false,
        needsUpdate: false,
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
  const updated = all.map(g => {
    if (g.id === localId) {
      return {
        ...g,
        needsUpdate: false,
      };
    }
    return g;
  });

  setGastos(updated);
  return updated;
}
