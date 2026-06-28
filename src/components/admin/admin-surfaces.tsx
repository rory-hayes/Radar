import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  can,
  type AdminCapability,
  type AdminContext,
  type AdminDataResult,
  type AdminRecord,
  type AdminResource,
} from "@/lib/admin-data";

export type AdminSurfaceDefinition = {
  resource: AdminResource;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
    capability: AdminCapability;
  };
  emptyTitle: string;
  emptyDescription: string;
  configuredDescription: string;
  roleNote: string;
};

export const adminSurfaces = {
  users: {
    resource: "users",
    title: "Users",
    description:
      "Invite teammates, assign workspace roles, and track each user's Radar onboarding state.",
    primaryAction: {
      label: "Invite user",
      href: "/app/users",
      capability: "manageUsers",
    },
    emptyTitle: "No users have been returned",
    emptyDescription:
      "Workspace members and pending invitations appear after the workspace returns real user records.",
    configuredDescription:
      "Workspace users appear here with role, invite, and onboarding state.",
    roleNote:
      "Owners and admins can invite users and change roles; other roles can review access state only when permitted.",
  },
  sources: {
    resource: "sources",
    title: "Sources",
    description:
      "Manage approved knowledge sources that Radar can cite during customer conversations.",
    primaryAction: {
      label: "Add source",
      href: "/app/uploads",
      capability: "manageSources",
    },
    emptyTitle: "No sources are connected",
    emptyDescription:
      "Connect storage, docs, or a ticketing source before Radar can retrieve cited guidance.",
    configuredDescription:
      "Connected source records appear here with their review and freshness state.",
    roleNote:
      "Knowledge managers and admins can add or retire sources after auth is configured.",
  },
  uploads: {
    resource: "uploads",
    title: "Uploads",
    description:
      "Track source ingestion jobs and document uploads without exposing browser-side secrets.",
    primaryAction: {
      label: "Upload source",
      href: "/app/uploads",
      capability: "manageSources",
    },
    emptyTitle: "No uploads have been processed",
    emptyDescription:
      "Upload text-based source material to create approved, searchable knowledge chunks.",
    configuredDescription:
      "Upload jobs appear here with status, owner, and processing state.",
    roleNote:
      "Only source managers and admins should start ingestion jobs or retry failed uploads.",
  },
  connectors: {
    resource: "connectors",
    title: "Connectors",
    description:
      "Choose where Radar should pull approved customer-facing knowledge from.",
    primaryAction: {
      label: "Add connector",
      href: "/app/connectors#connector-request",
      capability: "manageConnectors",
    },
    emptyTitle: "No connectors are configured",
    emptyDescription:
      "Connectors need tenant-scoped credentials and approval before they can sync records.",
    configuredDescription:
      "Connector records appear here with sync and authorization state.",
    roleNote:
      "Connector setup is limited to admins and knowledge managers with credential access.",
  },
  playbooks: {
    resource: "playbooks",
    title: "Playbooks",
    description:
      "Approved call guidance uploaded as knowledge sources that Radar can cite in live assistance.",
    primaryAction: {
      label: "Create playbook",
      href: "/app/uploads?type=playbook",
      capability: "managePlaybooks",
    },
    emptyTitle: "No playbooks are published",
    emptyDescription:
      "Upload a playbook document or paste playbook text to make it available for cited guidance.",
    configuredDescription:
      "Approved playbook source records appear here with owner, chunk count, and approval state.",
    roleNote:
      "Playbooks use the same approval and citation rules as other workspace knowledge.",
  },
  approvals: {
    resource: "approvals",
    title: "Approvals",
    description:
      "Review source and playbook changes before they become available for cited guidance.",
    primaryAction: {
      label: "Open review queue",
      href: "/app/approvals",
      capability: "approveGuidance",
    },
    emptyTitle: "Nothing is awaiting approval",
    emptyDescription:
      "Changes will appear after source ingestion, playbook edits, or gap resolutions are submitted.",
    configuredDescription:
      "Approval records appear here with reviewer and decision state.",
    roleNote:
      "Approvers can accept or reject changes; viewers can only inspect decision history.",
  },
  "testing-replay": {
    resource: "testing-replay",
    title: "Testing & Replay",
    description:
      "Replay reviewed sessions against current retrieval and guidance rules before rollout.",
    primaryAction: {
      label: "Start replay",
      href: "/app/testing",
      capability: "runReplay",
    },
    emptyTitle: "Replay inputs are not available",
    emptyDescription:
      "Reviewed sessions and evaluation gates must be connected before replay runs can start.",
    configuredDescription:
      "Replay runs appear here with status and evaluation outcomes.",
    roleNote:
      "Replay controls are available to reviewers, analysts, knowledge managers, and admins.",
  },
  "knowledge-gaps": {
    resource: "knowledge-gaps",
    title: "Knowledge Gaps",
    description:
      "Review unresolved questions, unsupported claims, and escalation patterns from sessions.",
    primaryAction: {
      label: "Assign gap",
      href: "/app/knowledge-gaps",
      capability: "managePlaybooks",
    },
    emptyTitle: "No gaps have been recorded",
    emptyDescription:
      "Gap records will appear after live sessions emit needs-confirmation or escalation events.",
    configuredDescription:
      "Gap records appear here with assignment and resolution state.",
    roleNote:
      "Knowledge managers can assign gaps; analysts can review trend patterns without scoring people.",
  },
  analytics: {
    resource: "analytics",
    title: "Analytics",
    description:
      "Inspect system health, coverage, usage, and citation quality without ranking individual teammates.",
    emptyTitle: "Analytics are not connected",
    emptyDescription:
      "Usage ledger, retrieval events, and evaluation results must be connected before charts render.",
    configuredDescription:
      "Verified analytics appear here only after real events are available.",
    roleNote:
      "Analytics are role-gated and should report system behavior, not individual teammate rankings.",
  },
  sessions: {
    resource: "sessions",
    title: "Calls",
    description:
      "Review customer conversation calls, transcript segments, cited cards, feedback, and escalations.",
    primaryAction: {
      label: "Review calls",
      href: "/app/sessions",
      capability: "reviewSessions",
    },
    emptyTitle: "No calls are available",
    emptyDescription:
      "Completed calls will appear after the extension and session ingestion APIs are connected.",
    configuredDescription:
      "Call records appear here with review and retention state.",
    roleNote:
      "Call review is role-gated and should preserve tenant, retention, and redaction controls.",
  },
  settings: {
    resource: "settings",
    title: "Settings",
    description:
      "Configure workspace readiness, access, retention, and Radar deployment settings.",
    primaryAction: {
      label: "Open audit log",
      href: "/app/audit-log",
      capability: "viewAuditLog",
    },
    emptyTitle: "Settings are not connected",
    emptyDescription:
      "Connect workspace data before tenant settings can be read or changed from this app.",
    configuredDescription:
      "Tenant settings appear here with permission-aware controls.",
    roleNote:
      "Only admins should change tenant settings, retention policy, or credential-backed integrations.",
  },
  "audit-log": {
    resource: "audit-log",
    title: "Audit log",
    description:
      "Inspect admin actions, source changes, approval decisions, replay runs, and retention events.",
    primaryAction: {
      label: "Export audit log",
      href: "/app/audit-log",
      capability: "viewAuditLog",
    },
    emptyTitle: "Audit events are not available",
    emptyDescription:
      "Audit events will appear after the tenant audit writer is connected to this interface.",
    configuredDescription:
      "Audit records appear here with actor, action, target, and timestamp.",
    roleNote:
      "Audit visibility is reserved for admins and analysts with compliance responsibilities.",
  },
} satisfies Record<string, AdminSurfaceDefinition>;

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
          {title}
        </h1>
        <p className="mt-2 text-base leading-7 text-zinc-600">{description}</p>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </header>
  );
}

export function AdminCollectionSurface({
  context,
  definition,
  result,
}: {
  context: AdminContext;
  definition: AdminSurfaceDefinition;
  result: AdminDataResult<AdminRecord[]>;
}) {
  return (
    <>
      <AdminPageHeader title={definition.title} description={definition.description}>
        {definition.primaryAction ? (
          <RoleAwareAction
            context={context}
            capability={definition.primaryAction.capability}
            href={definition.primaryAction.href}
          >
            {definition.primaryAction.label}
          </RoleAwareAction>
        ) : null}
      </AdminPageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-950">
              {definition.configuredDescription}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              {definition.roleNote}
            </p>
          </div>
          <AdminStatePanel
            result={result}
            emptyTitle={definition.emptyTitle}
            emptyDescription={definition.emptyDescription}
          />
          {result.state === "ready" ? (
            <AdminRecordList records={result.data} baseHref={resourceHref(definition.resource)} />
          ) : null}
        </section>

        <AdminContextPanel context={context} />
      </div>
    </>
  );
}

export function AdminDetailSurface({
  context,
  result,
  title,
  description,
  recordLabel,
  editHref,
  editCapability,
}: {
  context: AdminContext;
  result: AdminDataResult<AdminRecord>;
  title: string;
  description: string;
  recordLabel: string;
  editHref?: string;
  editCapability?: AdminCapability;
}) {
  return (
    <>
      <AdminPageHeader title={title} description={description}>
        {editHref && editCapability ? (
          <RoleAwareAction context={context} capability={editCapability} href={editHref}>
            Edit
          </RoleAwareAction>
        ) : null}
      </AdminPageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <AdminStatePanel
            result={result}
            emptyTitle={`No ${recordLabel} record was found`}
            emptyDescription={`The ${recordLabel} detail view will render after the workspace returns a real record.`}
          />
          {result.state === "ready" ? <AdminRecordDetails record={result.data} /> : null}
        </section>

        <AdminContextPanel context={context} />
      </div>
    </>
  );
}

export function AdminEditSurface({
  context,
  result,
  title,
  description,
}: {
  context: AdminContext;
  result: AdminDataResult<AdminRecord>;
  title: string;
  description: string;
}) {
  const editable = result.state === "ready" && can(context, "managePlaybooks");

  return (
    <>
      <AdminPageHeader title={title} description={description}>
        <button
          type="button"
          disabled={!editable}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
        >
          Save changes
        </button>
      </AdminPageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <AdminStatePanel
            result={result}
            emptyTitle="No playbook is loaded"
            emptyDescription="The editor stays locked until a real playbook record is loaded with an editing role."
          />
          {result.state === "ready" ? (
            <div className="space-y-4">
              <ReadOnlyField label="Title" value={toDisplayValue(result.data.title ?? result.data.name)} />
              <ReadOnlyField label="Lifecycle state" value={toDisplayValue(result.data.status ?? result.data.state)} />
              <ReadOnlyField label="Last updated" value={toDisplayValue(result.data.updatedAt ?? result.data.updated_at)} />
              {!editable ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Your current role can inspect this playbook but cannot save edits.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <AdminContextPanel context={context} />
      </div>
    </>
  );
}

export function AdminContextPanel({ context }: { context: AdminContext }) {
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-950">Access state</h2>
        {context.state === "ready" ? (
          <>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Current admin role: <span className="font-medium text-zinc-950">{formatRole(context.role)}</span>
            </p>
            <div className="mt-4 space-y-2">
              {Object.entries(context.capabilities).map(([capability, allowed]) => (
                <div
                  key={capability}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-zinc-600">{formatCapability(capability)}</span>
                  <span className={allowed ? "text-emerald-700" : "text-zinc-400"}>
                    {allowed ? "Allowed" : "Read only"}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Admin auth and data access are not configured for this environment.
            </p>
            <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
              Missing: {context.missingConfig.join(", ")}
            </div>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href="/app/settings">Review settings</Link>
            </Button>
          </>
        )}
      </section>
    </aside>
  );
}

export function RoleAwareAction({
  context,
  capability,
  href,
  children,
}: {
  context: AdminContext;
  capability: AdminCapability;
  href: string;
  children: ReactNode;
}) {
  if (can(context, capability)) {
    return (
      <Button asChild>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-200 px-4 text-base font-medium text-zinc-500"
    >
      {children}
    </button>
  );
}

function AdminStatePanel<T>({
  result,
  emptyTitle,
  emptyDescription,
}: {
  result: AdminDataResult<T>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (result.state === "ready") {
    return null;
  }

  const copy = {
    not_configured: {
      title: "Admin data is not configured",
      description: result.message,
      tone: "border-sky-200 bg-sky-50 text-sky-950",
    },
    unauthorized: {
      title: "Unauthorized",
      description: result.message,
      tone: "border-amber-200 bg-amber-50 text-amber-950",
    },
    error: {
      title: "Unable to load data",
      description: result.message,
      tone: "border-red-200 bg-red-50 text-red-950",
    },
    empty: {
      title: emptyTitle,
      description: emptyDescription,
      tone: "border-zinc-200 bg-zinc-50 text-zinc-800",
    },
  }[result.state];

  return (
    <div className={`rounded-lg border p-5 ${copy.tone}`}>
      <h3 className="text-base font-semibold">{copy.title}</h3>
      <p className="mt-2 text-sm leading-6">{copy.description}</p>
      {result.state === "not_configured" ? (
        <p className="mt-3 text-sm leading-6">
          Missing configuration: {result.missingConfig.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function AdminRecordList({
  records,
  baseHref,
}: {
  records: AdminRecord[];
  baseHref: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      {records.map((record, index) => {
        const id = toDisplayValue(record.id ?? record.slug ?? record.key);
        const title = toDisplayValue(record.title ?? record.name ?? record.label ?? id);
        const status = toDisplayValue(record.status ?? record.state);
        const updated = toDisplayValue(record.updatedAt ?? record.updated_at);
        const href = baseHref && id ? `${baseHref}/${encodeURIComponent(id)}` : null;

        return (
          <div
            key={id || index}
            className="flex flex-col gap-3 border-b border-zinc-200 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-zinc-950">{title || id || "Untitled record"}</div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                {status ? <span>Status: {status}</span> : null}
                {updated ? <span>Updated: {updated}</span> : null}
              </div>
            </div>
            {href ? (
              <Button asChild variant="outline" size="sm">
                <Link href={href}>Open</Link>
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AdminRecordDetails({ record }: { record: AdminRecord }) {
  const visibleEntries = Object.entries(record).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value)
  );

  if (visibleEntries.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        This record loaded, but it has no scalar fields suitable for this scaffolded detail view.
      </p>
    );
  }

  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {visibleEntries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <dt className="text-xs font-medium uppercase text-zinc-500">{formatKey(key)}</dt>
          <dd className="mt-1 break-words text-sm text-zinc-950">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        readOnly
        value={value}
        className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none"
      />
    </label>
  );
}

function resourceHref(resource: AdminResource): string | null {
  if (resource === "sources") {
    return "/app/sources";
  }

  if (resource === "playbooks") {
    return "/app/playbooks";
  }

  if (resource === "sessions") {
    return "/app/sessions";
  }

  return null;
}

function formatCapability(value: string): string {
  return formatKey(value);
}

function formatKey(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRole(role: string): string {
  return formatKey(role);
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}
