/* iOS 업로드 문제
 * 1. HEIC/HEIF → <img> 디코딩 실패/지연
 * 2. iCloud 최적화 사진 → onChange 시점의 파일이 size=0 (실제 콘텐츠 다운로드 전)
 * 3. 초고해상도·메모리 압박 → 디코드 직후 레이아웃만 보이고 이미지가 못 뜨거나, 크롭 이미지가 얇은 줄처럼 보임(스크린샷)
 *
 * 대응
 * 1. 파일 메타 검사: file.size === 0 이면 iCloud 다운로드 대기 안내(토스트) 후 재시도 유도.
 * 2. image/heic, image/heif, type === ""(일부 iOS) 이면 즉시 JPEG로 변환한 후에만 rawFile로 넘기기.
 * 3. 너무 큰 이미지는 선택 즉시 한 번 다운스케일(JPEG 변환 시 maxWidth/Height 적용) — 크롭 UI 안정화.
 */

/* ------------------------
 * --------- heic ---------
 * ------------------------*/

/** iOS/사파리 케이스 포함: HEIC/HEIF 추정 */
export function isHeicLike(file: File) {
  const name = file.name?.toLowerCase() ?? "";
  return (
    /heic|heif/i.test(file.type) ||
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    file.type === "" // 간혹 비어있음
  );
}

/** 필요할 때만 동적 import로 heic2any 사용 → JPEG Blob 반환 */
export async function convertHeicToJpeg(
  file: File,
  quality = 0.92
): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality });
  const blob: Blob = Array.isArray(out) ? out[0] : out;
  // MIME 보정
  if (blob.type !== "image/jpeg") {
    return new Blob([blob], { type: "image/jpeg" });
  }
  return blob;
}

/* ------------------------
 * --------- resize ---------
 * ------------------------*/

async function drawToCanvas(
  blob: Blob
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  // 1) createImageBitmap 우선
  try {
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0);
    return { canvas, width: bmp.width, height: bmp.height };
  } catch {
    // 2) <img> 폴백
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image();
        el.onload = () => res(el);
        el.onerror = () => rej(new Error("img decode failed"));
        el.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      return { canvas, width: img.naturalWidth, height: img.naturalHeight };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** 초대형 이미지 메모리 폭주 방지용 (선택) */
export async function downscaleIfHuge(
  blob: File | Blob,
  maxSide = 4096,
  quality = 0.9
) {
  const { canvas, width, height } = await drawToCanvas(blob);
  const big = Math.max(width, height);
  if (big <= maxSide) return blob;

  const scale = maxSide / big;
  const out = document.createElement("canvas");
  out.width = Math.round(width * scale);
  out.height = Math.round(height * scale);
  out.getContext("2d")!.drawImage(canvas, 0, 0, out.width, out.height);

  return await new Promise<Blob>((res, rej) =>
    out.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    )
  );
}

/* ------------------------
 * --------- file ---------
 * ------------------------*/

export function dataURLToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Blob을 File처럼 만들어서 스토리지 SDK에 넘기기 편하게 */
export function toFile(fileOrBlob: File | Blob) {
  if (fileOrBlob instanceof File) return fileOrBlob;
  return new File([fileOrBlob], `pill-${Date.now()}.jpg`, {
    type: fileOrBlob.type || "image/jpeg",
  });
}

/** 안전한 ObjectURL 생성/해제 유틸 */
export function toObjectURL(b: Blob) {
  return URL.createObjectURL(b);
}

export function revokeObjectURL(url?: string | null) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {}
}

/* ------------------------
 * --------- prepare ---------
 * ------------------------*/

/** 단일 진입점: 선택 파일 전처리 (HEIC→JPEG, 0바이트 방어, 다운스케일) */
export async function preparePickedFile(file: File): Promise<Blob> {
  // iCloud 최적화로 아직 원본이 안 내려온 경우(0바이트)
  if (file.size === 0) {
    throw new Error(
      "사진 원본이 기기에 다운로드되지 않았어요. 사진 앱에서 원본을 내려받은 뒤 다시 선택해주세요."
    );
  }

  let prepared: Blob = file;

  // HEIC/HEIF → JPEG
  if (isHeicLike(file)) {
    prepared = await convertHeicToJpeg(file, 0.92);
  }

  // 초대형 이미지 다운스케일(옵션) — 모바일 안정성 ↑
  prepared = await downscaleIfHuge(prepared, 4096);

  return prepared;
}

// Supabase Storage 공개 버킷 베이스 경로 (실제 프로젝트 URL로 교체)
const GUIDE_CDN_BASE =
  "https://cxkefmygfdtcwidshaoa.supabase.co/storage/v1/object/public/guide";

export const guidePath = (folder: string, file: string, q?: string) =>
  q
    ? `${GUIDE_CDN_BASE}/${folder}/${file}?${q}`
    : `${GUIDE_CDN_BASE}/${folder}/${file}`;
