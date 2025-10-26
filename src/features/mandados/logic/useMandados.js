import { useState } from "react";
import {
  saveMandado,
  getMandados,
  updateMandadoById,
} from "../data/mandados.local";
import { saveMandadoRemote } from "../data/mandados.firebase";

export function useMandados() {
  const [mandados, setMandados] = useState(getMandados());

  async function createMandado(data) {
    // 1. Guardar local
    const localSaved = saveMandado(data);
    setMandados(getMandados());

    // 2. Intentar subir a Firestore (no marcamos error si falla)
    try {
      await saveMandadoRemote(localSaved);
      console.log("📤 Mandado subido a Firestore");
    } catch (err) {
      console.warn("⚠ No se pudo subir a Firestore:", err);
    }
  }

  function markAsPaid(id, metodoPagoReal = "efectivo") {
    // actualizar localmente ese mandado
    const updatedList = updateMandadoById(id, {
      pagado: true,
      metodoPago: metodoPagoReal,
    });
    setMandados(updatedList);

    // luego: TODO sync remoto (lo haremos después)
  }

  return {
    mandados,
    createMandado,
    markAsPaid,
  };
}
