import { Badge } from "@/components/ui/badge";

type Props = {
  statusKey?: string | null;
  label?: string | null;
  color?: string | null;
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");

  if (clean.length !== 6) {
    return null;
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return { r, g, b };
}

function hexToRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function prettifyStatusKey(key?: string | null) {
  if (!key) return "—";

  return String(key)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getContrastTextColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;

  const luminance =
    (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.7 ? "#111827" : hex;
}

export function TicketStatusBadge({ statusKey, label, color }: Props) {
  const finalLabel = label?.trim() || prettifyStatusKey(statusKey);
  const finalColor = color?.trim() || "";

  if (finalColor.startsWith("#")) {
    const textColor = getContrastTextColor(finalColor);

    return (
      <Badge
        variant="outline"
        className="font-medium"
        style={{
          backgroundColor: hexToRgba(finalColor, 0.14),
          borderColor: finalColor,
          color: textColor,
        }}
      >
        {finalLabel}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-medium text-foreground">
      {finalLabel}
    </Badge>
  );
}