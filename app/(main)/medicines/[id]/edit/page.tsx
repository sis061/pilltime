import { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const response = await fetch(`/api/medicines/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const medicine = await response.json();
  const { name, image_url } = medicine;

  return {
    title: name,
    description: `${name} 정보 수정`,
    openGraph: {
      title: name,
      description: `${name} 정보 수정`,
      images: [image_url],
    },
  };
}

export default function EditPage() {
  redirect(`/`);
}
