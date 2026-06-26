import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function SessionsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("sessions", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces.sessions}
      result={result}
    />
  );
}
