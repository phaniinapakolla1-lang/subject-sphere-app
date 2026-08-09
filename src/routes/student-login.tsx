import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/student-login")({
  head: () => ({
    meta: [
      { title: "Student sign in — StudyOS" },
      {
        name: "description",
        content:
          "Sign in to your StudyOS student workspace. Accounts are created by your administrator.",
      },
      { property: "og:title", content: "Student sign in — StudyOS" },
      {
        property: "og:description",
        content: "Access your personal StudyOS study workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentLogin,
});

function StudentLogin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(email);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!remember) sessionStorage.setItem("studyos:session-only", "1");
        toast.success("Welcome back");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  if (sent) {
    return (
      <Centered>
        <Mail className="size-8 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a reset link to <span className="text-foreground">{sent}</span>.
        </p>
        <Button variant="ghost" className="mt-6" onClick={() => setSent(null)}>
          Back to sign in
        </Button>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="flex size-11 items-center justify-center rounded-2xl aurora-bg">
        <BookOpen className="size-6 text-primary-foreground" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        {forgot ? "Reset your password" : "Student sign in"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {forgot
          ? "We'll email you a secure reset link."
          : "Use the credentials issued by your administrator."}
      </p>

      <form onSubmit={submit} className="mt-7 w-full space-y-4 text-left">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
          />
        </div>
        {!forgot && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}
        {!forgot && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Remember me
            </label>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setForgot(true)}
            >
              Forgot password?
            </button>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {forgot ? "Send reset link" : "Sign in"}
        </Button>
        {forgot && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setForgot(false)}
          >
            Back to sign in
          </Button>
        )}
      </form>

      {!forgot && (
        <>
          <div className="my-5 flex w-full items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or{" "}
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
            <GoogleIcon /> Continue with Google
          </Button>
        </>
      )}

      <p className="mt-6 max-w-xs text-xs text-muted-foreground">
        Public sign-up is disabled. Student accounts are created by an administrator —
        ask your institute for access, or explore the free demo first.
      </p>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
        <Link to="/admin" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ShieldCheck className="size-3.5" /> Admin portal
        </Link>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full opacity-20 blur-3xl aurora-bg" />
      <div className="panel relative flex w-full max-w-md flex-col items-center p-8 text-center animate-rise">
        {children}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 3c2.3-2.1 3.6-5.2 3.6-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6l-4-3a12 12 0 0 0 0 10.6l4-3Z" />
      <path fill="#EA4335" d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.7l3.9 3C6.1 6.8 8.8 4.7 12 4.7Z" />
    </svg>
  );
}
