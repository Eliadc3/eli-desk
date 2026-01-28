import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";

export default function PublicTicketCreated() {
    const nav = useNavigate();
    const loc = useLocation() as any;

    const ticketNumber = loc.state?.ticketNumber ?? "—";

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle>הקריאה נשלחה בהצלחה</CardTitle>
                    <CardDescription>אין צורך בהתחברות</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-lg">
                        מספר קריאה: <span className="font-extrabold">{ticketNumber}</span>
                    </div>
                    <Button className="w-full" onClick={() => nav("/")}>
                       חזרה למסך הראשי
                    </Button>
                    <Button className="w-full" onClick={() => nav("/public/new")}>
                        פתיחת קריאה נוספת
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
