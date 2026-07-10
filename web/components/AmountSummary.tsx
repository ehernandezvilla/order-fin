import { formatCLP } from "@/lib/format";

export function AmountSummary({ total, label }: { total: number; label: string }) {
  return (
    <section className="bg-brand px-6 py-6 text-white">
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{formatCLP(total)}</p>
    </section>
  );
}
