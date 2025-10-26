import GastoForm from "../features/gastos/ui/GastoForm";

export default function GastosPage() {
  return (
    <section className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-800 text-center">
        Gastos personales
      </h1>
      <GastoForm />
    </section>
  );
}
