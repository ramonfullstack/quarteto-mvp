import { redirect } from "next/navigation";

export default async function EditSetlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/songs");
}
