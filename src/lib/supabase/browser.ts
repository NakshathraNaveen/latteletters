"use client";
import { createBrowserClient } from "@supabase/ssr";
import { PHOTO_BUCKET } from "./public";

/** Browser client. Only used to upload photos to server-signed upload URLs. */
export function uploadToSignedUrl(path: string, token: string, file: Blob) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return supabase.storage.from(PHOTO_BUCKET).uploadToSignedUrl(path, token, file, { contentType: file.type });
}
