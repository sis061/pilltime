import { createClient } from "@/lib/supabase/client";

function toFile(fileOrBlob: File | Blob) {
  if (fileOrBlob instanceof File) return fileOrBlob;
  return new File([fileOrBlob], `pill-${Date.now()}.jpg`, {
    type: fileOrBlob.type || "image/jpeg",
  });
}

export async function uploadMedicineImage(
  fileOrBlob: File | Blob,
  userId: string
) {
  const supabase = createClient();
  const file = toFile(fileOrBlob);
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const filePath = `medicines/${fileName}`;

  const { error } = await supabase.storage
    .from("medicine-images")
    .upload(filePath, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("medicine-images")
    .getPublicUrl(filePath);

  return { publicUrl: data.publicUrl, filePath };
}

export async function deleteMedicineImage(filePath: string) {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from("medicine-images")
    .remove([filePath]);

  if (error) throw new Error(error.message);
}
