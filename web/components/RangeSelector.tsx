import { RANGE_OPTIONS, type RangeKey } from "@/lib/format";

export function RangeSelector({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-6 py-4">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
            value === opt.key ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
