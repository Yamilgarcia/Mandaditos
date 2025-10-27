import { db } from "../../../firebase.config";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  setDoc,
  doc,
} from "firebase/firestore";

const COLLECTION_NAME = "gastos";

// ---- helpers ----
const ensureNumber = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

// SUBIR un gasto nuevo a Firestore (idempotente si trae originId)
export async function uploadNewGasto(localGasto) {
  // construimos el payload sin desestructurar (para que el linter no se queje)
  const payload = {
    ...(localGasto || {}),
    monto: ensureNumber(localGasto?.monto),
    originId: localGasto?.originId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // limpiar campos solo-cliente
  delete payload.id;
  delete payload.remoteId;
  delete payload.needsUpload;
  delete payload.needsUpdate;
  delete payload.syncStatus;

  let usedRemoteId;

  if (payload.originId) {
    // Idempotente: usamos originId como documentId
    const ref = doc(db, COLLECTION_NAME, payload.originId);
    await setDoc(ref, payload, { merge: true });
    usedRemoteId = payload.originId;
  } else {
    // Sin originId (legacy): generamos doc nuevo
    const ref = await addDoc(collection(db, COLLECTION_NAME), payload);
    usedRemoteId = ref.id;
  }

  // tu hook soporta string o {remoteId}, devolvemos objeto claro
  return { remoteId: usedRemoteId };
}

// ACTUALIZAR un gasto ya existente en Firestore
export async function updateRemoteGasto(remoteId, partialData) {
  if (!remoteId) throw new Error("updateRemoteGasto: remoteId es requerido");

  // clon limpio y normalizado
  const clean = {
    ...(partialData || {}),
    monto:
      partialData?.monto !== undefined ? ensureNumber(partialData.monto) : undefined,
    updatedAt: serverTimestamp(),
  };

  // borrar campos cliente / no deseados
  delete clean.id;
  delete clean.remoteId;
  delete clean.needsUpload;
  delete clean.needsUpdate;
  delete clean.syncStatus;

  // quitar undefined para no sobreescribir con undefined
  Object.keys(clean).forEach((k) => clean[k] === undefined && delete clean[k]);

  const ref = doc(db, COLLECTION_NAME, remoteId);
  await updateDoc(ref, clean);
}

// BAJAR TODOS los gastos desde Firestore
export async function getGastosRemote() {
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  const rows = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const originId = data.originId || docSnap.id;

    rows.push({
      ...data,
      originId,                 // garantizamos originId
      remoteId: docSnap.id,
      id: crypto.randomUUID(),  // id local para la UI
      needsUpload: false,
      needsUpdate: false,
      syncStatus: "synced",
      monto: ensureNumber(data.monto),
    });
  });
  return rows;
}
