import {
  GuidanceCard,
  RadarEmptyState,
  RadarLivePanel,
  RadarStatusRow,
} from "@/components/radar/radar-ui";
import { Separator } from "@/components/ui/separator";
import { BookOpenCheck, MessageSquareText, ShieldAlert } from "lucide-react";

const solutionCards = [
  {
    icon: MessageSquareText,
    title: "Listen without taking over",
    description:
      "The call surface stays minimal: a small capture indicator, one slim drawer, and no wall of generated text.",
  },
  {
    icon: BookOpenCheck,
    title: "Answer only from approved knowledge",
    description:
      "Source status, freshness, ownership, and approval are part of the workflow before guidance reaches a rep.",
  },
  {
    icon: ShieldAlert,
    title: "Escalate when proof is missing",
    description:
      "Unsupported claims become ask, needs confirmation, or escalate states instead of confident guesses.",
  },
];

const Solutions = () => {
  return (
    <section id="platform" className="py-24">
      <div className="w-full flex flex-col items-center">
        <div className="container w-full flex flex-col items-center">
          <div className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-2 shadow-md">
            <p className="text-lg">Platform</p>
          </div>

          <h2 className="mx-auto mt-6 max-w-3xl text-center text-5xl font-medium md:text-7xl">
            Real-time help for technical customer conversations
          </h2>
        </div>

        <div className="relative w-full overflow-y-clip">
          <Separator className="absolute top-12 w-full" orientation="horizontal" />
          <aside className="hidden lg:block">
            <div className="absolute top-12 flex h-full w-full items-center justify-between px-72">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex h-full flex-col items-center first:-ml-12 last:-mr-12"
                >
                  <div className="-mt-2 aspect-square h-4 w-4 rounded-full border border-input bg-white" />
                  <Separator className="top-12 h-full" orientation="vertical" />
                </div>
              ))}
            </div>
          </aside>

          <div className="mx-auto w-full max-w-7xl px-4 md:px-0">
            <div className="mt-14 grid w-full grid-cols-1 gap-8 py-8 md:mt-20 md:grid-cols-3 md:gap-20">
              {solutionCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="flex w-full flex-col items-start"
                  >
                    <Icon className="text-gold" size={32} />
                    <h3 className="mt-4 text-xl font-medium">{card.title}</h3>
                    <p className="mt-3 text-lg leading-7 text-black/60">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 grid gap-4 rounded-3xl border border-input bg-white p-4 shadow-sm md:grid-cols-[1.05fr_0.95fr] md:p-6">
              <div className="rounded-3xl bg-[#F6F6F6] p-4 md:p-6">
                <RadarLivePanel />
              </div>
              <div className="flex flex-col gap-4">
                <GuidanceCard
                  title="One cited card, not a dashboard"
                  description="Radar keeps the live view small. The drawer opens only when guidance is available or when the rep requests proof."
                />
                <RadarEmptyState
                  title="No production data connected"
                  description="This workspace is ready for configuration, but sources, sessions, and answers remain empty until APIs are wired."
                />
                <RadarStatusRow
                  icon={BookOpenCheck}
                  title="Citations enforced"
                  description="Answer and proof cards require approved references before they can be shown."
                  state="ready"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solutions;
