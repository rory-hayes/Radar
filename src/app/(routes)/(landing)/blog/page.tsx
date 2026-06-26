"use client";

import Blogs from "@/components/common/blogs";
import { Button } from "@/components/ui/button";
import Hero from "@/sections/hero";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

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
        <div className=" flex flex-col items-center justify-center h-full">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium text-center mt-6">
            Insights
          </h1>
          <p className="text-center text-xl text-black/50 mt-8 max-w-2xl">
            Unfiltered thoughts on productivity & planning
          </p>
          <div className=" w-full inline-flex items-center justify-center mt-8">
            <Button>Read Latest Blog</Button>
          </div>
        </div>
      </Hero>
      <Blogs />
    </div>
  );
};

export default AllBlogs;
