import { formatCLP } from "@/lib/format";

export function AmountSummary({
  total,
  label,
  dailyAverage,
}: {
  total: number;
  label: string;
  dailyAverage?: number;
}) {
  return (
    <section className="bg-brand px-6 py-6 text-white">
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{formatCLP(total)}</p>
      {dailyAverage !== undefined && (
        <p className="mt-1 text-xs opacity-70">{formatCLP(dailyAverage)} / día en promedio</p>
      )}
    </section>
  );
}
