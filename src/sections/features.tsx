import { RadarEmptyState, RadarStatusRow } from "@/components/radar/radar-ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AudioLines,
  FileCheck2,
  LockKeyhole,
  MessageSquareWarning,
  Radio,
  ShieldCheck,
} from "lucide-react";

const workflow = [
  {
    title: "Explicit preflight",
    description:
      "The rep chooses the call tab, confirms policy, and sees capture status before Radar starts.",
    icon: Radio,
  },
  {
    title: "Realtime transcript",
    description:
      "Customer and rep channels stay separate where the browser surface allows it.",
    icon: AudioLines,
  },
  {
    title: "Approved evidence",
    description:
      "Cards are generated only from tenant-approved sources, playbooks, and permission-valid excerpts.",
    icon: FileCheck2,
  },
  {
    title: "Safe fallback",
    description:
      "Unsupported questions become Needs confirmation or Escalate instead of invented answers.",
    icon: MessageSquareWarning,
  },
];

const controls = [
  "No raw audio storage by default",
  "Server-only OpenAI key",
  "Short-lived Realtime client secrets",
  "Tenant and role-scoped retrieval",
  "Audit events for critical actions",
  "No automatic CRM writeback",
];

export default function Features() {
  return (
    <section id="knowledge-studio" className="w-full px-4 py-24 md:px-6">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Knowledge Studio
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-medium leading-tight text-black md:text-5xl">
              Approve the knowledge before Radar speaks.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-black/55">
              Knowledge Studio is where sources, playbooks, tests, gaps,
              freshness, and audit history are reviewed before a live call can
              receive guidance.
            </p>

            <Alert className="mt-8 border-amber-200 bg-amber-50">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Production data rule</AlertTitle>
              <AlertDescription>
                App surfaces start empty until a tenant connects real sources,
                publishes playbooks, and passes the consent policy gate.
              </AlertDescription>
            </Alert>
          </div>

          <Card className="rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle>Guidance pipeline</CardTitle>
              <CardDescription>
                Each stage can be replayed, tested, audited, and degraded
                honestly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {workflow.map((item, index) => (
                  <div key={item.title}>
                    <RadarStatusRow
                      icon={item.icon}
                      title={`${index + 1}. ${item.title}`}
                      description={item.description}
                      state={index === 2 ? "ready" : "idle"}
                    />
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="grid gap-3 sm:grid-cols-2">
                {controls.map((control) => (
                  <RadarEmptyState
                    key={control}
                    icon={LockKeyhole}
                    title={control}
                    description="Required before production enablement."
                    compact
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
