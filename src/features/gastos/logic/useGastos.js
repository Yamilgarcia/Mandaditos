import { useEffect, useState } from "react";
import {
  getGastos,
  setGastos,
  saveGastoLocal,
  updateGastoLocalById,
  markGastoUploadedLocal,
  clearGastoNeedsUpdate,
} from "../data/gastos.local";

import {
  getGastosRemote,
  uploadNewGasto,
  updateRemoteGasto,
} from "../data/gastos.firebase";

import { getTodayStr, getTimeStr } from "../../../utils/date";

// --- utilidades ---
const newId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const toNum = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

// dedupe por originId (fallback a remoteId / id)
function dedupeByOriginId(list) {
  const map = new Map();
  for (const g of list || []) {
    const key = g.originId || g.remoteId || g.id;
    const prev = map.get(key);
    if (!prev) map.set(key, g);
    else {
      // preferimos el que esté sincronizado o tenga remoteId
      const score = (x) => (x.syncStatus === "synced" ? 3 : x.remoteId ? 2 : 1);
      map.set(key, score(g) >= score(prev) ? g : prev);
    }
  }
  return Array.from(map.values());
}

export function useGastos() {
  const [gastos, setGastosState] = useState(getGastos());
  const [syncing, setSyncing] = useState(false);

  // ---- subir nuevos que no han sido subidos ----
  async function pushNewPending(localList) {
    const toUpload = localList.filter((g) => g.needsUpload);

    for (const gasto of toUpload) {
      try {
        // Enviar con originId y datos finales (monto como número)
        const payload = {
          ...gasto,
          monto: toNum(gasto.monto),
        };
        const result = await uploadNewGasto(payload); // debe devolver { remoteId } o similar
        const remoteId = result?.remoteId || result?.id;

        const afterMark = markGastoUploadedLocal(gasto.id, remoteId);
        setGastosState(afterMark);
        localList = afterMark;
      } catch (err) {
        console.warn("No se pudo subir un gasto nuevo:", err);
      }
    }

    return localList;
  }

  // ---- subir updates pendientes (ej si editamos un gasto) ----
  async function pushUpdates(localList) {
    const toUpdate = localList.filter((g) => g.remoteId && g.needsUpdate);

    for (const gasto of toUpdate) {
      try {
        const payload = { ...gasto, monto: toNum(gasto.monto) };
        await updateRemoteGasto(gasto.remoteId, payload);
        const afterClear = clearGastoNeedsUpdate(gasto.id);
        setGastosState(afterClear);
        localList = afterClear;
      } catch (err) {
        console.warn("No se pudo actualizar un gasto remoto:", err);
      }
    }

    return localList;
  }

  // ---- bajar lista remota y fusionar con local (por originId) ----
  async function pullRemoteAndMerge(localList) {
    try {
      const remoteList = await getGastosRemote();
      const merged = dedupeByOriginId([
        ...localList,
        ...(remoteList || []),
      ]);

      setGastos(merged);
      setGastosState(merged);

      return merged;
    } catch (err) {
      console.warn("No se pudo bajar gastos de Firestore:", err);
      return localList;
    }
  }

  // ---- sync completo ----
  async function fullSync() {
    setSyncing(true);
    try {
      let current = getGastos();
      current = await pushNewPending(current);
      current = await pushUpdates(current);
      current = await pullRemoteAndMerge(current);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    fullSync();
    const handleOnline = () => fullSync();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // =======================
  //  API pública
  // =======================

  // Crear gasto (offline-first, idempotente)
  function createGasto({ categoria, monto, nota }) {
    const nuevo = {
      originId: newId(),                         // ← clave idempotente
      createdAt: Date.now(),
      fecha: getTodayStr(),
      hora: getTimeStr(),

      categoria,
      monto: toNum(monto),                       // asegurar número
      nota: nota || "",

      // flags de sync
      syncStatus: navigator.onLine ? "syncing" : "pending",
      needsUpload: true,
      needsUpdate: false,
    };

    saveGastoLocal(nuevo);
    setGastosState(getGastos());
    fullSync();
  }

  // Editar gasto (marca para update si ya está en remoto)
  function editGasto(localId, changes) {
    const current = getGastos().find((g) => g.id === localId);
    const flags = current?.remoteId ? { needsUpdate: true } : {};
    const after = updateGastoLocalById(localId, {
      ...changes,
      monto: changes.monto !== undefined ? toNum(changes.monto) : current?.monto,
      ...flags,
    });
    setGastosState(after);
    fullSync();
  }

  // Eliminar gasto (local + remoto si existe)
  async function deleteGasto(localId) {
    let all = getGastos();
    const target = all.find((g) => g.id === localId);

    if (target?.remoteId) {
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        const { db } = await import("../../../firebase.config");
        await deleteDoc(doc(db, "gastos", target.remoteId));
      } catch (err) {
        console.warn("No se pudo eliminar remoto, se elimina local igual:", err);
      }
    }

    all = all.filter((g) => g.id !== localId);
    setGastos(all);
    setGastosState(all);
  }

  return {
    gastos,
    syncing,
    createGasto,
    editGasto,
    deleteGasto,
    fullSync,
  };
}
