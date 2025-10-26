import { useState } from "react";
import { Outlet } from "react-router-dom";
import HamburgerButton from "../components/HamburgerButton";
import SideMenu from "../components/SideMenu";

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
      {/* capa semitransparente para que no se pierda el contraste */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* CONTENIDO REAL encima del fondo */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header fijo */}
        <header className="bg-white shadow flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <HamburgerButton onClick={() => setMenuOpen(true)} />
            <span className="font-bold text-lg text-gray-800">
              🏍️ Mandaditos
            </span>
          </div>
        </header>

        {/* Contenido de cada pantalla */}
        <main className="p-4">
          <Outlet />
        </main>

        {/* Menú lateral estilo anterior (solo aparece si menuOpen = true) */}
        {menuOpen && (
          <SideMenu onClose={() => setMenuOpen(false)} />
        )}
      </div>
    </div>
  );
}
