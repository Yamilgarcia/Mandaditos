import CalculadoraCierre from "../features/cierre/ui/CalculadoraCierre";

export default function ResumenPage() {
  return (
    <section className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-800 text-center">
        Cierre
      </h1>
      <CalculadoraCierre />
    </section>
  );
}
