"use client";

import BlogHero from "@/components/common/blog-hero";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

const BlogDetailPage = () => {
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
      <BlogHero />
    </div>
  );
};

export default BlogDetailPage;
