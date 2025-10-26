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

  // ------------ helper: subir nuevos pendientes ------------
  async function pushNewPending(localList) {
    // mandados que todavía no tienen remoteId y necesitan subir
    const toUpload = localList.filter(m => m.needsUpload);

    for (const item of toUpload) {
      try {
        const remoteId = await uploadNewMandado(item);
        const afterMark = markUploadedLocal(item.id, remoteId);
        setMandadosState(afterMark);
        localList = afterMark;
      } catch (err) {
        console.warn("No se pudo subir un mandado nuevo:", err);
      }
    }

    return localList;
  }

  // ------------ helper: subir updates pendientes ------------
  async function pushUpdates(localList) {
    const toUpdate = localList.filter(
      m => m.remoteId && m.needsUpdate
    );

    for (const item of toUpdate) {
      try {
        await updateRemoteMandado(item.remoteId, item);
        const afterClear = clearNeedsUpdate(item.id);
        setMandadosState(afterClear);
        localList = afterClear;
      } catch (err) {
        console.warn("No se pudo actualizar un mandado remoto:", err);
      }
    }

    return localList;
  }

  // ------------ helper: bajar nube y fusionar ------------
  async function pullRemoteAndMerge(localList) {
    try {
      const remoteList = await getMandadosRemote();

      // fusionamos:
      // - si un remoteId ya existe local, usamos el local (porque puede tener cambios)
      // - si un remoteId NO existe local, lo agregamos
      let merged = [...localList];

      for (const remoteItem of remoteList) {
        const already = merged.find(
          m => m.remoteId === remoteItem.remoteId
        );
        if (!already) {
          merged.push(remoteItem);
        }
      }

      // guardamos fusión en localStorage y en estado
      setMandados(merged);
      setMandadosState(merged);

      return merged;
    } catch (err) {
      console.warn("No se pudo bajar de Firestore:", err);
      return localList;
    }
  }

  // ------------ sync total ------------
  async function fullSync() {
    setSyncing(true);
    try {
      let current = getMandados();          // lee lo más reciente local
      current = await pushNewPending(current); // sube nuevos
      current = await pushUpdates(current);    // sube updates
      current = await pullRemoteAndMerge(current); // trae nube y fusiona
    } finally {
      setSyncing(false);
    }
  }

  // correr sync cuando el hook monta (app inicia)
  useEffect(() => {
    fullSync();
    // también podríamos volver a sync cuando vuelva el internet,
    // pero eso sería un paso siguiente con "online/offline events".
  }, []);

  // ------------ API pública del hook ------------

  // crear un nuevo mandado
  function createMandado(data) {
    // siempre guardo local (offline first)
    const newItem = saveMandadoLocal({
      ...data,
      pagado: data.pagado ?? (data.metodoPago !== "pendiente"),
    });

    const after = getMandados();
    setMandadosState(after);

    // intento sincronizar en background
    fullSync();
  }

  // marcar como pagado
  function markAsPaid(localId, metodoPagoReal = "efectivo") {
    const afterUpdate = updateMandadoLocalById(localId, {
      pagado: true,
      metodoPago: metodoPagoReal,
    });

    setMandadosState(afterUpdate);

    // intento sincronizar en background
    fullSync();
  }

  return {
    mandados,
    syncing,
    createMandado,
    markAsPaid,
  };
}
