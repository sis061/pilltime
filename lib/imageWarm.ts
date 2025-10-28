const BASE =
  "https://cxkefmygfdtcwidshaoa.supabase.co/storage/v1/object/public/guide";

export function guidePath(folder: string, file: string) {
  return `${BASE}/${folder}/${file}`;
}

const warmed = new Set<string>();

export function optimizerUrl(src: string, w = 1200, q = 80) {
  const u = encodeURIComponent(src);
  return `/_next/image?url=${u}&w=${w}&q=${q}`;
}

export function warmOptimizer(srcObjectUrl: string, widths: number[] = [1200]) {
  widths.forEach((w) => {
    const url = optimizerUrl(srcObjectUrl, w);
    if (warmed.has(url)) return;
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
    warmed.add(url);
  });
}
