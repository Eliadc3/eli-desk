import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Headphones, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, just navigate to dashboard
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-sidebar flex" dir="rtl">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Headphones className="w-7 h-7 text-sidebar-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-sidebar-foreground">
            HelpDesk Pro
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            מערכת ניהול קריאות
            <br />
            מתקדמת לצוותי IT
          </h1>
          <p className="text-lg text-sidebar-foreground/70 max-w-md">
            נהלו קריאות שירות, עקבו אחר SLA, ותנו מענה מהיר ומקצועי ללקוחות שלכם.
          </p>
          <div className="flex items-center gap-8 pt-6">
            <div>
              <p className="text-3xl font-bold text-sidebar-primary">1,200+</p>
              <p className="text-sm text-sidebar-foreground/60">קריאות נפתרו השבוע</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-sidebar-primary">98%</p>
              <p className="text-sm text-sidebar-foreground/60">עמידה ב-SLA</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-sidebar-primary">24 דק׳</p>
              <p className="text-sm text-sidebar-foreground/60">זמן תגובה ממוצע</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-sidebar-foreground/50">
          © 2026 HelpDesk Pro. כל הזכויות שמורות.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HelpDesk Pro</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">ברוכים הבאים</h2>
            <p className="text-muted-foreground mt-2">
              התחברו לחשבון שלכם להמשך
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">סיסמה</Label>
                <a
                  href="#"
                  className="text-sm text-primary hover:underline"
                >
                  שכחתם סיסמה?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                זכור אותי
              </Label>
            </div>

            <Button type="submit" className="w-full" size="lg">
              התחברות
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              אין לכם חשבון?{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                צרו קשר עם מנהל המערכת
              </a>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-medium text-foreground">דמו:</span> לחצו
              "התחברות" לכניסה מיידית
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
