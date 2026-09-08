import { useState } from "react";
import { Heart, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useWallpaper } from "@/lib/wallpaper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WallpaperDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { wallpaper, setWallpaper, resetWallpaper } = useWallpaper();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function apply() {
    const value = url.trim();
    if (!value) return;
    setBusy(true);
    try {
      await setWallpaper(value);
      toast.success("Wallpaper applied ❤️");
      onOpenChange(false);
      setUrl("");
    } catch {
      toast.error("Oops ❤️ That image link doesn't seem to work. Please check the URL and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Make it yours <Heart className="size-4 text-primary" />
          </DialogTitle>
          <DialogDescription>
            Choose a picture that makes you happy. Paste an image link to set it as your wallpaper.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="wallpaper-url">Image URL</Label>
          <Input
            id="wallpaper-url"
            value={url}
            placeholder="Paste your image link here…"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void apply();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Works with direct links ending in .jpg, .png or .webp.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {wallpaper ? (
            <Button
              variant="ghost"
              onClick={() => {
                resetWallpaper();
                toast.success("Back to the original wallpaper");
                onOpenChange(false);
              }}
            >
              <ImageIcon className="size-4" /> Reset wallpaper
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={apply} disabled={busy || !url.trim()}>
              {busy ? "Checking…" : "Apply wallpaper ❤️"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
