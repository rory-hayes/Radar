"use client";

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ConnectorType } from "@/lib/connectors/store";

const connectorTypes: Array<{
  value: ConnectorType;
  label: string;
}> = [
  { value: "google_drive", label: "Google Drive and Docs" },
  { value: "confluence_jira", label: "Confluence and Jira" },
  { value: "notion", label: "Notion" },
  { value: "support_crm", label: "Support or CRM" },
  { value: "other", label: "Other" },
];

export function ConnectorRequestForm({
  initialConnectorType = "google_drive",
}: {
  initialConnectorType?: ConnectorType;
}) {
  const router = useRouter();
  const [connectorType, setConnectorType] = useState<ConnectorType>(initialConnectorType);
  const [displayName, setDisplayName] = useState("");
  const [sourceLocation, setSourceLocation] = useState("");
  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<
    | {
        tone: "success" | "error";
        message: string;
      }
    | null
  >(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/admin/connectors/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectorType,
          displayName,
          sourceLocation,
          note,
        }),
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
          message: payload?.error?.message ?? "Radar could not save this connector request.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: "Connector request saved. It now appears in the setup queue.",
      });
      setDisplayName("");
      setSourceLocation("");
      setNote("");
      router.refresh();
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to reach the connector request service.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form id="connector-request" className="flex flex-col gap-4" onSubmit={submit}>
      {status ? (
        <Alert variant={status.tone === "error" ? "destructive" : "default"}>
          {status.tone === "error" ? <AlertCircle /> : <CheckCircle2 />}
          <AlertTitle>{status.tone === "error" ? "Request not saved" : "Request saved"}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
        Connector
        <select
          value={connectorType}
          onChange={(event) => setConnectorType(event.target.value as ConnectorType)}
          disabled={isPending}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-zinc-950 shadow-sm"
        >
          {connectorTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
        Name
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={isPending}
          placeholder="Customer docs, product wiki, support KB"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
        Source location
        <Input
          value={sourceLocation}
          onChange={(event) => setSourceLocation(event.target.value)}
          disabled={isPending}
          placeholder="Folder URL, space key, workspace URL, or system name"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
        Notes
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={isPending}
          placeholder="What should Radar sync, and who owns approval?"
          rows={4}
        />
      </label>

      <Button type="submit" disabled={isPending || displayName.trim().length < 2}>
        {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
        Request connector
      </Button>
    </form>
  );
}
