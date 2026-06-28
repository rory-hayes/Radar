import {
  AdminCollectionSurface,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { KnowledgeUploadForm } from "@/components/admin/knowledge-upload-form";
import { can, getAdminCollection, getAdminContext } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

type UploadsPageProps = {
  searchParams: Promise<{
    type?: string;
  }>;
};

export default async function UploadsPage({ searchParams }: UploadsPageProps) {
  const params = await searchParams;
  const context = await getAdminContext();
  const result = await getAdminCollection("uploads", context);
  const configured = context.state === "ready";
  const canUpload = can(context, "manageSources");

  return (
    <div className="space-y-4">
      <KnowledgeUploadForm
        configured={configured}
        canUpload={canUpload}
        initialSourceType={params.type}
      />
      <AdminCollectionSurface
        context={context}
        definition={adminSurfaces.uploads}
        result={result}
      />
    </div>
  );
}
