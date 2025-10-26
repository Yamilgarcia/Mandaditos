import MandadoForm from "../features/mandados/ui/MandadoForm";

export default function MandarPage() {
  return (
    <section className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-800 text-center">
        Registrar Mandado
      </h1>
      <MandadoForm />
    </section>
  );
}
