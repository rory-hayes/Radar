import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function KnowledgeGapsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("knowledge-gaps", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces["knowledge-gaps"]}
      result={result}
    />
  );
}
