import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET = "site-assets";
const CACHE_KEY_LOGO = "tn_logo_url";
const CACHE_KEY_FAVICON = "tn_favicon_url";

function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export interface SiteAssets {
  logoUrl: string | null;
  faviconUrl: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useSiteAssets(): SiteAssets {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => localStorage.getItem(CACHE_KEY_LOGO));
  const [faviconUrl, setFaviconUrl] = useState<string | null>(() => localStorage.getItem(CACHE_KEY_FAVICON));
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
      if (data) {
        const logo = data.find((f) => f.name.startsWith("logo."));
        const favicon = data.find((f) => f.name.startsWith("favicon."));
        const newLogoUrl = logo ? getPublicUrl(logo.name) + "?t=" + Date.now() : null;
        const newFaviconUrl = favicon ? getPublicUrl(favicon.name) + "?t=" + Date.now() : null;
        setLogoUrl(newLogoUrl);
        setFaviconUrl(newFaviconUrl);
        if (newLogoUrl) localStorage.setItem(CACHE_KEY_LOGO, newLogoUrl);
        else localStorage.removeItem(CACHE_KEY_LOGO);
        if (newFaviconUrl) localStorage.setItem(CACHE_KEY_FAVICON, newFaviconUrl);
        else localStorage.removeItem(CACHE_KEY_FAVICON);
      }
    } catch (e) {
      console.error("Error fetching site assets:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return { logoUrl, faviconUrl, loading, refresh: fetchAssets };
}

export async function uploadSiteAsset(
  file: File,
  assetName: "logo" | "favicon"
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${assetName}.${ext}`;

  // Remove existing files with same prefix
  const { data: existing } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
  if (existing) {
    const toDelete = existing.filter((f) => f.name.startsWith(`${assetName}.`)).map((f) => f.name);
    if (toDelete.length > 0) {
      await supabase.storage.from(BUCKET).remove(toDelete);
    }
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "60",
    upsert: true,
  });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  return getPublicUrl(path) + "?t=" + Date.now();
}
