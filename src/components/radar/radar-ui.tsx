import logoIcon from "@/assets/icons/logo-icon.svg";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  FileCheck2,
  Loader2,
  Radio,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

type IconComponent = LucideIcon;
type StatusTone = "idle" | "live" | "ready" | "warning" | "error";

const toneStyles: Record<
  StatusTone,
  {
    bg: string;
    border: string;
    dot: string;
    text: string;
  }
> = {
  idle: {
    bg: "bg-white",
    border: "border-input",
    dot: "bg-black/30",
    text: "text-black/60",
  },
  live: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "bg-primary",
    text: "text-sky-700",
  },
  ready: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    text: "text-rose-700",
  },
};

export function RadarLogo({
  className,
  markClassName,
  textClassName,
  compact = false,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-white shadow-sm",
          markClassName
        )}
      >
        <Image src={logoIcon} alt="" width={24} height={27} priority />
      </span>
      {!compact && (
        <span
          className={cn(
            "text-2xl font-semibold leading-none tracking-normal text-black",
            textClassName
          )}
        >
          Radar
        </span>
      )}
    </div>
  );
}

export function RadarIndicator({
  state = "idle",
  label = "Radar idle",
  detail = "Appears only when a supported call is active.",
  className,
}: {
  state?: StatusTone;
  label?: string;
  detail?: string;
  className?: string;
}) {
  const tone = toneStyles[state];

  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-3 rounded-full border px-3.5 py-2 shadow-sm",
        tone.bg,
        tone.border,
        className
      )}
    >
      <span className="relative flex h-3 w-3">
        {state === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" />
        )}
        <span className={cn("relative inline-flex h-3 w-3 rounded-full", tone.dot)} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-medium text-black">{label}</span>
        <span className={cn("mt-1 text-xs", tone.text)}>{detail}</span>
      </span>
    </div>
  );
}

export function ConfidenceBand({
  value,
  label = "Confidence",
  detail = "Not scored until approved evidence is available.",
  className,
}: {
  value?: number;
  label?: string;
  detail?: string;
  className?: string;
}) {
  const safeValue = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div className={cn("w-full rounded-2xl border border-input bg-white p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-black">{label}</p>
        <p className="text-xs font-medium text-black/50">
          {typeof value === "number" ? `${safeValue}%` : "Pending"}
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={cn(
            "h-full rounded-full",
            typeof value === "number" ? "bg-primary" : "bg-black/20"
          )}
          style={{ width: `${typeof value === "number" ? safeValue : 18}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-5 text-black/55">{detail}</p>
    </div>
  );
}

export function SourceCitation({
  title,
  source,
  status = "Approved",
  className,
}: {
  title: string;
  source: string;
  status?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-2xl border border-input bg-white px-4 py-3 shadow-sm",
        className
      )}
    >
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-primary">
        <FileCheck2 className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-black">{title}</span>
        <span className="mt-1 block truncate text-xs text-black/50">
          {source} - {status}
        </span>
      </span>
    </div>
  );
}

export function GuidanceCard({
  title = "No live guidance yet",
  description = "Radar stays quiet until a live customer conversation needs an approved answer, proof point, or escalation.",
  citations,
  confidence,
  className,
}: {
  title?: string;
  description?: string;
  citations?: Array<{
    title: string;
    source: string;
    status?: string;
  }>;
  confidence?: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "min-w-0 w-full rounded-3xl border border-input bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Guidance
          </p>
          <h3 className="mt-3 text-2xl font-medium leading-tight text-black">{title}</h3>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
          <Sparkles className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-base leading-7 text-black/60">{description}</p>
      <div className="mt-5">
        <ConfidenceBand value={confidence} />
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {citations?.length ? (
          citations.map((citation) => (
            <SourceCitation
              key={`${citation.source}-${citation.title}`}
              title={citation.title}
              source={citation.source}
              status={citation.status}
            />
          ))
        ) : (
          <RadarEmptyState
            icon={ShieldCheck}
            title="Citations required"
            description="Approved source citations appear here before any answer is shown to a rep."
            compact
          />
        )}
      </div>
    </article>
  );
}

export function RadarEmptyState({
  icon: Icon = Circle,
  title,
  description,
  compact = false,
  className,
}: {
  icon?: IconComponent;
  title: string;
  description: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-2xl border border-dashed border-black/15 bg-[#FAFAFA] p-4",
        compact ? "p-4" : "p-6",
        className
      )}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black/55 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-black">{title}</span>
        <span className="mt-1 block break-words text-sm leading-5 text-black/55">{description}</span>
      </span>
    </div>
  );
}

export function RadarLoadingState({
  title = "Preparing workspace",
  description = "Checking configuration before any live guidance is enabled.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <RadarEmptyState
      icon={Loader2}
      title={title}
      description={description}
      className={cn("[&_svg]:animate-spin", className)}
    />
  );
}

export function RadarErrorState({
  title = "Setup required",
  description = "Connect approved sources and enable the live capture endpoint before production use.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <RadarEmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      className={cn("border-rose-200 bg-rose-50", className)}
    />
  );
}

export function RadarStatusRow({
  icon: Icon,
  title,
  description,
  state = "idle",
  className,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  state?: StatusTone;
  className?: string;
}) {
  const tone = toneStyles[state];

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-2xl border border-input bg-white p-4 shadow-sm",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone.bg,
          tone.text
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-black">{title}</span>
        <span className="mt-1 block break-words text-sm leading-5 text-black/55">{description}</span>
      </span>
      <CheckCircle2
        className={cn(
          "ml-auto mt-1 h-4 w-4 shrink-0",
          state === "ready" ? "text-emerald-500" : "text-black/20"
        )}
      />
    </div>
  );
}

export function RadarLivePanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-w-0 w-full rounded-3xl border border-input bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <RadarIndicator state="idle" label="Hidden until needed" />
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <Radio className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-6 grid gap-3">
        <RadarStatusRow
          icon={Radio}
          title="Live capture"
          description="Not active. Starts only inside an approved customer call."
        />
        <RadarStatusRow
          icon={ShieldCheck}
          title="Answer policy"
          description="Unsupported claims become ask, confirm, or escalate."
          state="ready"
        />
        <RadarStatusRow
          icon={FileCheck2}
          title="Source citations"
          description="Waiting for Knowledge Studio sources."
          state="warning"
        />
      </div>
    </div>
  );
}
