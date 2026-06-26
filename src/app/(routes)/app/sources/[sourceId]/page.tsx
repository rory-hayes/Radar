import { AdminDetailSurface } from "@/components/admin/admin-surfaces";
import { getAdminContext, getAdminRecord } from "@/lib/admin-data";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const context = await getAdminContext();
  const result = await getAdminRecord("sources", sourceId, context);

  return (
    <AdminDetailSurface
      context={context}
      result={result}
      title="Source detail"
      description="Inspect a source record, its approval state, freshness, and citation eligibility."
      recordLabel="source"
    />
  );
}
