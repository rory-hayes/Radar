"use client";

import { Changelog } from "@/components/other/changelog";
import Hero from "@/sections/hero";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

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
        <div className=" flex flex-col items-center justify-center h-full">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium text-center mt-6">
            Changelog
          </h1>
          <p className="text-center text-xl text-black/50 mt-8 max-w-2xl">
            New updates, improvements, and fixes to Prodexa
          </p>
        </div>
      </Hero>
      <Changelog />
      <div className="h-20" />
    </div>
  );
};

export default ChangelogPage;
