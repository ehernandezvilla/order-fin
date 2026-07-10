import type { Tag } from "@/lib/types";

export function TagFilter({
  tags,
  selected,
  onChange,
}: {
  tags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (tags.length === 0) return null;

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-6 pb-4">
      {tags.map((t) => {
        const active = selected.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              active ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
