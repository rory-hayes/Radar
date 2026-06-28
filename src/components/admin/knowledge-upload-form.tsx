"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sourceTypes = [
  { value: "document", label: "Document" },
  { value: "playbook", label: "Playbook" },
  { value: "policy", label: "Policy" },
  { value: "faq", label: "FAQ" },
  { value: "note", label: "Note" },
] as const;

type SourceTypeValue = (typeof sourceTypes)[number]["value"];

type UploadState =
  | {
      tone: "success" | "error";
      title: string;
      message: string;
      primaryAction?: {
        label: string;
        href: string;
      };
      secondaryAction?: {
        label: string;
        href: string;
      };
    }
  | null;

export function KnowledgeUploadForm({
  configured,
  canUpload,
  initialSourceType,
}: {
  configured: boolean;
  canUpload: boolean;
  initialSourceType?: string;
}) {
  const router = useRouter();
  const defaultSourceType = resolveInitialSourceType(initialSourceType);
  const [selectedSourceType, setSelectedSourceType] = useState<SourceTypeValue>(defaultSourceType);
  const [state, setState] = useState<UploadState>(null);
  const [isPending, setIsPending] = useState(false);
  const disabled = isPending || !configured || !canUpload;

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsPending(true);
    setState(null);

    try {
      const response = await fetch("/api/admin/knowledge/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            source?: {
              id?: string;
              title?: string;
              sourceType?: string;
              chunkCount?: number;
            };
            error?: { message?: string };
          }
        | null;

      if (!response.ok || !payload?.ok) {
        setState({
          tone: "error",
          title: "Upload failed",
          message: payload?.error?.message ?? "Radar could not save this source.",
        });
        return;
      }

      const source = payload.source;
      const sourceTitle = source?.title ?? "Source";
      const sourceHref = source?.id ? `/app/sources/${encodeURIComponent(source.id)}` : undefined;

      setState({
        tone: "success",
        title: "Source ready",
        message: `${sourceTitle} is approved, searchable, and ready for cited live-call guidance.`,
        primaryAction: sourceHref
          ? {
              label: "Open source",
              href: sourceHref,
            }
          : undefined,
        secondaryAction: {
          label: "View knowledge",
          href: "/app/sources",
        },
      });
      form.reset();
      setSelectedSourceType(defaultSourceType);
      router.refresh();
    } catch {
      setState({
        tone: "error",
        title: "Upload failed",
        message: "Radar could not save this source right now.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-950">Add approved source</h2>
        <p className="text-sm leading-6 text-zinc-600">
          Upload or paste a document, FAQ, policy, playbook, note, or export. Radar keeps it in
          the workspace knowledge base for cited guidance.
        </p>
      </div>

      {!configured ? (
        <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle />
          <AlertTitle>Workspace data required</AlertTitle>
          <AlertDescription>Connect the workspace database before sources can be ingested.</AlertDescription>
        </Alert>
      ) : null}

      {configured && !canUpload ? (
        <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle />
          <AlertTitle>Read-only role</AlertTitle>
          <AlertDescription>
            Your current workspace role can review sources but cannot upload them.
          </AlertDescription>
        </Alert>
      ) : null}

      {state ? (
        <Alert
          className={
            state.tone === "success"
              ? "mt-4 border-emerald-200 bg-emerald-50 text-emerald-950"
              : "mt-4 border-red-200 bg-red-50 text-red-950"
          }
        >
          {state.tone === "success" ? <CheckCircle2 /> : <AlertCircle />}
          <AlertTitle>{state.title}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
          {state.tone === "success" && (state.primaryAction || state.secondaryAction) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {state.primaryAction ? (
                <Button asChild size="sm" variant="default">
                  <Link href={state.primaryAction.href}>{state.primaryAction.label}</Link>
                </Button>
              ) : null}
              {state.secondaryAction ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={state.secondaryAction.href}>{state.secondaryAction.label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </Alert>
      ) : null}

      <form className="mt-5 grid gap-4" onSubmit={submitUpload}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700">Title</span>
            <Input name="title" required disabled={disabled} maxLength={180} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700">Source type</span>
            <select
              name="sourceType"
              disabled={disabled}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedSourceType}
              onChange={(event) =>
                setSelectedSourceType(resolveInitialSourceType(event.target.value))
              }
            >
              {sourceTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700">Owner email</span>
            <Input name="ownerEmail" type="email" disabled={disabled} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700">Source URL</span>
            <Input name="uri" type="url" disabled={disabled} />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-700">File</span>
          <Input
            name="file"
            type="file"
            disabled={disabled}
            accept=".txt,.md,.markdown,.csv,.json,.html,.xml,text/plain,text/markdown,text/csv,application/json,text/html,application/xml,text/xml"
          />
          <span className="text-xs text-zinc-500">Text-based uploads up to 1 MB are supported.</span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-700">Or paste source text</span>
          <textarea
            name="text"
            disabled={disabled}
            rows={7}
            className="min-h-36 rounded-lg border border-input bg-background px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <Button type="submit" disabled={disabled}>
          {isPending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <UploadCloud data-icon="inline-start" />
          )}
          Save source
        </Button>
      </form>
    </section>
  );
}

function resolveInitialSourceType(value: string | undefined): SourceTypeValue {
  const match = sourceTypes.find((item) => item.value === value);
  return match?.value ?? "document";
}
