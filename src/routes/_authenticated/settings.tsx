import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useOne, useUpdate } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StudyOS" },
      { name: "description", content: "Personalise your StudyOS workspace and study goals." },
      { property: "og:title", content: "Settings — StudyOS" },
      { property: "og:description", content: "Personalise your StudyOS workspace and study goals." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const profile = useOne("profiles", user?.id);
  const update = useUpdate("profiles", { silent: true });
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const [name, setName] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  const displayName = name ?? profile.data?.display_name ?? "";
  const dailyGoal = goal ?? String(profile.data?.daily_goal_minutes ?? 120);

  function save() {
    if (!user) return;
    update.mutate({
      id: user.id,
      values: {
        display_name: displayName || null,
        daily_goal_minutes: Number(dailyGoal) || 0,
        theme,
        font_size: fontSize,
      },
    });
    toast.success("Settings saved");
  }

  return (
    <div className="animate-rise max-w-2xl">
      <PageHeader title="Settings" subtitle="Make StudyOS feel like yours" />

      <div className="panel space-y-5 p-6">
        <div className="space-y-2">
          <Label>Display name</Label>
          <Input value={displayName} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Daily study goal (minutes)</Label>
          <Input type="number" value={dailyGoal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Font size</Label>
            <Select value={fontSize} onValueChange={(v) => setFontSize(v as typeof fontSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Compact</SelectItem>
                <SelectItem value="md">Default</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={save}>Save settings</Button>
      </div>
    </div>
  );
}
