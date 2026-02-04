import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin1234");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { toast } = useToast();
  const auth = useAuth();

  const onLogin = async () => {
    setBusy(true);
    try {
      await auth.login(username, password);
      toast({ title: "Logged in" });
      nav("/tickets");
    } catch (e: any) {
      toast({ title: "Login failed", description: e?.response?.data?.message ?? e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>eli-desk</CardTitle>
          <CardDescription>Sign in to manage tickets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          </div>
          <Button className="w-full" onClick={onLogin} disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
