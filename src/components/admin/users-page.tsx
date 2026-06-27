import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  MonitorCheck,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";

import {
  AdminContextPanel,
  AdminPageHeader,
  adminSurfaces,
} from "@/components/admin/admin-surfaces";
import { UserInviteForm } from "@/components/admin/user-invite-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  can,
  getAdminCollection,
  getAdminContext,
  type AdminDataResult,
  type AdminRecord,
} from "@/lib/admin-data";

const workspaceSteps = [
  {
    title: "Admin prepares workspace",
    body: "Owners connect sources, define citation rules, configure escalation paths, and invite teammates.",
    icon: ShieldCheck,
  },
  {
    title: "Users complete personal setup",
    body: "Invited users install the browser extension, review call consent expectations, and learn card states.",
    icon: MonitorCheck,
  },
  {
    title: "Knowledge stays central",
    body: "Users can surface gaps from calls, but approved answers still come from workspace-managed evidence.",
    icon: KeyRound,
  },
];

export async function UsersPage() {
  const context = await getAdminContext();
  const result = await getAdminCollection("users", context);
  const configured = context.state === "ready";
  const canInvite = can(context, "manageUsers");
  const definition = adminSurfaces.users;

  return (
    <>
      <AdminPageHeader title={definition.title} description={definition.description} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <WorkspaceModelPanel />
          <UserInviteForm configured={configured} canInvite={canInvite} />
          <WorkspaceUsersTable result={result} />
        </div>

        <div className="flex flex-col gap-4">
          <AdminContextPanel context={context} />
          <RolePolicyPanel />
        </div>
      </div>
    </>
  );
}

function WorkspaceModelPanel() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {workspaceSteps.map((step) => {
        const Icon = step.icon;

        return (
          <Card key={step.title} className="shadow-sm">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <Icon />
              </div>
              <CardTitle className="text-base">{step.title}</CardTitle>
              <CardDescription className="leading-6">{step.body}</CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}

function WorkspaceUsersTable({ result }: { result: AdminDataResult<AdminRecord[]> }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Workspace access</CardTitle>
            <CardDescription>
              Real members and pending invites appear here from the shared workspace.
            </CardDescription>
          </div>
          <Badge variant="outline">Central workspace</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {result.state === "ready" ? (
          <UserTable records={result.data} />
        ) : (
          <UsersState result={result} />
        )}
      </CardContent>
    </Card>
  );
}

function UsersState({ result }: { result: Exclude<AdminDataResult<AdminRecord[]>, { state: "ready" }> }) {
  const destructive = result.state === "error" || result.state === "unauthorized";
  const title = {
    not_configured: "Workspace data not connected",
    unauthorized: "Unauthorized",
    error: "Unable to load users",
    empty: "No users returned",
  }[result.state];

  return (
    <Alert
      variant={destructive ? "destructive" : "default"}
      className={destructive ? undefined : "border-sky-200 bg-sky-50 text-sky-950"}
    >
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {result.message}
        {result.state === "not_configured" ? (
          <span className="mt-2 block">
            Missing configuration: {result.missingConfig.join(", ")}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function UserTable({ records }: { records: AdminRecord[] }) {
  if (records.length === 0) {
    return (
      <Alert className="border-zinc-200 bg-zinc-50 text-zinc-800">
        <Users />
        <AlertTitle>No workspace users returned</AlertTitle>
        <AlertDescription>
          The workspace responded successfully but did not include member or invite records.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Onboarding</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record, index) => {
          const id = toDisplayValue(record.id ?? record.userId ?? record.email) || String(index);
          const email = toDisplayValue(record.email ?? record.inviteeEmail ?? record.userEmail);
          const name = toDisplayValue(record.name ?? record.fullName ?? record.displayName);
          const role = toDisplayValue(record.role ?? record.workspaceRole ?? record.adminRole);
          const status = toDisplayValue(record.status ?? record.inviteStatus ?? record.state);
          const onboarding = toDisplayValue(
            record.onboardingState ?? record.onboarding_status ?? record.setupState,
          );

          return (
            <TableRow key={id}>
              <TableCell>
                <div className="flex min-w-[12rem] flex-col gap-1">
                  <span className="font-medium text-zinc-950">
                    {name || email || "Unnamed user"}
                  </span>
                  {email ? <span className="text-xs text-zinc-500">{email}</span> : null}
                </div>
              </TableCell>
              <TableCell>
                {role ? <Badge variant="secondary">{formatRole(role)}</Badge> : <MutedValue />}
              </TableCell>
              <TableCell>
                {status ? <StatusBadge value={status} /> : <MutedValue />}
              </TableCell>
              <TableCell>
                {onboarding ? (
                  <span className="text-sm text-zinc-700">{formatRole(onboarding)}</span>
                ) : (
                  <MutedValue />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const active = ["active", "accepted", "ready", "complete", "completed"].includes(normalized);
  const pending = ["pending", "invited", "sent", "setup_required"].includes(normalized);

  if (active) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">
        <CheckCircle2 />
        {formatRole(value)}
      </Badge>
    );
  }

  if (pending) {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
        {formatRole(value)}
      </Badge>
    );
  }

  return <Badge variant="outline">{formatRole(value)}</Badge>;
}

function RolePolicyPanel() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
          <UserRoundCheck />
        </div>
        <CardTitle className="text-base">Role model</CardTitle>
        <CardDescription>
          Admin onboarding configures the shared workspace. User onboarding gets each invited person
          ready for calls.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 text-sm">
          <PolicyRow label="Workspace setup" owner="Owner / Admin" />
          <PolicyRow label="Knowledge management" owner="Knowledge manager" />
          <PolicyRow label="Approval decisions" owner="Approver" />
          <PolicyRow label="Live call usage" owner="User" />
          <PolicyRow label="Analytics review" owner="Analyst / Viewer" />
        </div>
      </CardContent>
    </Card>
  );
}

function PolicyRow({ label, owner }: { label: string; owner: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
      <span className="text-zinc-600">{label}</span>
      <span className="text-right font-medium text-zinc-950">{owner}</span>
    </div>
  );
}

function MutedValue() {
  return <span className="text-sm text-zinc-400">Not provided</span>;
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function formatRole(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
