import { redirect } from "next/navigation";

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/songs");
}
