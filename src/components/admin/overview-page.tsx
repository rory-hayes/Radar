import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AdminContextPanel,
  AdminPageHeader,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { getAdminCollection, getAdminContext } from "@/lib/admin-data";

const overviewLinks = [
  { href: "/app/sources", label: "Sources", description: "Approved source inventory and freshness." },
  { href: "/app/uploads", label: "Uploads", description: "Ingestion jobs and document processing." },
  { href: "/app/connectors", label: "Connectors", description: "External system sync and authorization." },
  { href: "/app/playbooks", label: "Playbooks", description: "Cited guidance lifecycle and edits." },
  { href: "/app/approvals", label: "Approvals", description: "Human review for sources and playbooks." },
  { href: "/app/testing", label: "Testing & Replay", description: "Reviewed-session replay and evaluation gates." },
  { href: "/app/knowledge-gaps", label: "Knowledge Gaps", description: "Unsupported claims and escalation patterns." },
  { href: "/app/analytics", label: "Analytics", description: "System coverage, quality, and usage signals." },
  { href: "/app/sessions", label: "Sessions", description: "Conversation review with citations and feedback." },
  { href: "/app/audit-log", label: "Audit log", description: "Admin action and retention history." },
];

export async function OverviewPage() {
  const context = await getAdminContext();
  const overview = await getAdminCollection("overview", context);

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Knowledge Studio control plane for Radar sources, playbooks, approvals, replay, sessions, settings, and audit."
      >
        <Button asChild variant="outline">
          <Link href="/app/settings">Settings</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-zinc-950">
                Admin data readiness
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                This view reports real API state when configured. Until then, it stays in setup mode.
              </p>
            </div>
            {overview.state === "ready" ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                Overview data loaded from the configured admin API.
              </p>
            ) : (
              <p className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
                {overview.message}
              </p>
            )}
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            {overviewLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
              >
                <h2 className="text-base font-semibold text-zinc-950">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
                <p className="mt-4 text-sm font-medium text-zinc-950">Open</p>
              </Link>
            ))}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-950">Operating principles</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Principle title="Cited guidance" body="Answers and proof cards should depend on approved sources." />
              <Principle title="Role gates" body="Controls unlock only for roles allowed to change the tenant state." />
              <Principle title="No scoring" body="Analytics should describe system behavior, never rank employees." />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <AdminContextPanel context={context} />
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-zinc-950">Primary workflows</h2>
            <div className="mt-4 space-y-3">
              <Workflow href="/app/sources" label={adminSurfaces.sources.title} />
              <Workflow href="/app/playbooks" label={adminSurfaces.playbooks.title} />
              <Workflow href="/app/approvals" label={adminSurfaces.approvals.title} />
              <Workflow href="/app/testing" label={adminSurfaces["testing-replay"].title} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
    </div>
  );
}

function Workflow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
    >
      <span>{label}</span>
      <span>Open</span>
    </Link>
  );
}
