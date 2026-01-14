import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Clock,
  User,
  Building2,
  Timer,
  Play,
  Pause,
  Paperclip,
  Send,
  MoreHorizontal,
  MessageSquare,
  FileText,
  CheckSquare,
  History,
} from "lucide-react";

export default function TicketDetail() {
  const { id } = useParams();

  // Mock ticket data
  const ticket = {
    id: id || "TKT-001",
    subject: "המחשב לא נדלק לאחר עדכון Windows",
    description:
      "לאחר עדכון Windows אתמול בלילה, המחשב לא מצליח לעלות. מופיעה הודעת שגיאה כחולה ואז מתחיל מחדש. כבר ניסיתי להפעיל במצב בטוח אבל לא עוזר.",
    status: "in-progress" as const,
    priority: "high" as const,
    requester: { name: "אלכס גולדשטיין", initials: "אג", email: "alex@company.com" },
    organization: "חברת הייטק בע״מ",
    assignee: { name: "יוסי כהן", initials: "יכ" },
    createdAt: "14/01/2026 09:30",
    updatedAt: "14/01/2026 10:45",
    sla: {
      firstResponse: { deadline: "14/01/2026 11:30", met: true },
      resolution: { deadline: "15/01/2026 17:00", remaining: "28 שעות" },
    },
    timeTracked: "1 שעה 15 דקות",
  };

  const timeline = [
    {
      id: 1,
      type: "comment",
      user: { name: "אלכס גולדשטיין", initials: "אג" },
      content: "המחשב עדיין לא עובד. יש משהו חדש?",
      createdAt: "14/01/2026 10:45",
      isPublic: true,
    },
    {
      id: 2,
      type: "status_change",
      user: { name: "יוסי כהן", initials: "יכ" },
      content: 'שינה סטטוס מ"חדש" ל"בטיפול"',
      createdAt: "14/01/2026 10:00",
      isPublic: false,
    },
    {
      id: 3,
      type: "comment",
      user: { name: "יוסי כהן", initials: "יכ" },
      content:
        "שלום אלכס, קיבלתי את הקריאה ואבדוק את הנושא. האם תוכל לצלם את הודעת השגיאה הכחולה?",
      createdAt: "14/01/2026 09:45",
      isPublic: true,
    },
    {
      id: 4,
      type: "created",
      user: { name: "אלכס גולדשטיין", initials: "אג" },
      content: "פתח קריאה חדשה",
      createdAt: "14/01/2026 09:30",
      isPublic: false,
    },
  ];

  return (
    <MainLayout>
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימת הקריאות
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {ticket.id}
              </span>
              <TicketStatusBadge status={ticket.status} size="md" />
              <TicketPriorityBadge priority={ticket.priority} size="md" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              {ticket.subject}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Play className="w-4 h-4" />
              התחל טיימר
            </Button>
            <Button variant="outline">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              תיאור
            </h3>
            <p className="text-foreground">{ticket.description}</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1">
              <TabsTrigger value="timeline" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                טיימליין
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-2">
                <Paperclip className="w-4 h-4" />
                קבצים
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <CheckSquare className="w-4 h-4" />
                משימות
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                היסטוריה
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4 space-y-4">
              {/* Reply Box */}
              <div className="bg-card rounded-lg border border-border p-4">
                <Textarea
                  placeholder="הוסף תגובה..."
                  className="min-h-[100px] mb-3"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Select defaultValue="public">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">תגובה ציבורית</SelectItem>
                        <SelectItem value="internal">הערה פנימית</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="gap-2">
                    <Send className="w-4 h-4" />
                    שלח
                  </Button>
                </div>
              </div>

              {/* Timeline Items */}
              <div className="space-y-4">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className={`timeline-item ${
                      item.type === "comment" ? "bg-card rounded-lg border border-border p-4" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback
                          className={`text-xs ${
                            item.isPublic
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {item.user.name}
                          </span>
                          {!item.isPublic && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                              פנימי
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {item.createdAt}
                          </span>
                        </div>
                        <p
                          className={`text-sm ${
                            item.type === "comment"
                              ? "text-foreground"
                              : "text-muted-foreground italic"
                          }`}
                        >
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">אין קבצים מצורפים</p>
                <Button variant="outline" className="mt-4 gap-2">
                  <Paperclip className="w-4 h-4" />
                  העלה קובץ
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">אין משימות</p>
                <Button variant="outline" className="mt-4 gap-2">
                  <CheckSquare className="w-4 h-4" />
                  הוסף משימה
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="bg-card rounded-lg border border-border divide-y divide-border">
                {timeline
                  .filter((item) => item.type !== "comment")
                  .map((item) => (
                    <div key={item.id} className="p-3 flex items-center gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          {item.user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground flex-1">
                        <span className="font-medium text-foreground">
                          {item.user.name}
                        </span>{" "}
                        {item.content}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.createdAt}
                      </span>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* SLA */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              SLA
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">תגובה ראשונה</span>
                <span className="text-sm font-medium text-green-600">✓ עמד</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">פתרון</span>
                <span className="text-sm font-medium text-foreground">
                  {ticket.sla.resolution.remaining}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                סטטוס
              </label>
              <Select defaultValue={ticket.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">חדש</SelectItem>
                  <SelectItem value="in-progress">בטיפול</SelectItem>
                  <SelectItem value="waiting">ממתין ללקוח</SelectItem>
                  <SelectItem value="resolved">נפתר</SelectItem>
                  <SelectItem value="closed">סגור</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                עדיפות
              </label>
              <Select defaultValue={ticket.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">קריטי</SelectItem>
                  <SelectItem value="high">גבוה</SelectItem>
                  <SelectItem value="medium">בינוני</SelectItem>
                  <SelectItem value="low">נמוך</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                משויך ל
              </label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {ticket.assignee.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">{ticket.assignee.name}</span>
              </div>
            </div>
          </div>

          {/* Requester */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              פונה
            </h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {ticket.requester.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {ticket.requester.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ticket.requester.email}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              {ticket.organization}
            </div>
          </div>

          {/* Time Tracking */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              זמן עבודה
            </h3>
            <p className="text-2xl font-semibold text-foreground">
              {ticket.timeTracked}
            </p>
            <Button variant="outline" className="w-full mt-3 gap-2">
              <Play className="w-4 h-4" />
              התחל טיימר
            </Button>
          </div>

          {/* Timestamps */}
          <div className="bg-card rounded-lg border border-border p-4 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">נוצר</span>
              <span className="text-foreground">{ticket.createdAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">עודכן</span>
              <span className="text-foreground">{ticket.updatedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
