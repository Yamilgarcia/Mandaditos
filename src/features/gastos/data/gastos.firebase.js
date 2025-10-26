import { db } from "../../../firebase.config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const COLLECTION = "gastos";

export async function saveGastoRemote(gasto) {
  const dataToSave = {
    ...gasto,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), dataToSave);
  return ref.id;
}
