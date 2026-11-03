import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // SSR has no localStorage session and would redirect signed-in users.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/student-login", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    // OAuthRedirect = user already consented; bounce straight back to the client.
    if (data && "redirect_url" in data) throw redirect({ href: data.redirect_url });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="panel max-w-md p-6 text-center">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Connection request unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load this authorization request:{" "}
          {error instanceof Error ? error.message : String(error)}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Ask the connecting app to start the connection again.
        </p>
      </div>
    </main>
  ),
});

type AuthzDetails = {
  client?: { name?: string } | null;
  scopes?: string[] | string | null;
  redirect_uri?: string | null;
} & Record<string, unknown>;

function Consent() {
  const details = Route.useLoaderData() as AuthzDetails | null;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";
  const rawScopes = Array.isArray(details?.scopes)
    ? (details?.scopes as string[])
    : typeof details?.scopes === "string"
      ? details.scopes.split(/[\s+]+/).filter(Boolean)
      : [];
  const scopeLabels = rawScopes.map((scope) => {
    if (scope === "openid" || scope === "profile") return "Share your basic profile";
    if (scope === "email") return "Share your email address";
    return `Additional permission requested: ${scope}`;
  });

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorization_id)
      : await supabase.auth.oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    // Approve/deny both resolve to OAuthRedirect with a redirect_url target.
    const target = data?.redirect_url;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="panel w-full max-w-md p-7">
        <div className="flex size-11 items-center justify-center rounded-2xl aurora-bg">
          <BookOpen className="size-6 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Connect {clientName} to StudyOS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This lets {clientName} call StudyOS Hub's study tools while you are signed in.
        </p>

        <div className="mt-5 space-y-2 rounded-lg border border-border/60 bg-background/60 p-4 text-sm">
          <p className="font-medium">What will be shared</p>
          {scopeLabels.length === 0 ? (
            <p className="text-muted-foreground">Your basic account identity.</p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {scopeLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            This does not bypass StudyOS permissions or backend policies — the connection only
            sees the study data your own account can access.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            Approve
          </Button>
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Cancel connection
          </Button>
        </div>
      </div>
    </main>
  );
}
