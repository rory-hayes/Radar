import { AdminDetailSurface } from "@/components/admin/admin-surfaces";
import { getAdminContext, getAdminRecord } from "@/lib/admin-data";

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ playbookId: string }>;
}) {
  const { playbookId } = await params;
  const context = await getAdminContext();
  const result = await getAdminRecord("playbooks", playbookId, context);

  return (
    <AdminDetailSurface
      context={context}
      result={result}
      title="Playbook detail"
      description="Review a playbook record, lifecycle state, source backing, and approval readiness."
      recordLabel="playbook"
      editHref={`/app/playbooks/${encodeURIComponent(playbookId)}/edit`}
      editCapability="managePlaybooks"
    />
  );
}
