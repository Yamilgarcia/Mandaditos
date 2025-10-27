import { useEffect, useState } from "react";
import {
  getMandados,
  setMandados,
  saveMandadoLocal,
  updateMandadoLocalById,
  markUploadedLocal,
  clearNeedsUpdate,
} from "../data/mandados.local";

import {
  getMandadosRemote,
  uploadNewMandado,
  updateRemoteMandado,
} from "../data/mandados.firebase";

// === util: id único (originId) ===
const newId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// Derivados consistentes
function withDerivatives(m) {
  const gasto = toNum(m.gastoCompra);
  const fee = toNum(m.cobroServicio);
  return {
    ...m,
    totalCobrar: gasto + fee,
    utilidad: fee,
  };
}

// Dedupe por originId (fallback a remoteId, luego id)
function dedupeByOriginId(list) {
  const map = new Map();
  for (const m of list) {
    const key = m.originId || m.remoteId || m.id;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, m);
    } else {
      // preferimos el que esté sincronizado o tenga remoteId
      const score = (x) => (x.syncStatus === "synced" ? 3 : x.remoteId ? 2 : 1);
      map.set(key, score(m) >= score(prev) ? m : prev);
    }
  }
  return Array.from(map.values());
}

export function useMandados() {
  const [mandados, setMandadosState] = useState(getMandados());
  const [syncing, setSyncing] = useState(false);

  // ==============================
  // 🔼 Subir mandados nuevos (needsUpload)
  // ==============================
  async function pushNewPending(localList) {
    const toUpload = localList.filter((m) => m.needsUpload);
    for (const item of toUpload) {
      try {
        // enviar originId y derivados también
        const payload = withDerivatives(item);
        const remoteResult = await uploadNewMandado(payload); // debe incluir originId y devolver remoteId

        // marcar local como subido (conservando originId)
        const afterMark = markUploadedLocal(item.id, remoteResult.remoteId || remoteResult.id);
        setMandadosState(afterMark);
        localList = afterMark;
      } catch (err) {
        console.warn("⚠️ No se pudo subir un mandado nuevo:", err);
      }
    }
    return localList;
  }

  // ==============================
  // 🔁 Subir actualizaciones (needsUpdate && remoteId)
  // ==============================
  async function pushUpdates(localList) {
    const toUpdate = localList.filter((m) => m.remoteId && m.needsUpdate);
    for (const item of toUpdate) {
      try {
        const payload = withDerivatives(item);
        await updateRemoteMandado(item.remoteId, payload);
        const afterClear = clearNeedsUpdate(item.id);
        setMandadosState(afterClear);
        localList = afterClear;
      } catch (err) {
        console.warn("⚠️ No se pudo actualizar un mandado remoto:", err);
      }
    }
    return localList;
  }

  // ==============================
  // 🔽 Bajar nube + fusionar (por originId)
  // ==============================
  async function pullRemoteAndMerge(localList) {
    try {
      const remoteList = await getMandadosRemote(); // idealmente cada remoto tiene originId
      // Merge por originId / remoteId / id
      const merged = dedupeByOriginId([
        ...localList,
        ...remoteList.map(withDerivatives),
      ]);

      setMandados(merged);
      setMandadosState(merged);
      return merged;
    } catch (err) {
      console.warn("⚠️ No se pudo bajar de Firestore:", err);
      return localList;
    }
  }

  // ==============================
  // 🔄 Sincronización completa
  // ==============================
  async function fullSync() {
    setSyncing(true);
    try {
      let current = getMandados();
      current = await pushNewPending(current);
      current = await pushUpdates(current);
      current = await pullRemoteAndMerge(current);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    fullSync();
    // opcional: reintentar al volver online
    const onOnline = () => fullSync();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  // ==============================
  // 🧩 API Pública
  // ==============================

  // ➕ Crear (offline-first)
  function createMandado(data) {
    const originId = newId();
    const base = withDerivatives({
      ...data,
      originId,
      pagado: data.pagado ?? (data.metodoPago !== "pendiente"),
      syncStatus: navigator.onLine ? "syncing" : "pending",
      needsUpload: true,
      needsUpdate: false,
      createdAt: Date.now(),
    });

    // Guarda local con flags
    const newItem = saveMandadoLocal(base);
    // Refresca estado
    setMandadosState(getMandados());
    // Intenta sincronizar
    fullSync();
    return newItem;
  }

  // ✅ Marcar pagado
  function markAsPaid(localId, metodoPagoReal = "efectivo") {
    const all = getMandados();
    const current = all.find((m) => m.id === localId);
    if (!current) return;

    const updates = {
      pagado: true,
      metodoPago: metodoPagoReal,
    };

    // si ya está en remoto → needsUpdate; si no, mantiene needsUpload
    if (current.remoteId) updates.needsUpdate = true;

    const afterUpdate = updateMandadoLocalById(localId, updates);
    setMandadosState(afterUpdate);
    fullSync();
  }

  // ✏️ Editar (offline + online)
  function updateMandado(localId, updates) {
    // recalcular derivados si cambian campos económicos
    const shouldRecalc =
      "gastoCompra" in updates || "cobroServicio" in updates;
    const merged = shouldRecalc ? withDerivatives(updates) : updates;

    // si ya está en remoto → needsUpdate; si no, sigue como needsUpload
    const current = getMandados().find((m) => m.id === localId);
    const flags =
      current?.remoteId ? { needsUpdate: true } : {};

    const afterUpdate = updateMandadoLocalById(localId, {
      ...merged,
      ...flags,
    });
    setMandadosState(afterUpdate);
    fullSync();
  }

  // 🗑 Eliminar (offline + online)
  async function deleteMandado(localId) {
    let all = getMandados();
    const target = all.find((m) => m.id === localId);

    if (target?.remoteId) {
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        const { db } = await import("../../../firebase.config");
        await deleteDoc(doc(db, "mandados", target.remoteId));
      } catch (err) {
        console.warn("⚠️ No se pudo eliminar en Firestore (se elimina localmente):", err);
      }
    }

    all = all.filter((m) => m.id !== localId);
    setMandados(all);
    setMandadosState(all);
  }

  return {
    mandados,
    syncing,
    createMandado,
    markAsPaid,
    updateMandado,
    deleteMandado,
    fullSync,
  };
}
