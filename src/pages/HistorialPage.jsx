import MandadosList from "../features/mandados/ui/MandadosList";

export default function HistorialPage() {
  return (
    <section className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-100 text-center">
        Historial / Pendientes
      </h1>
      <MandadosList />
    </section>
  );
}
