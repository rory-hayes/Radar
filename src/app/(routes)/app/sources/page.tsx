import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function SourcesPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("sources", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces.sources}
      result={result}
    />
  );
}
