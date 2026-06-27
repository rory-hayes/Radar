import {
  AdminContextPanel,
  AdminPageHeader,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

const readinessItems = [
  {
    label: "Supabase URL",
    envName: "SUPABASE_URL",
    description: "Server-side Supabase project used by Knowledge Studio pages.",
  },
  {
    label: "Supabase secret key",
    envName: "SUPABASE_SECRET_KEY",
    description: "Server-only credential for tenant-scoped workspace data requests.",
  },
  {
    label: "Workspace ID",
    envName: "RADAR_DEFAULT_WORKSPACE_ID",
    description: "Default workspace used for members, invites, sessions, and audit events.",
  },
];

export async function SettingsPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("settings", context);
  const definition = adminSurfaces.settings;
  const missingConfig: string[] =
    context.state === "not_configured" ? context.missingConfig : [];

  return (
    <>
      <AdminPageHeader title={definition.title} description={definition.description} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-950">Environment readiness</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              These values are read on the server and are never required in browser code.
            </p>
            <div className="mt-5 divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              {readinessItems.map((item) => {
                const configured =
                  item.envName === "RADAR_ADMIN_ROLE"
                    ? context.state === "ready"
                    : !missingConfig.includes(item.envName);

                return (
                  <div
                    key={item.envName}
                    className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-zinc-950">{item.label}</div>
                      <div className="mt-1 text-sm leading-6 text-zinc-600">{item.description}</div>
                      <code className="mt-2 block text-xs text-zinc-500">{item.envName}</code>
                    </div>
                    <span
                      className={
                        configured
                          ? "text-sm font-medium text-emerald-700"
                          : "text-sm font-medium text-amber-700"
                      }
                    >
                      {configured ? "Configured" : "Required"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-950">Tenant settings</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Real tenant settings render here from Supabase workspace records.
            </p>
            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              {result.state === "ready"
                ? "Settings data loaded from Supabase."
                : result.message}
            </div>
          </section>
        </div>

        <AdminContextPanel context={context} />
      </div>
    </>
  );
}
