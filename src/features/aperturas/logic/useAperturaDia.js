import { useEffect, useState, useCallback } from "react";
import {
  getAperturas,
  setAperturas,
  getAperturaByDateLocal,
  saveAperturaLocal,
  updateAperturaLocalByDate,
  markUploadedLocal,
  clearNeedsUpdate,
} from "../data/aperturas.local";

import {
  getAperturasRemote,
  uploadNewApertura,
  updateRemoteApertura,
} from "../data/aperturas.firebase";

function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function dedupeByFecha(list) {
  const map = new Map();
  for (const a of list) {
    const key = a.fecha;
    const prev = map.get(key);
    if (!prev) map.set(key, a);
    else {
      const score = (x) => (x.needsUpload || x.needsUpdate ? 1 : x.remoteId ? 2 : 0);
      map.set(key, score(a) >= score(prev) ? a : prev);
    }
  }
  return Array.from(map.values());
}

export function useAperturaDia(fecha) {
  const [apertura, setApertura] = useState(() => getAperturaByDateLocal(fecha));
  const [syncing, setSyncing] = useState(false);

  async function pushNewPending(localList) {
    const toUpload = localList.filter((a) => a.needsUpload);
    for (const item of toUpload) {
      try {
        const payload = {
          fecha: item.fecha,
          cajaInicial: toNum(item.cajaInicial),
          notas: item.notas || "",
        };
        const remoteId = await uploadNewApertura(payload);
        const after = markUploadedLocal(item.id, remoteId);
        localList = after;
      } catch (e) {
        console.warn("No se pudo subir apertura nueva:", e);
      }
    }
    return localList;
  }

  async function pushUpdates(localList) {
    const toUpdate = localList.filter((a) => a.remoteId && a.needsUpdate);
    for (const item of toUpdate) {
      try {
        const payload = {
          fecha: item.fecha,
          cajaInicial: toNum(item.cajaInicial),
          notas: item.notas || "",
        };
        await updateRemoteApertura(item.remoteId, payload);
        const after = clearNeedsUpdate(item.id);
        localList = after;
      } catch (e) {
        console.warn("No se pudo actualizar apertura remota:", e);
      }
    }
    return localList;
  }

  async function pullRemoteAndMerge(localList) {
    try {
      const remotes = await getAperturasRemote({ fecha });
      const merged = dedupeByFecha([...localList, ...remotes]);
      setAperturas(merged);
      setApertura(merged.find((a) => a.fecha === fecha) || null);
      return merged;
    } catch (e) {
      console.warn("No se pudo bajar aperturas de Firestore:", e);
      return localList;
    }
  }

  const fullSync = useCallback(async () => {
    setSyncing(true);
    try {
      let current = getAperturas();
      current = await pushNewPending(current);
      current = await pushUpdates(current);
      current = await pullRemoteAndMerge(current);
    } finally {
      setSyncing(false);
    }
  }, [fecha]);

  useEffect(() => {
    setApertura(getAperturaByDateLocal(fecha));
    fullSync();
    const onOnline = () => fullSync();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [fecha, fullSync]);

  function crearApertura({ cajaInicial, notas = "" }) {
    const base = {
      fecha,
      cajaInicial: toNum(cajaInicial),
      notas,
      createdAt: Date.now(),
      needsUpload: true,
      needsUpdate: false,
    };
    const created = saveAperturaLocal(base);
    setApertura(created);
    fullSync();
    return created;
  }

  function editarApertura(changes) {
    const after = updateAperturaLocalByDate(fecha, {
      cajaInicial: changes.cajaInicial !== undefined ? toNum(changes.cajaInicial) : undefined,
      notas: changes.notas !== undefined ? changes.notas : undefined,
    });
    const cur = after.find((a) => a.fecha === fecha) || null;
    setApertura(cur);
    fullSync();
  }

  return {
    apertura,  // {fecha, cajaInicial, notas, ...}
    syncing,
    crearApertura,
    editarApertura,
    fullSync,
  };
}
