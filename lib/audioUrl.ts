/**
 * Session audio is stored in a PRIVATE Supabase bucket and reached through a
 * signed URL. The server signs for 7 days and writes that URL into
 * `sessions.audio_url` permanently — so any session opened more than a week
 * after it was generated gets a 400 (`"exp" claim timestamp check failed`), and
 * the `<audio>` element reports a format error because it was handed JSON.
 *
 * The durable identifier is the storage PATH, not the URL. These helpers pull
 * the path back out of a stored URL so each client can mint a fresh signed URL
 * at playback time.
 *
 * The bucket stays private deliberately: this audio speaks a person's own
 * issues aloud, so a permanent public URL is not an acceptable trade for
 * convenience.
 */

/** Where session narration lives. */
export const SESSION_AUDIO_BUCKET = "session-audio";

/**
 * Extract the object path from a stored audio URL.
 *
 * Handles the shapes Supabase storage produces — `/object/sign/<bucket>/<path>`,
 * `/object/public/<bucket>/<path>` and a bare `/object/<bucket>/<path>` — and
 * returns the path WITHOUT the bucket, which is what `createSignedUrl` wants.
 * Returns null for anything unrecognisable rather than guessing.
 */
export function storagePathFromAudioUrl(
  audioUrl: string | null | undefined,
  bucket: string = SESSION_AUDIO_BUCKET,
): string | null {
  if (!audioUrl) return null;

  let pathname: string;
  try {
    pathname = new URL(audioUrl).pathname;
  } catch {
    // Already a bare path rather than a URL.
    pathname = audioUrl;
  }

  const marker = `/${bucket}/`;
  const at = pathname.indexOf(marker);
  if (at === -1) return null;

  const path = pathname.slice(at + marker.length);
  if (!path) return null;

  // Supabase returns percent-encoded segments; storage expects them decoded.
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * Has a stored signed URL already expired?
 *
 * Reads the `exp` claim from the token rather than trusting how old the row is,
 * and treats anything unreadable as expired — re-signing a URL that was still
 * valid is harmless, while playing a dead one is silence the user cannot
 * explain.
 */
export function isSignedUrlExpired(
  audioUrl: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!audioUrl) return true;

  let token: string | null = null;
  try {
    token = new URL(audioUrl).searchParams.get("token");
  } catch {
    return true;
  }
  if (!token) return true;

  const payload = token.split(".")[1];
  if (!payload) return true;

  try {
    const json = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded: unknown = JSON.parse(
      typeof atob === "function"
        ? atob(json)
        : Buffer.from(json, "base64").toString("utf8"),
    );
    const exp = (decoded as { exp?: unknown }).exp;
    if (typeof exp !== "number") return true;
    return exp * 1000 <= nowMs;
  } catch {
    return true;
  }
}
