import { SetlistFormScreen } from "@/components/setlist-form-screen";

export default async function EditSetlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SetlistFormScreen setlistId={id} />;
}
