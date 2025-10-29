import { useState } from "react";
import { Outlet } from "react-router-dom";
import HamburgerButton from "../components/HamburgerButton";
import SideMenu from "../components/SideMenu";
import InstallPWAButton from "../components/InstallPWAButton";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen text-gray-800 relative"
      style={{
        backgroundImage: "url('/gohan.jpg')",
        backgroundSize: "cover",         // ocupa toda la pantalla
        backgroundPosition: "center",    // centrada en todo momento
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",   // hace que no se mueva al hacer scroll
        backgroundColor: "#000",         // color de respaldo (por si no carga la imagen)
      }}
    >
      {/* Capa oscura suave para legibilidad */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header fijo */}
        <header className="bg-white/90 backdrop-blur-sm shadow flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <HamburgerButton onClick={() => setMenuOpen(true)} />
            <span className="font-bold text-lg text-gray-800">
              🏍️ Mandaditos
            </span>
          </div>

          {/* Botón de instalar PWA */}
          <InstallPWAButton />
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </main>

        {/* Menú lateral */}
        {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} />}
      </div>
    </div>
  );
}
