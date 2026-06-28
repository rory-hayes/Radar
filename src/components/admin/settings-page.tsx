import { AdminPageHeader, adminSurfaces } from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

const readinessItems = [
  {
    label: "Workspace data",
    envName: "SUPABASE_URL",
    description: "Members, sources, calls, and analytics are connected to the workspace database.",
  },
  {
    label: "Secure server access",
    envName: "SUPABASE_SECRET_KEY",
    description: "Server-only credentials are present and are not exposed to the browser or extension.",
  },
  {
    label: "Default workspace",
    envName: "RADAR_DEFAULT_WORKSPACE_ID",
    description: "Invites, uploaded sources, and extension sessions resolve to the shared workspace.",
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

      <div className="grid gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-950">Workspace readiness</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            These checks confirm the workspace is connected for members, knowledge, and calls.
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
          <h2 className="text-base font-semibold text-zinc-950">Access summary</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Radar uses workspace roles to decide who can manage sources, invite users, and review calls.
          </p>
          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
            {context.state === "ready" ? (
              <>
                Signed in as <span className="font-semibold text-zinc-950">{context.authEmail}</span> with{" "}
                <span className="font-semibold text-zinc-950">{formatRole(context.role)}</span> access.
              </>
            ) : (
              "Sign in and connect workspace data before Radar can show access details."
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-950">Email and invite delivery</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Radar invite and recovery emails use branded templates. Sender branding is controlled
            by the email provider configured for auth delivery.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              <div className="font-semibold text-zinc-950">Invite link</div>
              <p className="mt-1">New invites open Radar onboarding through /auth/accept-invite.</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              <div className="font-semibold text-zinc-950">Sender name</div>
              <p className="mt-1">Use custom SMTP to send from Radar instead of the default provider sender.</p>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
            {result.state === "ready" ? "Workspace settings are connected." : result.message}
          </div>
        </section>
      </div>
    </>
  );
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
