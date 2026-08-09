import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin portal — StudyOS" },
      {
        name: "description",
        content:
          "Administrator sign in for StudyOS. Manage student accounts, access and platform activity.",
      },
      { property: "og:title", content: "Admin portal — StudyOS" },
      { property: "og:description", content: "Manage StudyOS student accounts and access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && role === "admin") {
      navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [loading, user, role, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account does not have administrator access.");
      }
      toast.success("Signed in as administrator");
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full opacity-20 blur-3xl aurora-bg" />
      <div className="panel relative flex w-full max-w-md flex-col items-center p-8 text-center animate-rise">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Admin portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restricted area — administrators only.
        </p>

        <form onSubmit={submit} className="mt-7 w-full space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@college.edu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Sign in
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-4 text-xs">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Back to home
          </Link>
          <Link to="/student-login" className="text-muted-foreground hover:text-foreground">
            Student login
          </Link>
        </div>
      </div>
    </main>
  );
}
