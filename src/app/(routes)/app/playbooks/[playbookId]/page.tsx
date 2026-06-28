import { redirect } from "next/navigation";

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ playbookId: string }>;
}) {
  const { playbookId } = await params;
  redirect(`/app/sources/${encodeURIComponent(playbookId)}`);
}
