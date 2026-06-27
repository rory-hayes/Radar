import { AdminEditSurface } from "@/components/admin/admin-surfaces";
import { getAdminContext, getAdminRecord } from "@/lib/admin-data";
import { redirect } from "next/navigation";

export default async function PlaybookEditPage({
  params,
}: {
  params: Promise<{ playbookId: string }>;
}) {
  const { playbookId } = await params;

  if (playbookId === "new") {
    redirect("/app/uploads?type=playbook");
  }

  const context = await getAdminContext();
  const result = await getAdminRecord("playbooks", playbookId, context);

  return (
    <AdminEditSurface
      context={context}
      result={result}
      title="Edit playbook"
      description="Edit role-gated playbook fields after a real playbook record has loaded."
    />
  );
}
