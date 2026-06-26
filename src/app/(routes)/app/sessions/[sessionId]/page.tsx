import { AdminDetailSurface } from "@/components/admin/admin-surfaces";
import { getAdminContext, getAdminRecord } from "@/lib/admin-data";

export default async function SessionReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const context = await getAdminContext();
  const result = await getAdminRecord("sessions", sessionId, context, "review");

  return (
    <AdminDetailSurface
      context={context}
      result={result}
      title="Session review"
      description="Review a completed session, cited guidance, feedback, gaps, and retention status."
      recordLabel="session"
    />
  );
}
