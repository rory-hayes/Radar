import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function ConnectorsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("connectors", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces.connectors}
      result={result}
    />
  );
}
