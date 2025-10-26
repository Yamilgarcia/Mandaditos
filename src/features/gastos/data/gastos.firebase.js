import { db } from "../../../firebase.config";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

const COLLECTION_NAME = "gastos";

// SUBIR un gasto nuevo a Firestore
export async function uploadNewGasto(localGasto) {
  const payload = {
    ...localGasto,
    createdAt: serverTimestamp(),
  };

  // limpiar campos que son internos del cliente
  delete payload.id;
  delete payload.needsUpload;
  delete payload.needsUpdate;
  delete payload.remoteId;

  const ref = await addDoc(collection(db, COLLECTION_NAME), payload);
  return ref.id;
}

// ACTUALIZAR un gasto ya existente en Firestore
export async function updateRemoteGasto(remoteId, partialData) {
  const ref = doc(db, COLLECTION_NAME, remoteId);

  const clean = { ...partialData };
  delete clean.id;
  delete clean.remoteId;
  delete clean.needsUpload;
  delete clean.needsUpdate;

  await updateDoc(ref, clean);
}

// BAJAR TODOS los gastos desde Firestore
export async function getGastosRemote() {
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  const rows = [];
  snap.forEach((docSnap) => {
    rows.push({
      ...docSnap.data(),
      remoteId: docSnap.id,
      id: crypto.randomUUID(), // generamos un id local si no había
      needsUpload: false,
      needsUpdate: false,
    });
  });
  return rows;
}
