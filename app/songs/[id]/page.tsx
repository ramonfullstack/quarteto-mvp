import { SongDetailScreen } from "@/components/song-detail-screen";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SongDetailScreen songId={id} />;
}
