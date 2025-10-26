import { db } from "../../../firebase.config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const COLLECTION_NAME = "mandados";

export async function saveMandadoRemote(mandado) {
  // mandado es el objeto con {fecha, hora, clienteNombre, descripcion, monto, metodoPago, notas, pagado}
  const dataToSave = {
    ...mandado,
    createdAt: serverTimestamp(), // marca cuándo se guardó en la nube
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
  return docRef.id; // por si luego queremos mostrarle su ID
}
