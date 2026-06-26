import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function ApprovalsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("approvals", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces.approvals}
      result={result}
    />
  );
}
