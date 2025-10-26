import ResumenDiaCard from "../features/mandados/ui/ResumenDiaCard";

export default function ResumenPage() {
  return (
    <section className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-800 text-center">
        Resumen del Día
      </h1>
      <ResumenDiaCard />
    </section>
  );
}
