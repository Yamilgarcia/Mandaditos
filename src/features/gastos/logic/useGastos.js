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
    const toUpload = localList.filter(g => g.needsUpload);

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

  // ---- subir updates pendientes (ej si en el futuro editamos un gasto) ----
  async function pushUpdates(localList) {
    const toUpdate = localList.filter(
      g => g.remoteId && g.needsUpdate
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

      // Fusion logic:
      // Metemos todo lo remoto que no esté ya en local (mismo remoteId).
      let merged = [...localList];

      for (const remoteItem of remoteList) {
        const already = merged.find(
          g => g.remoteId === remoteItem.remoteId
        );
        if (!already) {
          merged.push(remoteItem);
        }
      }

      setGastos(merged);       // guardar en localStorage
      setGastosState(merged);  // refrescar React state

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

  // correr sync al montar el hook
  useEffect(() => {
    fullSync();

    // opcional: cuando el navegador recupere internet, volver a sync
    function handleOnline() {
      fullSync();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Crear gasto (gasolina, comida, etc.)
  function createGasto({ categoria, monto, nota }) {
    const nuevo = {
      fecha: getTodayStr(),
      hora: getTimeStr(),
      categoria,
      monto,
      nota,
    };

    // Guardar local SIEMPRE (offline first)
    saveGastoLocal(nuevo);

    // actualizar estado con lo más reciente
    const after = getGastos();
    setGastosState(after);

    // intentar sincronizar en background
    fullSync();
  }

  // (Futuro) editar gasto localmente
  function editGasto(localId, changes) {
    const after = updateGastoLocalById(localId, changes);
    setGastosState(after);
    fullSync();
  }

  return {
    gastos,
    syncing,
    createGasto,
    editGasto,
  };
}
