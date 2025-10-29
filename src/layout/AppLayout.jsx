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
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* oscurito suave para que se lea el contenido encima */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header fijo */}
        <header className="bg-white shadow flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <HamburgerButton onClick={() => setMenuOpen(true)} />
            <span className="font-bold text-lg text-gray-800">
              🏍️ Mandaditos
            </span>
          </div>

          {/* acá ponemos el botón de instalar PWA */}
          <InstallPWAButton />
        </header>

        {/* Contenido de cada pantalla */}
        <main className="p-4">
          <Outlet />
        </main>

        {/* Menú lateral */}
        {menuOpen && (
          <SideMenu onClose={() => setMenuOpen(false)} />
        )}
      </div>
    </div>
  );
}
