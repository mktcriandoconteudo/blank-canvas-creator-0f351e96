import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET = "site-assets";

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
      if (data) {
        const logo = data.find((f) => f.name.startsWith("logo."));
        const favicon = data.find((f) => f.name.startsWith("favicon."));
        setLogoUrl(logo ? getPublicUrl(logo.name) + "?t=" + Date.now() : null);
        setFaviconUrl(favicon ? getPublicUrl(favicon.name) + "?t=" + Date.now() : null);
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
