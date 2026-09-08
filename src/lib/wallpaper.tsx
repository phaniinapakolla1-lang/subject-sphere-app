import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "studyos.wallpaper";

type WallpaperContextValue = {
  wallpaper: string | null;
  setWallpaper: (url: string) => Promise<void>;
  resetWallpaper: () => void;
};

const WallpaperContext = createContext<WallpaperContextValue>({
  wallpaper: null,
  setWallpaper: async () => {},
  resetWallpaper: () => {},
});

export function preloadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image failed to load"));
    img.referrerPolicy = "no-referrer";
    img.src = url;
  });
}

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [wallpaper, setWallpaperState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setWallpaperState(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (wallpaper) root.classList.add("has-wallpaper");
    else root.classList.remove("has-wallpaper");
  }, [wallpaper]);

  const setWallpaper = useCallback(async (url: string) => {
    await preloadImage(url);
    localStorage.setItem(STORAGE_KEY, url);
    setWallpaperState(url);
  }, []);

  const resetWallpaper = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setWallpaperState(null);
  }, []);

  const value = useMemo(
    () => ({ wallpaper, setWallpaper, resetWallpaper }),
    [wallpaper, setWallpaper, resetWallpaper],
  );

  return (
    <WallpaperContext.Provider value={value}>
      <WallpaperLayer url={wallpaper} />
      {children}
    </WallpaperContext.Provider>
  );
}

function WallpaperLayer({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div
        key={url}
        className="absolute inset-0 animate-in fade-in duration-700 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${url}")` }}
      />
      <div className="absolute inset-0 bg-background/65 backdrop-blur-[2px]" />
    </div>
  );
}

export function useWallpaper() {
  return useContext(WallpaperContext);
}
