const STORAGE_KEY = "mandados_data";

// leer todo lo local
export function getMandados() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// sobreescribir todo lo local
export function setMandados(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// crear un nuevo mandado local
export function saveMandadoLocal(data) {
  const all = getMandados();

  const newMandado = {
    ...data,
    id: crypto.randomUUID(),   // id local
    remoteId: null,            // id en Firestore (todavía no)
    needsUpload: true,         // hay que subirlo cuando haya internet
    needsUpdate: false,        // no es update, es nuevo
  };

  all.push(newMandado);
  setMandados(all);
  return newMandado;
}

// reemplazar un mandado específico por id local
export function updateMandadoLocalById(id, changes) {
  const all = getMandados();
  const updated = all.map(m => {
    if (m.id === id) {
      return {
        ...m,
        ...changes,
        // si estoy cambiando algo (ej marcar pagado),
        // debo sincronizar ese cambio al server:
        needsUpdate: true,
      };
    }
    return m;
  });
  setMandados(updated);
  return updated;
}

// marcar un mandado como sincronizado con Firestore
// (por ejemplo, después de subirlo)
export function markUploadedLocal(localId, remoteId) {
  const all = getMandados();
  const updated = all.map(m => {
    if (m.id === localId) {
      return {
        ...m,
        remoteId,
        needsUpload: false,
        needsUpdate: false,
      };
    }
    return m;
  });
  setMandados(updated);
  return updated;
}

// marcar que una actualización ya se subió
export function clearNeedsUpdate(localId) {
  const all = getMandados();
  const updated = all.map(m => {
    if (m.id === localId) {
      return {
        ...m,
        needsUpdate: false,
      };
    }
    return m;
  });
  setMandados(updated);
  return updated;
}
