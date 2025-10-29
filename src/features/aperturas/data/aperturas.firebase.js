import { db } from "../../../firebase.config";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

const COLLECTION_NAME = "aperturas";

// SUBIR una apertura nueva (solo cajaInicial + notas)
export async function uploadNewApertura(local) {
  const payload = {
    fecha: local.fecha,
    cajaInicial: Number(local.cajaInicial || 0),
    notas: local.notas || "",
    createdAt: serverTimestamp(),
  };

  // limpiar campos locales
  delete payload.id;
  delete payload.needsUpload;
  delete payload.needsUpdate;

  const ref = await addDoc(collection(db, COLLECTION_NAME), payload);
  return ref.id;
}

// ACTUALIZAR apertura existente (solo cajaInicial + notas)
export async function updateRemoteApertura(remoteId, partialData) {
  const ref = doc(db, COLLECTION_NAME, remoteId);
  const clean = {
    fecha: partialData.fecha,
    cajaInicial: Number(partialData.cajaInicial || 0),
    notas: partialData.notas || "",
  };
  await updateDoc(ref, clean);
}

// DESCARGAR aperturas (opcional por fecha)
export async function getAperturasRemote({ fecha } = {}) {
  let snap;
  if (fecha) {
    const q = query(collection(db, COLLECTION_NAME), where("fecha", "==", fecha));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(collection(db, COLLECTION_NAME));
  }

  const rows = [];
  snap.forEach((docSnap) => {
    rows.push({
      ...docSnap.data(),
      remoteId: docSnap.id,
      id: crypto.randomUUID(),
      needsUpload: false,
      needsUpdate: false,
    });
  });
  return rows;
}
