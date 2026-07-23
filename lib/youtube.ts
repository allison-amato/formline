const PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function extractYoutubeId(url: string): string | null {
  for (const pattern of PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
