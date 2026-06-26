import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function AnalyticsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("analytics", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces.analytics}
      result={result}
    />
  );
}
