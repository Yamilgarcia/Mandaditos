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

export function useGastos() {
  const [gastos, setGastosState] = useState(getGastos());
  const [syncing, setSyncing] = useState(false);

  // ---- subir nuevos que no han sido subidos ----
  async function pushNewPending(localList) {
    const toUpload = localList.filter((g) => g.needsUpload);

    for (const gasto of toUpload) {
      try {
        const remoteId = await uploadNewGasto(gasto);
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
    const toUpdate = localList.filter(
      (g) => g.remoteId && g.needsUpdate
    );

    for (const gasto of toUpdate) {
      try {
        await updateRemoteGasto(gasto.remoteId, gasto);
        const afterClear = clearGastoNeedsUpdate(gasto.id);
        setGastosState(afterClear);
        localList = afterClear;
      } catch (err) {
        console.warn("No se pudo actualizar un gasto remoto:", err);
      }
    }

    return localList;
  }

  // ---- bajar lista remota y fusionar con local ----
  async function pullRemoteAndMerge(localList) {
    try {
      const remoteList = await getGastosRemote();

      let merged = [...localList];

      for (const remoteItem of remoteList) {
        const already = merged.find(
          (g) => g.remoteId === remoteItem.remoteId
        );
        if (!already) {
          merged.push(remoteItem);
        }
      }

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

    function handleOnline() {
      fullSync();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // =======================
  //  API pública
  // =======================

  // Crear gasto
  function createGasto({ categoria, monto, nota }) {
    const nuevo = {
      fecha: getTodayStr(),
      hora: getTimeStr(),
      categoria,
      monto,
      nota,
    };

    saveGastoLocal(nuevo);

    const after = getGastos();
    setGastosState(after);

    fullSync();
  }

  // Editar gasto
  function editGasto(localId, changes) {
    const after = updateGastoLocalById(localId, {
      ...changes,
      needsUpdate: true,
    });
    setGastosState(after);
    fullSync();
  }

  // Eliminar gasto
  async function deleteGasto(localId) {
    let all = getGastos();
    const target = all.find((g) => g.id === localId);

    // si existe remoto, intentamos borrar en Firestore
    if (target?.remoteId) {
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        const { db } = await import("../../../firebase.config");
        await deleteDoc(doc(db, "gastos", target.remoteId));
      } catch (err) {
        console.warn("No se pudo eliminar remoto, se elimina local igual:", err);
      }
    }

    // borrar local siempre
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
