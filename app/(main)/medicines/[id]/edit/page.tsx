import { redirect } from "next/navigation";

export default function EditPage({ params }: { params: { id: string } }) {
  redirect(`/`);
}
