import { redirect } from "next/navigation";

export default function NewPage({ params }: { params: { id: string } }) {
  redirect(`/`);
}
