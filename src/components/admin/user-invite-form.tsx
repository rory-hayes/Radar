"use client";

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inviteRoles = [
  {
    value: "user",
    label: "User",
    description: "Uses Radar in calls and completes personal setup.",
  },
  {
    value: "knowledge_manager",
    label: "Knowledge manager",
    description: "Manages approved sources, playbooks, and gaps.",
  },
  {
    value: "approver",
    label: "Approver",
    description: "Approves source and playbook changes.",
  },
  {
    value: "analyst",
    label: "Analyst",
    description: "Reviews calls, analytics, and audit history.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manages workspace settings and users.",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Reviews workspace data without management actions.",
  },
] as const;

type InviteRole = (typeof inviteRoles)[number]["value"];

export function UserInviteForm({
  configured,
  canInvite,
}: {
  configured: boolean;
  canInvite: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("user");
  const [status, setStatus] = useState<
    | {
        tone: "success" | "error";
        message: string;
      }
    | null
  >(null);
  const [isPending, setIsPending] = useState(false);
  const disabled = isPending || !configured || !canInvite;
  const selectedRole = inviteRoles.find((item) => item.value === role) ?? inviteRoles[0];

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setStatus(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok || !payload?.ok) {
        setStatus({
          tone: "error",
          message: payload?.error?.message ?? "Unable to send invite.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: `Invite sent to ${email}.`,
      });
      setEmail("");
      router.refresh();
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to reach the invite service.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-950">Invite users</h2>
        <p className="text-sm leading-6 text-zinc-600">
          Admins invite people into the workspace. Each invited user completes their own setup while
          shared knowledge stays centrally managed.
        </p>
      </div>

      {!configured ? (
        <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle />
          <AlertTitle>Workspace data required</AlertTitle>
          <AlertDescription>
            Connect the workspace database before invites can be sent.
          </AlertDescription>
        </Alert>
      ) : null}

      {configured && !canInvite ? (
        <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle />
          <AlertTitle>Read-only role</AlertTitle>
          <AlertDescription>
            Your current workspace role can review users but cannot send invitations.
          </AlertDescription>
        </Alert>
      ) : null}

      {status ? (
        <Alert
          className={
            status.tone === "success"
              ? "mt-4 border-emerald-200 bg-emerald-50 text-emerald-950"
              : "mt-4 border-red-200 bg-red-50 text-red-950"
          }
        >
          {status.tone === "success" ? <CheckCircle2 /> : <AlertCircle />}
          <AlertTitle>{status.tone === "success" ? "Invite queued" : "Invite failed"}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      <form className="mt-5 flex flex-col gap-4" onSubmit={submitInvite}>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled}
            placeholder="teammate@company.com"
            type="email"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Workspace role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as InviteRole)}
            disabled={disabled}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviteRoles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="text-xs leading-5 text-zinc-500">{selectedRole.description}</span>
        </label>

        <Button type="submit" disabled={disabled || email.trim().length === 0}>
          {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
          Send invite
        </Button>
      </form>
    </section>
  );
}
