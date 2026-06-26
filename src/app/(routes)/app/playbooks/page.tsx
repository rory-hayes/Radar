import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function PlaybooksPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("playbooks", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces.playbooks}
      result={result}
    />
  );
}
