import {
  RadarEmptyState,
  RadarErrorState,
  RadarLoadingState,
  RadarStatusRow,
} from "@/components/radar/radar-ui";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Database, Radio, ShieldCheck } from "lucide-react";
import Link from "next/link";

const rolloutPaths = [
  {
    title: "Pilot workspace",
    description: "Validate source approval, live-call ergonomics, and citation policy with a small team.",
    items: ["Knowledge Studio setup", "Approved source intake", "Replay-based testing"],
  },
  {
    title: "Team rollout",
    description: "Move from tested guidance into managed live assistance for selected customer teams.",
    items: ["Role-based review", "Live drawer enablement", "Gap and freshness queues"],
    featured: true,
  },
  {
    title: "Enterprise control",
    description: "Add audit, governance, and source ownership workflows for regulated technical teams.",
    items: ["Audit exports", "Policy approvals", "Custom escalation paths"],
  },
];

const Pricing = () => {
  return (
    <section
      id="rollout"
      className="relative w-full overflow-hidden px-4 py-12 text-black lg:px-8 lg:py-24"
    >
      <div className="relative z-10 mb-12 flex w-full flex-col items-center lg:mb-20">
        <div className="inline-flex w-fit items-center justify-center rounded-full border bg-[#F5F5F5] px-6 py-2 shadow-md">
          <p className="text-lg">Rollout</p>
        </div>
        <h2 className="mx-auto mt-6 max-w-3xl text-center text-5xl font-medium md:text-7xl">
          Start with trust, then turn on live guidance
        </h2>

        <p className="mt-4 max-w-2xl text-center text-xl leading-8 text-black/60">
          Radar V1 should not pretend a workspace is ready. These paths show the
          setup states customers pass through before production guidance is
          enabled.
        </p>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-3">
        {rolloutPaths.map((path) => (
          <div
            key={path.title}
            className={`flex h-full flex-col rounded-3xl p-6 ${
              path.featured
                ? "bg-primary text-white shadow-[0_18px_60px_rgba(11,165,236,0.25)]"
                : "border border-input bg-[#F5F5F5] text-black"
            }`}
          >
            <p className="text-2xl font-medium">{path.title}</p>
            <p
              className={`mt-3 text-lg leading-7 ${
                path.featured ? "text-white/80" : "text-black/60"
              }`}
            >
              {path.description}
            </p>
            <Separator
              className={`my-6 w-full ${path.featured ? "bg-white/25" : ""}`}
              orientation="horizontal"
            />
            <div className="grid gap-3">
              {path.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check
                    className={path.featured ? "text-white" : "text-black/70"}
                    size={20}
                  />
                  <span
                    className={`text-base ${
                      path.featured ? "text-white" : "text-black/70"
                    }`}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <Button
              asChild
              className="mt-8 w-full"
              variant={path.featured ? "secondary" : "default"}
            >
              <Link href="/auth/sign-in">Request access</Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto mt-6 grid w-full max-w-6xl gap-4 md:grid-cols-3">
        <RadarEmptyState
          icon={Database}
          title="Sources not connected"
          description="No workspace knowledge has been ingested yet."
        />
        <RadarLoadingState
          title="Configuration check"
          description="Live capture and retrieval status should be verified before use."
        />
        <RadarErrorState
          title="Production disabled"
          description="Guidance stays off until source approval and endpoint configuration pass."
        />
      </div>

      <div className="relative z-10 mx-auto mt-4 grid w-full max-w-6xl gap-4 md:grid-cols-2">
        <RadarStatusRow
          icon={ShieldCheck}
          title="Approval-first implementation"
          description="Admins decide which sources can support answers."
          state="ready"
        />
        <RadarStatusRow
          icon={Radio}
          title="Live-call enablement"
          description="Capture is a separately configured production capability."
          state="warning"
        />
      </div>
    </section>
  );
};

export default Pricing;
