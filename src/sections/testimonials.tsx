import {
  GuidanceCard,
  RadarEmptyState,
  RadarStatusRow,
  SourceCitation,
} from "@/components/radar/radar-ui";
import {
  BadgeCheck,
  CircleHelp,
  FileWarning,
  MessageSquareWarning,
  ShieldCheck,
} from "lucide-react";

const proofStates = [
  {
    icon: BadgeCheck,
    title: "Answer",
    description:
      "Shown only when an approved source supports the claim and the confidence policy passes.",
    state: "ready" as const,
  },
  {
    icon: CircleHelp,
    title: "Ask",
    description:
      "Used when Radar needs the rep to clarify a customer detail before suggesting next steps.",
    state: "idle" as const,
  },
  {
    icon: MessageSquareWarning,
    title: "Needs confirmation",
    description:
      "Used when evidence exists but the answer still requires human review before being said aloud.",
    state: "warning" as const,
  },
  {
    icon: FileWarning,
    title: "Escalate",
    description:
      "Used when the knowledge base cannot safely support a technical or policy-sensitive answer.",
    state: "error" as const,
  },
];

const Testimonials = () => {
  return (
    <section id="proof" className="flex w-full flex-col items-center px-4 py-24">
      <div className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-2 shadow-sm">
        <p className="text-lg">Proof Model</p>
      </div>

      <h2 className="mx-auto mt-6 max-w-3xl text-center text-5xl font-medium md:text-7xl">
        Guardrails are visible in the product
      </h2>
      <p className="mt-4 max-w-2xl text-center text-xl leading-8 text-black/60">
        Radar does not hide uncertainty. The same UI that gives a rep guidance
        also shows whether the claim is answerable, needs confirmation, or must
        be escalated.
      </p>

      <div className="mt-12 grid w-full max-w-7xl gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-input bg-white p-5 shadow-sm md:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            {proofStates.map((item) => (
              <RadarStatusRow
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                state={item.state}
              />
            ))}
          </div>
        </div>

        <GuidanceCard
          title="No unsupported answer"
          description="The default production-safe state is silence, ask, or escalate until approved evidence exists."
        />

        <div className="rounded-3xl border border-input bg-[#F5F5F5] p-5 md:col-span-1">
          <RadarEmptyState
            icon={ShieldCheck}
            title="Audit log empty"
            description="No live guidance has been generated in this workspace."
          />
        </div>

        <div className="grid gap-4 rounded-3xl border border-input bg-white p-5 shadow-sm md:col-span-2 md:grid-cols-2">
          <SourceCitation
            title="Citations are mandatory"
            source="Knowledge Studio policy"
            status="Configured by admin"
          />
          <RadarEmptyState
            icon={FileWarning}
            title="Gaps become work"
            description="Missing evidence is routed into review instead of being smoothed over."
            compact
          />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
