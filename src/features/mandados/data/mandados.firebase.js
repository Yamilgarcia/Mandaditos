import { db } from "../../../firebase.config";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

const COLLECTION_NAME = "mandados";

// Guardar un mandado en Firestore
export async function saveMandadoRemote(mandado) {
  const dataToSave = {
    ...mandado,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
  return docRef.id;
}

// Leer todos los mandados desde Firestore
export async function getMandadosRemote() {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const rows = [];
  snapshot.forEach((doc) => {
    rows.push({
      ...doc.data(),
      __docId: doc.id, // id de Firestore por si lo necesitamos luego
    });
  });
  return rows;
}
