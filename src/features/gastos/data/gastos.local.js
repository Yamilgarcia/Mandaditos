const STORAGE_KEY = "gastos_data";

export function getGastos() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveGastoLocal(gasto) {
  const all = getGastos();

  const withId = {
    ...gasto,
    id: crypto.randomUUID(),
  };

  all.push(withId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  return withId;
}

export function clearGastos() {
  localStorage.removeItem(STORAGE_KEY);
}
