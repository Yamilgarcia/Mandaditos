import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Escuchamos el evento que Chrome dispara cuando la PWA es instalable
    function handleBeforeInstallPrompt(e) {
      e.preventDefault(); // bloqueamos el popup automático de Chrome
      setDeferredPrompt(e); // guardamos el evento para usarlo después
      setReady(true);       // esto hace visible nuestro botón
    }

    // 2. Cuando ya está instalada, ocultamos el botón
    function handleAppInstalled() {
      setInstalled(true);
      setReady(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleClick() {
    if (!deferredPrompt) return;

    // Abrir el diálogo nativo de instalación
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Resultado de instalación:", outcome); // accepted / dismissed

    // Ya no podemos usar este mismo prompt otra vez
    setDeferredPrompt(null);
    setReady(false);

    if (outcome === "accepted") {
      setInstalled(true);
    }
  }

  // Si ya está instalada o aún no está lista para instalar, no mostramos botón
  if (installed || !ready) {
    return null;
  }

  // Botón visible solo cuando Chrome dice “puede instalarse”
  return (
    <button
      onClick={handleClick}
      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow active:scale-[.98]"
    >
      📲 Instalar Mandaditos
    </button>
  );
}
