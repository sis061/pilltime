type WarmOpts = { qs?: string };
const warmed = new Set<string>();

export function warmImage(url: string) {
  if (warmed.has(url)) return;
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = url;
  warmed.add(url);
}

export function guideUrl(
  base: string,
  folder: string,
  file: string,
  qs = "width=900&quality=80"
) {
  const q = qs ? `?${qs}` : "";
  return `${base}/${folder}/${file}${q}`;
}
