import { SetlistDetailScreen } from "@/components/setlist-detail-screen";

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SetlistDetailScreen setlistId={id} />;
}
