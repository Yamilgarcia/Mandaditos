import { useState } from "react";
import { Outlet } from "react-router-dom";
import HamburgerButton from "../components/HamburgerButton";
import SideMenu from "../components/SideMenu";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 relative">
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

      {/* Menú lateral */}
      {menuOpen && (
        <SideMenu onClose={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
