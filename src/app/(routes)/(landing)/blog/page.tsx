"use client";

import { RadarEmptyState } from "@/components/radar/radar-ui";
import { Button } from "@/components/ui/button";
import Hero from "@/sections/hero";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { FileText } from "lucide-react";
import Link from "next/link";

const AllBlogs = () => {
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
            Radar Notes
          </h1>
          <p className="mt-8 max-w-2xl text-center text-xl leading-8 text-black/55">
            Product notes for approved sources, live guidance, citations, and
            Knowledge Studio.
          </p>
          <div className="mt-8 inline-flex w-full items-center justify-center">
            <Button asChild>
              <Link href="/#knowledge-studio">View Knowledge Studio</Link>
            </Button>
          </div>
        </div>
      </Hero>
      <section className="mx-auto w-full max-w-3xl px-4 py-24">
        <RadarEmptyState
          icon={FileText}
          title="No published notes yet"
          description="Editorial content is empty until Radar has approved release and knowledge operations updates to publish."
        />
      </section>
    </div>
  );
};

export default AllBlogs;
