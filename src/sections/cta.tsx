import { GuidanceCard, RadarIndicator } from "@/components/radar/radar-ui";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Cta = () => {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-40 md:px-0">
      <div className="mx-auto flex w-full flex-col justify-between gap-10 overflow-hidden rounded-[2rem] bg-[#00ADE7] px-4 py-12 shadow-sm md:min-h-[34rem] md:flex-row md:px-12">
        <div className="flex w-full flex-col items-start md:w-[58%]">
          <RadarIndicator
            state="live"
            label="Ready when the evidence is"
            detail="Quiet by default. Cited when needed."
            className="border-white/30 bg-white/95"
          />
          <h2 className="mt-8 text-start text-5xl font-medium leading-tight text-white md:text-6xl">
            Give reps a single cited next step, not another dashboard
          </h2>
          <p className="mt-6 max-w-xl text-start text-lg leading-8 text-white/80">
            Start with Knowledge Studio, approve the sources, replay the hard
            calls, then enable live guidance when the system can prove its work.
          </p>

          <div className="mt-12 flex w-full flex-col gap-4 sm:max-w-md sm:flex-row">
            <Button asChild className="w-full" variant="secondary">
              <Link href="/auth/sign-in">Request access</Link>
            </Button>
            <Button asChild className="w-full" variant="transparent">
              <Link href="/#knowledge-studio">Review setup states</Link>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-[42%]">
          <GuidanceCard
            title="Production guidance disabled"
            description="This workspace still needs source approval, retrieval configuration, and live capture before reps can receive answers."
            className="bg-white/95"
          />
        </div>
      </div>
    </section>
  );
};

export default Cta;
