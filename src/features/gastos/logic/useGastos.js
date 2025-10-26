import { useState } from "react";
import { getGastos, saveGastoLocal } from "../data/gastos.local";
import { saveGastoRemote } from "../data/gastos.firebase";
import { getTodayStr, getTimeStr } from "../../../utils/date";

export function useGastos() {
  const [gastos, setGastos] = useState(getGastos());

  async function createGasto({ categoria, monto, nota }) {
    // construir objeto gasto
    const nuevo = {
      fecha: getTodayStr(),
      hora: getTimeStr(),
      categoria,
      monto,
      nota,
    };

    // guardar local SIEMPRE
    const savedLocal = saveGastoLocal(nuevo);
    setGastos(getGastos());

    // intentar subir remoto
    try {
      await saveGastoRemote(savedLocal);
      console.log("📤 Gasto subido a Firestore");
    } catch (err) {
      console.warn("⚠ No se pudo subir gasto a Firestore:", err);
    }
  }

  return {
    gastos,
    createGasto,
  };
}
