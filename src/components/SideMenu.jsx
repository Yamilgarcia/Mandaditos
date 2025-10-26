import { Link } from "react-router-dom";

export default function SideMenu({ onClose }) {
  return (
    <>
      {/* fondo oscuro */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* panel lateral */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Menú</h2>
          <button
            className="text-gray-500 hover:text-gray-800 text-sm border rounded px-2 py-1"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <nav className="flex flex-col gap-3">
          <Link
            to="/"
            onClick={onClose}
            className="block rounded-lg px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            ➕ Nuevo Mandado
          </Link>

          <Link
            to="/resumen"
            onClick={onClose}
            className="block rounded-lg px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            📊 Resumen del Día
          </Link>

          <Link
            to="/historial"
            onClick={onClose}
            className="block rounded-lg px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            📜 Historial / Pendientes
          </Link>


<Link
    to="/pendientes"
    onClick={onClose}
    className="block rounded-lg px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
  >
    💸 Pendientes de Pago
  </Link>
  
          <Link
            to="/gastos"
            onClick={onClose}
            className="block rounded-lg px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            💵 Gastos personales
          </Link>
        </nav>

        <div className="mt-auto text-xs text-gray-400">
          <p>Modo Offline listo ✅</p>
          <p className="mt-1">v0.2</p>
        </div>
      </aside>
    </>
  );
}
