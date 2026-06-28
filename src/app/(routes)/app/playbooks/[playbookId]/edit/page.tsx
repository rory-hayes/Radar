import { redirect } from "next/navigation";

export default async function PlaybookEditPage({
  params,
}: {
  params: Promise<{ playbookId: string }>;
}) {
  const { playbookId } = await params;

  if (playbookId === "new") {
    redirect("/app/uploads");
  }

  redirect(`/app/sources/${encodeURIComponent(playbookId)}`);
}
