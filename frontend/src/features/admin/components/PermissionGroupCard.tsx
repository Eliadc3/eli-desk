import { Checkbox } from "@/components/ui/checkbox";
import type { Permission } from "@/api/auth";

interface PermissionGroupCardProps {
  title: string;
  items: { key: Permission; label: string }[];
  values: Permission[];
  onChange: (next: Permission[]) => void;
}

export function PermissionGroupCard({ title, items, values, onChange }: PermissionGroupCardProps) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="text-xs text-muted-foreground mb-3">{title}</div>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const checked = values.includes(item.key);
          return (
            <label key={item.key} className="inline-flex flex-row items-center gap-2 text-sm" dir="rtl">
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => {
                  const next = value
                    ? Array.from(new Set([...values, item.key]))
                    : values.filter((existing) => existing !== item.key);
                  onChange(next);
                }}
              />
              <span className="text-right">{item.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
