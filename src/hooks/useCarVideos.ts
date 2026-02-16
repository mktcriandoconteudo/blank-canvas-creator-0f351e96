import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type VideoType = "start" | "victory" | "defeat" | "collision";

export interface CarVideoMap {
  [carImageKey: string]: {
    start?: string;
    victory?: string;
    defeat?: string;
    collision?: string;
  };
}

export const useCarVideos = () => {
  const [videos, setVideos] = useState<CarVideoMap>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("car_race_videos")
      .select("car_image_key, video_type, video_url");
    const map: CarVideoMap = {};
    (data ?? []).forEach((row: any) => {
      if (!map[row.car_image_key]) map[row.car_image_key] = {};
      map[row.car_image_key][row.video_type as VideoType] = row.video_url;
    });
    setVideos(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { videos, loading, refresh: load };
};

/** Upload a video file to storage and save the reference */
export async function uploadCarVideo(
  carImageKey: string,
  videoType: VideoType,
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "mp4";
  const path = `${carImageKey}/${videoType}.${ext}`;

  // Upload to storage (upsert)
  const { error: uploadError } = await supabase.storage
    .from("car-videos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[CarVideo] Upload error:", uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage.from("car-videos").getPublicUrl(path);
  const videoUrl = urlData.publicUrl;

  // Upsert reference in DB
  const { error: dbError } = await supabase
    .from("car_race_videos")
    .upsert(
      { car_image_key: carImageKey, video_type: videoType, video_url: videoUrl, updated_at: new Date().toISOString() },
      { onConflict: "car_image_key,video_type" }
    );

  if (dbError) {
    console.error("[CarVideo] DB upsert error:", dbError);
    return null;
  }

  return videoUrl;
}

/** Delete a car video */
export async function deleteCarVideo(
  carImageKey: string,
  videoType: VideoType
): Promise<boolean> {
  // Try to remove from storage (best effort)
  await supabase.storage.from("car-videos").remove([`${carImageKey}/${videoType}.mp4`]);

  const { error } = await supabase
    .from("car_race_videos")
    .delete()
    .eq("car_image_key", carImageKey)
    .eq("video_type", videoType);

  return !error;
}
