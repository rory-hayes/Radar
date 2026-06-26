import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function AuditLogPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("audit-log", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces["audit-log"]}
      result={result}
    />
  );
}
