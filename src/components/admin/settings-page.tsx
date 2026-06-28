import { AdminPageHeader, adminSurfaces } from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";
import { readEnv } from "@/lib/env";
import { getAppUrl } from "@/lib/workspace/url";

const readinessItems = [
  {
    label: "Workspace database",
    envName: "SUPABASE_URL",
    description: "Members, sources, calls, and analytics are connected to the workspace database.",
  },
  {
    label: "Server data access",
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
  const emailStatus = getEmailDeliveryStatus();

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
            Radar can use branded invite, recovery, and account confirmation templates. Inbox sender
            branding changes after hosted email settings and custom SMTP are connected.
          </p>
          <div className="mt-5 divide-y divide-zinc-200 rounded-lg border border-zinc-200">
            {emailStatus.map((item) => (
              <EmailStatusRow key={item.label} item={item} />
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
            {result.state === "ready" ? "Workspace settings are connected." : result.message}
          </div>
        </section>
      </div>
    </>
  );
}

function getEmailDeliveryStatus() {
  const appUrl = getAppUrl();
  const hasHostedConfigAccess = Boolean(readEnv(process.env.SUPABASE_ACCESS_TOKEN));
  const hasCustomSmtp = [
    process.env.SUPABASE_AUTH_SMTP_HOST,
    process.env.SUPABASE_AUTH_SMTP_PORT,
    process.env.SUPABASE_AUTH_SMTP_USER,
    process.env.SUPABASE_AUTH_SMTP_PASS,
    process.env.SUPABASE_AUTH_SMTP_ADMIN_EMAIL,
  ].every((value) => Boolean(readEnv(value)));

  return [
    {
      label: "Invite destination",
      detail: `${appUrl}/auth/accept-invite`,
      state: "ready" as const,
    },
    {
      label: "Hosted templates",
      detail: hasHostedConfigAccess
        ? "Ready to apply Radar invite, recovery, and confirmation templates."
        : "Needs hosted email configuration access before recipients see the Radar template.",
      state: hasHostedConfigAccess ? ("ready" as const) : ("action" as const),
    },
    {
      label: "Sender branding",
      detail: hasCustomSmtp
        ? "Custom SMTP is connected so inbox sender branding can use Radar."
        : "Needs custom SMTP to replace the default auth provider sender in inboxes.",
      state: hasCustomSmtp ? ("ready" as const) : ("action" as const),
    },
  ];
}

function EmailStatusRow({
  item,
}: {
  item: {
    label: string;
    detail: string;
    state: "ready" | "action";
  };
}) {
  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-sm font-semibold text-zinc-950">{item.label}</div>
        <div className="mt-1 text-sm leading-6 text-zinc-600">{item.detail}</div>
      </div>
      <span
        className={
          item.state === "ready"
            ? "text-sm font-medium text-emerald-700"
            : "text-sm font-medium text-amber-700"
        }
      >
        {item.state === "ready" ? "Ready" : "Action needed"}
      </span>
    </div>
  );
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
