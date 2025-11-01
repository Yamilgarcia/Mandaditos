import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import MandarPage from "./pages/MandarPage";
import ResumenPage from "./pages/ResumenPage";
import HistorialPage from "./pages/HistorialPage";
import GastosPage from "./pages/GastosPage";
import PendientesPage from "./pages/PendientesPage";
import GastosList from "./features/gastos/ui/GastosList";
import AperturaPage from "./pages/AperturaPage";
import DailySummaryV2 from "./features/summaryV2/ui/DailySummaryV2";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<MandarPage />} />
        <Route path="/resumen" element={<ResumenPage />} />
        <Route path="/historial" element={<HistorialPage />} />
        <Route path="/gastos" element={<GastosPage />} />
        <Route path="/pendientes" element={<PendientesPage />} />
        <Route path="/GastosList" element={<GastosList />} />
        <Route path="/apertura" element={<AperturaPage />} />
        <Route path="/resumen-v2" element={<DailySummaryV2 />} />

      </Route>
    </Routes>
  );
}
