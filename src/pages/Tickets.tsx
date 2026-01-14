import { MainLayout } from "@/components/layout/MainLayout";
import { TicketsTable, TicketRow } from "@/components/tickets/TicketsTable";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";

const mockTickets: TicketRow[] = [
  {
    id: "TKT-001",
    subject: "המחשב לא נדלק לאחר עדכון Windows",
    requester: { name: "אלכס גולדשטיין", initials: "אג" },
    organization: "חברת הייטק בע״מ",
    status: "new",
    priority: "high",
    assignee: { name: "יוסי כהן", initials: "יכ" },
    createdAt: "לפני 15 דקות",
    isOverdue: false,
  },
  {
    id: "TKT-002",
    subject: "בעיה בהתחברות ל-VPN מהבית",
    requester: { name: "מיכל לוי", initials: "מל" },
    organization: "סטארטאפ חדש",
    status: "in-progress",
    priority: "medium",
    assignee: { name: "מיכל לוי", initials: "מל" },
    createdAt: "לפני שעה",
    isOverdue: false,
  },
  {
    id: "TKT-003",
    subject: "בקשה להתקנת תוכנה חדשה - Adobe Creative Suite",
    requester: { name: "דוד כהן", initials: "דכ" },
    organization: "משרד עורכי דין",
    status: "waiting",
    priority: "low",
    createdAt: "לפני 2 שעות",
    isOverdue: false,
  },
  {
    id: "TKT-004",
    subject: "שרת האימייל לא מגיב - דחוף!",
    requester: { name: "שרה ישראלי", initials: "שי" },
    organization: "חברת הייטק בע״מ",
    status: "in-progress",
    priority: "critical",
    assignee: { name: "דוד אברהם", initials: "דא" },
    createdAt: "לפני 3 שעות",
    isOverdue: true,
  },
  {
    id: "TKT-005",
    subject: "עדכון הרשאות משתמש למערכת CRM",
    requester: { name: "יוסי אברהם", initials: "יא" },
    organization: "סוכנות ביטוח",
    status: "resolved",
    priority: "medium",
    assignee: { name: "שרה גולן", initials: "שג" },
    createdAt: "לפני 4 שעות",
    isOverdue: false,
  },
  {
    id: "TKT-006",
    subject: "התקנת מדפסת חדשה בקומה 3",
    requester: { name: "רונית שמעון", initials: "רש" },
    organization: "חברת הייטק בע״מ",
    status: "new",
    priority: "low",
    createdAt: "לפני 5 שעות",
    isOverdue: false,
  },
  {
    id: "TKT-007",
    subject: "בעיה באתר החברה - לא נטען כראוי",
    requester: { name: "גיל מזרחי", initials: "גמ" },
    organization: "סטארטאפ חדש",
    status: "in-progress",
    priority: "high",
    assignee: { name: "יוסי כהן", initials: "יכ" },
    createdAt: "אתמול",
    isOverdue: false,
  },
  {
    id: "TKT-008",
    subject: "שדרוג זיכרון למחשב נייד",
    requester: { name: "נועה ברק", initials: "נב" },
    organization: "משרד עורכי דין",
    status: "closed",
    priority: "low",
    assignee: { name: "מיכל לוי", initials: "מל" },
    createdAt: "לפני יומיים",
    isOverdue: false,
  },
];

export default function Tickets() {
  return (
    <MainLayout
      title="קריאות"
      subtitle={`${mockTickets.length} קריאות סה״כ`}
    >
      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            קריאה חדשה
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            ייצוא
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            ייבוא
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TicketFilters />

      {/* Table */}
      <TicketsTable tickets={mockTickets} />

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>מציג 1-8 מתוך 48 קריאות</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            הקודם
          </Button>
          <Button variant="outline" size="sm">
            הבא
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
