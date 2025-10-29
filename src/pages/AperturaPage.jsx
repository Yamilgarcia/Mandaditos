import { getTodayStr } from "../utils/date";
import AperturaDiaCard from "../features/aperturas/ui/AperturaDiaCard";

export default function AperturaPage() {
  const fecha = getTodayStr();
  return (
    <div className="px-4 pb-16">
      <AperturaDiaCard fecha={fecha} />
    </div>
  );
}
