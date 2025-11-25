import { Link } from "react-router-dom";
import {
  X,
  PlusCircle,
  ListTodo,
  Wallet,
  ClipboardList,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  BarChart2,
  Calculator, // <--- Importamos el ícono de Calculadora
} from "lucide-react";

export default function SideMenu({ onClose }) {
  // El ancho del menú es w-64, lo que es 256px
  return (
    <>
      {/* Fondo oscuro - cubre toda la pantalla y tiene el z-index más alto */}
      <div
        className="fixed inset-0 bg-black/50 z-[1010] transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral - Diseño limpio, color blanco y sombra profunda */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl p-5 flex flex-col z-[1010] transform transition-transform duration-300 ease-out">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-blue-600">Mandaditos App</h2>
          <button
            className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1">
          {/* Nuevo Mandado - Botón destacado, ruta: / */}
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-3 bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={20} />
            Nuevo Mandado
          </Link>

          {/* === Sección Gestión de Mandados === */}
          <div className="text-xs text-gray-500 font-semibold mt-4 mb-1 px-4 border-b pb-1">
            Gestión de Mandados
          </div>

          {/* Historial de Mandados, ruta: /historial */}
          <Link
            to="/historial" 
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 font-medium transition-colors"
          >
            <ListTodo size={20} className="text-blue-500" />
            Historial de Mandados
          </Link>
          
          {/* Pendientes de Pago, ruta: /pendientes */}
          <Link
            to="/pendientes"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 font-medium transition-colors"
          >
            <CreditCard size={20} className="text-yellow-600" />
            Pendientes de Pago
          </Link>

          {/* === Sección Finanzas y Reportes === */}
          <div className="text-xs text-gray-500 font-semibold mt-4 mb-1 px-4 border-b pb-1">
            Finanzas y Reportes
          </div>

          {/* Apertura del Día, ruta: /apertura */}
          <Link
            to="/apertura"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 transition-colors"
          >
            <CalendarCheck size={20} className="text-indigo-600" />
            Apertura del Día
          </Link>
          
          {/* Resumen del Día (Antiguo), ruta: /resumen */}
          <Link
            to="/resumen"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 transition-colors"
          >
            <BarChart2 size={20} className="text-orange-600" />
            Resumen del Día
          </Link>

          {/* Resumen de los días (V2), ruta: /resumen-v2 */}
          <Link
            to="/resumen-v2"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 transition-colors"
          >
            <TrendingUp size={20} className="text-red-600" />
            Resumen de los días (V2)
          </Link>

          {/* Calculadora de Cierre, ruta: /CalculadoraCierre-v2 */}
          {/* AQUÍ ESTÁ EL NUEVO ÍCONO Y COLOR */}
          <Link
            to="/CalculadoraCierre-v2"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 transition-colors"
          >
            <Calculator size={20} className="text-teal-600" /> 
            Calculadora de Cierre
          </Link>

          {/* Gastos personales, ruta: /gastos */}
          <Link
            to="/gastos"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 transition-colors"
          >
            <Wallet size={20} className="text-green-600" />
            Gastos personales
          </Link>
          
          {/* Listado de gastos, ruta: /GastosList */}
          <Link
            to="/GastosList"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-2 hover:bg-blue-50/70 text-gray-800 transition-colors"
          >
            <ClipboardList size={20} className="text-purple-600" />
            Listado de gastos
          </Link>

        </nav>

        {/* Footer */}
        <div className="mt-6 pt-3 text-xs text-gray-500 border-t">
          <p className="font-medium">Estado:</p>
          <p className="mt-1 flex items-center gap-1">
            <span className="text-green-500">●</span>
            Modo Offline listo
          </p>
          <p className="mt-1">Versión v0.2</p>
        </div>
      </aside>
    </>
  );
}