"use client";

import { RadarEmptyState } from "@/components/radar/radar-ui";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { FileText } from "lucide-react";

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
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-24">
      <RadarEmptyState
        icon={FileText}
        title="No article configured"
        description="This route is ready for Radar editorial content, but no production article data is connected."
      />
    </section>
  );
};

export default BlogDetailPage;
