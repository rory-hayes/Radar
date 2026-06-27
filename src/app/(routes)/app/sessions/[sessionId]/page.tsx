import { SessionDetailPage } from "@/components/admin/session-detail-page";
import { getAdminContext, getAdminRecord } from "@/lib/admin-data";

export default async function SessionReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const context = await getAdminContext();
  const result = await getAdminRecord("sessions", sessionId, context, "review");

  return <SessionDetailPage result={result} />;
}
