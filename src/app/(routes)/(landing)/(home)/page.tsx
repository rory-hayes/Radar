"use client";

import { Button } from "@/components/ui/button";
import Faq from "@/sections/faq";
import Features from "@/sections/features";
import Hero from "@/sections/hero";
import HowItWorks from "@/sections/how-it-works";
import Integrations from "@/sections/integrations";
import Pricing from "@/sections/pricing";
import Solutions from "@/sections/solutions";
import Testimonials from "@/sections/testimonials";
import Lenis from "@studio-freight/lenis";
import Link from "next/link";

import { useEffect } from "react";
import IntegrationsMobile from "@/sections/integrations-mobile";
import { RadarLogo } from "@/components/radar/radar-ui";
import {
  getSupabaseAuthHashParams,
  inferSupabaseAuthType,
  normalizeSupabaseAuthHash,
} from "@/lib/auth/supabase-hash";

const HomePage = () => {
  useEffect(() => {
    if (rescueSupabaseAuthHash()) {
      return;
    }

    const lenis = new Lenis();
    let frameId = 0;

    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);
  return (
    <div>
      <Hero>
        <div className="flex h-full max-w-4xl flex-col items-center justify-center">
          <RadarLogo compact markClassName="h-16 w-16 rounded-2xl" />
          <h1 className="mt-6 text-center text-5xl font-medium leading-[1.05] text-black md:text-7xl">
            Live guidance that stays <br className="hidden md:block" />
            <span className="text-[#848484]">hidden until needed</span>
          </h1>
          <p className="mt-8 max-w-2xl text-center text-lg leading-8 text-black/55 md:text-xl">
            Radar listens quietly during complex B2B technical conversations,
            then surfaces approved, cited answers only when a rep needs help.
          </p>
          <div className="mt-8 inline-flex w-full flex-col items-center justify-center gap-3 md:flex-row">
            <Button asChild>
              <Link href="/auth/sign-in">Request access</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#knowledge-studio">View Knowledge Studio</Link>
            </Button>
          </div>
        </div>
      </Hero>
      <Solutions />
      <HowItWorks />
      <Features />
      <Integrations />
      <IntegrationsMobile />
      <Testimonials />
      <Pricing />
      <Faq />
    </div>
  );
};

export default HomePage;

function rescueSupabaseAuthHash() {
  if (typeof window === "undefined" || !window.location.hash) {
    return false;
  }

  const hash = normalizeSupabaseAuthHash(window.location.hash);
  const params = getSupabaseAuthHashParams(hash);
  const accessToken = params.get("access_token");
  const type = params.get("type") ?? inferSupabaseAuthType(hash);

  if (!accessToken) {
    return false;
  }

  if (type === "invite") {
    window.location.replace(`/auth/accept-invite${hash}`);
    return true;
  }

  if (type === "recovery") {
    window.location.replace(`/auth/sign-in?from=recovery${hash}`);
    return true;
  }

  return false;
}
