"use client";

import { RadarEmptyState, RadarStatusRow } from "@/components/radar/radar-ui";
import Hero from "@/sections/hero";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { History, Radio, ShieldCheck } from "lucide-react";

const ChangelogPage = () => {
  useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);
  return (
    <div>
      <Hero>
        <div className=" flex h-full max-w-3xl flex-col items-center justify-center">
          <h1 className="mt-6 text-center text-5xl font-medium md:text-7xl lg:text-8xl">
            Radar Changelog
          </h1>
          <p className="mt-8 max-w-2xl text-center text-xl leading-8 text-black/55">
            Release notes for Knowledge Studio, source approvals, live capture,
            and cited guidance.
          </p>
        </div>
      </Hero>
      <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-24 md:grid-cols-2">
        <RadarEmptyState
          icon={History}
          title="No release notes published"
          description="The changelog starts empty until production releases are approved."
        />
        <div className="grid gap-4">
          <RadarStatusRow
            icon={ShieldCheck}
            title="Approval history"
            description="No source approval events yet."
          />
          <RadarStatusRow
            icon={Radio}
            title="Live capture releases"
            description="No production capture changes published."
            state="warning"
          />
        </div>
      </section>
    </div>
  );
};

export default ChangelogPage;
