import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";

export default function TicketCreated() {
  const nav = useNavigate();
  const loc = useLocation() as any;

  const ticketNumber = loc.state?.ticketNumber ?? "—";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="max-w-xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>הקריאה נפתחה בהצלחה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg">
              מספר קריאה: <span className="font-extrabold">{ticketNumber}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => nav("/")}>למסך הראשי</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
