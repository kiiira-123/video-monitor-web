import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请在 .env 中配置（可参考 .env.example）。"
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");

export const VIDEOS_BUCKET = "videos";

const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|mkv|m4v|avi)$/i;

export function isVideoFile(name: string): boolean {
  return VIDEO_EXT.test(name);
}
