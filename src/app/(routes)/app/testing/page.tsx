import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

export default async function TestingReplayPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("testing-replay", context);

  return (
    <AdminCollectionSurface
      context={context}
      definition={adminSurfaces["testing-replay"]}
      result={result}
    />
  );
}
