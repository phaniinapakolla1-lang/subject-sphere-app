// Shared Supabase factory for MCP tools. Never import the browser client here:
// MCP tools run on the server and must use a caller-scoped client.
import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";

function supabaseProjectUrl(): string {
  const url = process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"];
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return url;
}

function supabasePublishableKey(): string {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!key) throw new Error("SUPABASE_PUBLISHABLE_KEY is not configured");
  return key;
}

/**
 * Authenticated client for MCP tools. RLS applies as the calling user.
 * Requires a verified OAuth token — never fall back to anonymous access.
 */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("supabaseForUser requires a verified OAuth token");
  return createClient<Database>(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
