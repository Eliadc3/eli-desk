import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TicketEditableSectionsProps {
  draft: any;
  setDraft: (updater: any) => void;
  canEdit: boolean;
  showNotes: boolean;
}

export function TicketEditableSections(props: TicketEditableSectionsProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>תוכן הקריאה</CardTitle>
          <CardDescription>נערך ונשמר רק בלחיצה על “שמור”</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">נושא</label>
            <Input disabled={!props.canEdit} value={props.draft?.subject ?? ""} onChange={(e) => props.setDraft((prev: any) => ({ ...prev, subject: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">תיאור</label>
            <Textarea disabled={!props.canEdit} value={props.draft?.description ?? ""} onChange={(e) => props.setDraft((prev: any) => ({ ...prev, description: e.target.value }))} rows={10} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פתרון</CardTitle>
          <CardDescription>סיכום + פרטים (פנימי) — נשמר רק בלחיצה על “שמור”</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">סיכום</label>
            <Input disabled={!props.canEdit} value={props.draft?.resolutionSummary ?? ""} onChange={(e) => props.setDraft((prev: any) => ({ ...prev, resolutionSummary: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">פתרון מורחב</label>
            <Textarea disabled={!props.canEdit} value={props.draft?.resolutionDetails ?? ""} onChange={(e) => props.setDraft((prev: any) => ({ ...prev, resolutionDetails: e.target.value }))} rows={7} />
          </div>
        </CardContent>
      </Card>

      {props.showNotes && (
        <Card>
          <CardHeader>
            <CardTitle>הערות</CardTitle>
            <CardDescription>הערות פנימיות — נשמרות רק בלחיצה על “שמור”</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={props.draft?.notes ?? ""} onChange={(e) => props.setDraft((prev: any) => ({ ...prev, notes: e.target.value }))} rows={7} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
