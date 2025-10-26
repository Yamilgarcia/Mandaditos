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

export function useMandados() {
  const [mandados, setMandadosState] = useState(getMandados());
  const [syncing, setSyncing] = useState(false);

  // ==============================
  // 🔼 Subir mandados nuevos
  // ==============================
  async function pushNewPending(localList) {
    const toUpload = localList.filter((m) => m.needsUpload);
    for (const item of toUpload) {
      try {
        const remoteId = await uploadNewMandado(item);
        const afterMark = markUploadedLocal(item.id, remoteId);
        setMandadosState(afterMark);
        localList = afterMark;
      } catch (err) {
        console.warn("⚠️ No se pudo subir un mandado nuevo:", err);
      }
    }
    return localList;
  }

  // ==============================
  // 🔁 Subir actualizaciones
  // ==============================
  async function pushUpdates(localList) {
    const toUpdate = localList.filter((m) => m.remoteId && m.needsUpdate);
    for (const item of toUpdate) {
      try {
        await updateRemoteMandado(item.remoteId, item);
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
  // 🔽 Bajar nube + fusionar
  // ==============================
  async function pullRemoteAndMerge(localList) {
    try {
      const remoteList = await getMandadosRemote();
      let merged = [...localList];

      for (const remoteItem of remoteList) {
        const already = merged.find(
          (m) => m.remoteId === remoteItem.remoteId
        );
        if (!already) merged.push(remoteItem);
      }

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
  }, []);

  // ==============================
  // 🧩 API Pública
  // ==============================

  // ➕ Crear
  function createMandado(data) {
    const newItem = saveMandadoLocal({
      ...data,
      pagado: data.pagado ?? (data.metodoPago !== "pendiente"),
    });
    const after = getMandados();
    setMandadosState(after);
    fullSync();
  }

  // ✅ Marcar pagado
  function markAsPaid(localId, metodoPagoReal = "efectivo") {
    const afterUpdate = updateMandadoLocalById(localId, {
      pagado: true,
      metodoPago: metodoPagoReal,
    });
    setMandadosState(afterUpdate);
    fullSync();
  }

  // ✏️ Editar (offline + online)
  function updateMandado(localId, updates) {
    const afterUpdate = updateMandadoLocalById(localId, {
      ...updates,
      needsUpdate: true, // se sincroniza luego
    });
    setMandadosState(afterUpdate);
    fullSync();
  }

  // 🗑 Eliminar (offline + online)
  async function deleteMandado(localId) {
    let all = getMandados();
    const target = all.find((m) => m.id === localId);

    // Si está sincronizado en la nube, eliminamos en Firestore también
    if (target?.remoteId) {
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        const { db } = await import("../../../firebase.config");
        await deleteDoc(doc(db, "mandados", target.remoteId));
      } catch (err) {
        console.warn("⚠️ No se pudo eliminar en Firestore (se elimina localmente):", err);
      }
    }

    // eliminar local siempre
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
