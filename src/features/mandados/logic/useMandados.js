import { useState, useEffect } from "react";
import {
  saveMandado,
  getMandados,
  updateMandadoById,
  setMandados,
} from "../data/mandados.local";
import {
  saveMandadoRemote,
  getMandadosRemote,
} from "../data/mandados.firebase";

export function useMandados() {
  const [mandados, setMandadosState] = useState(getMandados());
  const [loadingSync, setLoadingSync] = useState(true);

  // Sincronizar UNA VEZ cuando la app arranca:
  // 1. bajar Firestore
  // 2. guardarlo en localStorage
  // 3. reflejarlo en estado
  useEffect(() => {
    async function syncFromCloud() {
      try {
        const remoteList = await getMandadosRemote();
        if (remoteList && remoteList.length > 0) {
          // OJO: en Firestore ya tienen sus campos (fecha, hora, monto, etc.)
          // Algunos registros vienen con "id" nuestro, otros no.
          // Para los que no tengan "id" local, les creamos uno para poder editarlos.
          const normalized = remoteList.map((m) => ({
            ...m,
            id: m.id || crypto.randomUUID(),
          }));

          setMandados(normalized);        // actualiza localStorage
          setMandadosState(normalized);   // actualiza estado React
        }
      } catch (err) {
        console.warn("No se pudo sincronizar desde Firestore:", err);
      } finally {
        setLoadingSync(false);
      }
    }

    syncFromCloud();
  }, []);

  // crear nuevo mandado (local + nube)
  async function createMandado(data) {
    // Guardar local
    const localSaved = saveMandado(data);
    const updatedLocal = getMandados();
    setMandadosState(updatedLocal);

    // Subir remoto (no vamos a esperar que termine para mostrarlo en UI)
    try {
      await saveMandadoRemote(localSaved);
      console.log("📤 Mandado subido a Firestore");
    } catch (err) {
      console.warn("⚠ No se pudo subir a Firestore:", err);
    }
  }

  // marcar pagado
  function markAsPaid(id, metodoPagoReal = "efectivo") {
    const updatedList = updateMandadoById(id, {
      pagado: true,
      metodoPago: metodoPagoReal,
    });
    setMandadosState(updatedList);
    // TODO: actualizar ese documento también en Firestore (lo hacemos luego)
  }

  return {
    mandados,
    loadingSync,
    createMandado,
    markAsPaid,
  };
}
