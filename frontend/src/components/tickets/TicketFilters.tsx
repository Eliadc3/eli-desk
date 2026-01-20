import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface TicketFiltersProps {
  onSearch?: (query: string) => void;
  onStatusChange?: (status: string) => void;
  onPriorityChange?: (priority: string) => void;

  onAssigneeChange?: (value: "all" | "me" | "unassigned") => void;

  // אופציונלי: כפתור נקה יעיל
  onClear?: () => void;
}

export function TicketFilters({
  onSearch,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onClear,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי נושא, מזהה או פונה..."
          className="pr-9"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      {/* Status Filter */}
      <Select onValueChange={onStatusChange}>
        <SelectTrigger className="w-36 text-right" dir="rtl">
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">הכל</SelectItem>
          <SelectItem value="new">חדש</SelectItem>
          <SelectItem value="in-progress">בטיפול</SelectItem>
          <SelectItem value="waiting">ממתין ללקוח</SelectItem>
          <SelectItem value="resolved">נפתר</SelectItem>
          <SelectItem value="closed">סגור</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select onValueChange={onPriorityChange}>
        <SelectTrigger className="w-32" dir="rtl">
          <SelectValue placeholder="עדיפות" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">הכל</SelectItem>
          <SelectItem value="critical">קריטי</SelectItem>
          <SelectItem value="high">גבוה</SelectItem>
          <SelectItem value="medium">בינוני</SelectItem>
          <SelectItem value="low">נמוך</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee Filter */}
      <Select onValueChange={(v) => onAssigneeChange?.(v as any)}>
        <SelectTrigger className="w-36 rtl-select" dir="rtl">
          <SelectValue placeholder="משויך ל" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">הכל</SelectItem>
          <SelectItem value="me">הקריאות שלי</SelectItem>
          <SelectItem value="unassigned">לא משויך</SelectItem>
        </SelectContent>
      </Select>

      {/* More Filters */}
      <Button variant="outline" className="gap-2">
        <Filter className="w-4 h-4" />
        פילטרים נוספים
      </Button>

      {/* Clear Filters */}
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground"
        onClick={onClear}
        disabled={!onClear}
      >
        <X className="w-4 h-4" />
        נקה
      </Button>
    </div>
  );
}
