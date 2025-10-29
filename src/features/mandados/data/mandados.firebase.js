import { db } from "../../../firebase.config";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

const COLLECTION_NAME = "mandados";

// SUBIR un mandado nuevo a Firestore
// devuelve el id remoto (string)
export async function uploadNewMandado(localMandado) {
  const payload = {
    ...localMandado,
    createdAt: serverTimestamp(),
  };

  // cosas internas locales que no quiero guardar tal cual en Firebase:
  delete payload.id;
  delete payload.needsUpload;
  delete payload.needsUpdate;
  // remoteId tampoco lo subimos, Firestore genera su propio id

  const ref = await addDoc(collection(db, COLLECTION_NAME), payload);
  return ref.id; // <-- string
}

// ACTUALIZAR en Firestore (mandado que ya existe en remoto)
export async function updateRemoteMandado(remoteId, partialData) {
  const ref = doc(db, COLLECTION_NAME, remoteId);

  // igual que arriba: no quiero subir campos internos
  const clean = { ...partialData };
  delete clean.id;
  delete clean.remoteId;
  delete clean.needsUpload;
  delete clean.needsUpdate;

  await updateDoc(ref, clean);
}

// DESCARGAR todos los mandados desde Firestore
export async function getMandadosRemote() {
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  const rows = [];
  snap.forEach((docSnap) => {
    rows.push({
      ...docSnap.data(),
      remoteId: docSnap.id,
      // si no tenían id local (porque vienen de antes),
      // me invento uno estable basado en remoteId:
      id: crypto.randomUUID(),
      needsUpload: false,
      needsUpdate: false,
    });
  });
  return rows;
}
