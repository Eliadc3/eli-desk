import { Badge } from "@/components/ui/badge";
import {
  STATUS_CONFIG,
  normalizeTicketStatus,
  type TicketStatus,
} from "@/lib/ticketStatus";

type Props = {
  status?: string | null;
  label?: string | null;
  color?: string | null;
};

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");

  if (clean.length !== 6) {
    return undefined;
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TicketStatusBadge({ status, label, color }: Props) {
  const normalized = normalizeTicketStatus(status) as TicketStatus;
  const fallback = STATUS_CONFIG[normalized];

  const finalLabel = label?.trim() || fallback.label;
  const finalColor = color?.trim() || fallback.color;

  const bg = finalColor?.startsWith("#")
    ? hexToRgba(finalColor, 0.12)
    : undefined;

  const border = finalColor?.startsWith("#") ? finalColor : undefined;
  const text = finalColor?.startsWith("#") ? finalColor : undefined;

  if (finalColor?.startsWith("#")) {
    return (
      <Badge
        variant="outline"
        style={{
          backgroundColor: bg,
          borderColor: border,
          color: text,
        }}
        className="font-medium"
      >
        {finalLabel}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={fallback.badgeClassName}>
      {finalLabel}
    </Badge>
  );
}