import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgClass?: string;
  iconTextClass?: string;
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  iconBgClass = "bg-primary/10",
  iconTextClass = "text-primary",
}: KPICardProps) {
  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-label">{title}</p>
          <p className="kpi-value mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">מהשבוע שעבר</span>
            </div>
          )}
        </div>
        <div className={cn("kpi-icon", iconBgClass, iconTextClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
