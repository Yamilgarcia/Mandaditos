const STORAGE_KEY = "mandados_data";

export function getMandados() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function setMandados(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// guardar uno nuevo (con id local único)
export function saveMandado(mandado) {
  const all = getMandados();
  const withId = {
    ...mandado,
    id: crypto.randomUUID(),
  };
  all.push(withId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return withId;
}

export function updateMandadoById(id, changes) {
  const all = getMandados();
  const updated = all.map((m) =>
    m.id === id ? { ...m, ...changes } : m
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearMandados() {
  localStorage.removeItem(STORAGE_KEY);
}
