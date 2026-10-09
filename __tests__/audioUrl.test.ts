import {
  isSignedUrlExpired,
  SESSION_AUDIO_BUCKET,
  storagePathFromAudioUrl,
} from "../lib/audioUrl";

const BASE = "https://proj.supabase.co/storage/v1";
const PATH = "383e5974-9531-4de6-9bb4-cac401961a43/885bd571-95f8-436b-86d3-3af78ce09d17.mp3";

/** Build a signed-URL token carrying the given expiry. */
function tokenWithExp(expSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds, scope: "download" }))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.sig`;
}

describe("storagePathFromAudioUrl", () => {
  test("pulls the path out of a signed URL, dropping the bucket", () => {
    const url = `${BASE}/object/sign/${SESSION_AUDIO_BUCKET}/${PATH}?token=abc&v=123`;
    expect(storagePathFromAudioUrl(url)).toBe(PATH);
  });

  test("handles public and bare object URLs too", () => {
    expect(storagePathFromAudioUrl(`${BASE}/object/public/${SESSION_AUDIO_BUCKET}/${PATH}`)).toBe(PATH);
    expect(storagePathFromAudioUrl(`${BASE}/object/${SESSION_AUDIO_BUCKET}/${PATH}`)).toBe(PATH);
  });

  test("decodes percent-encoded segments", () => {
    const url = `${BASE}/object/sign/${SESSION_AUDIO_BUCKET}/user%20one/file%20name.mp3?token=x`;
    expect(storagePathFromAudioUrl(url)).toBe("user one/file name.mp3");
  });

  test("accepts a bare path that is not a URL", () => {
    expect(storagePathFromAudioUrl(`/${SESSION_AUDIO_BUCKET}/${PATH}`)).toBe(PATH);
  });

  test("returns null rather than guessing when the bucket is absent", () => {
    expect(storagePathFromAudioUrl(`${BASE}/object/sign/other-bucket/${PATH}`)).toBeNull();
    expect(storagePathFromAudioUrl("https://example.com/nope.mp3")).toBeNull();
  });

  test("null and empty input yield null", () => {
    expect(storagePathFromAudioUrl(null)).toBeNull();
    expect(storagePathFromAudioUrl(undefined)).toBeNull();
    expect(storagePathFromAudioUrl("")).toBeNull();
  });
});

describe("isSignedUrlExpired", () => {
  const now = 1_790_000_000_000; // fixed clock

  test("a future expiry is not expired", () => {
    const url = `${BASE}/object/sign/${SESSION_AUDIO_BUCKET}/${PATH}?token=${tokenWithExp(now / 1000 + 3600)}`;
    expect(isSignedUrlExpired(url, now)).toBe(false);
  });

  test("a past expiry is expired — the real failure we hit", () => {
    // Issued 2026-09-14, expired 2026-09-21, opened 2026-10-09.
    const url = `${BASE}/object/sign/${SESSION_AUDIO_BUCKET}/${PATH}?token=${tokenWithExp(1_790_009_312)}`;
    expect(isSignedUrlExpired(url, Date.parse("2026-10-09T19:39:01Z"))).toBe(true);
  });

  test("expiry exactly now counts as expired", () => {
    const url = `${BASE}/object/sign/${SESSION_AUDIO_BUCKET}/${PATH}?token=${tokenWithExp(now / 1000)}`;
    expect(isSignedUrlExpired(url, now)).toBe(true);
  });

  test("anything unreadable is treated as expired — re-signing is the safe default", () => {
    expect(isSignedUrlExpired(null, now)).toBe(true);
    expect(isSignedUrlExpired("not a url", now)).toBe(true);
    expect(isSignedUrlExpired(`${BASE}/object/sign/x/y.mp3`, now)).toBe(true); // no token
    expect(isSignedUrlExpired(`${BASE}/o?token=garbage`, now)).toBe(true);
    expect(isSignedUrlExpired(`${BASE}/o?token=a.${Buffer.from('{"noexp":1}').toString("base64")}.c`, now)).toBe(true);
  });
});
