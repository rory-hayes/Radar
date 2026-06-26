"use client";

import { Button } from "@/components/ui/button";
import Faq from "@/sections/faq";
import Features from "@/sections/features";
import Hero from "@/sections/hero";
import Integrations from "@/sections/integrations";
import Pricing from "@/sections/pricing";
import Solutions from "@/sections/solutions";
import Testimonials from "@/sections/testimonials";
import Lenis from "@studio-freight/lenis";
import Image from "next/image";
import logoIcon from "@/assets/icons/logo-icon.svg";

import { useEffect } from "react";
import IntegrationsMobile from "@/sections/integrations-mobile";

const HomePage = () => {
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
        <div className=" flex flex-col items-center justify-center h-full">
          <div className="inline-flex bg-white shadow-md border rounded-xl aspect-square h-16 items-center justify-center">
            <Image width={28} height={28} src={logoIcon} alt="Logo icon" />
          </div>
          <h1 className="text-6xl font-medium text-center mt-6">
            Think, plan, and track <br className=" hidden md:block" />
            <span className=" text-[#848484]">all in one place</span>
          </h1>
          <p className="text-center text-xl text-black/50 mt-8 max-w-2xl">
            Efficiently manage your tasks and boost productivity.
          </p>
          <div className=" w-full inline-flex items-center justify-center mt-8">
            <Button>Get free demo</Button>
          </div>
        </div>
      </Hero>
      <Solutions />
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
