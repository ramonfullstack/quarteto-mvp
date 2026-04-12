import { SongFormScreen } from "@/components/song-form-screen";

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SongFormScreen songId={id} />;
}
