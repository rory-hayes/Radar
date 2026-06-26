import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function UploadsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("uploads", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces.uploads}
      result={result}
    />
  );
}
