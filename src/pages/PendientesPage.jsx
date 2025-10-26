import PendientesList from "../features/mandados/ui/PendientesList";

export default function PendientesPage() {
  return (
    <section className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-800 text-center">
        Pagos pendientes
      </h1>
      <PendientesList />
    </section>
  );
}
