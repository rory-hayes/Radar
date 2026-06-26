"use client";

import {
  GuidanceCard,
  RadarEmptyState,
  RadarIndicator,
  RadarLivePanel,
} from "@/components/radar/radar-ui";
import { motion } from "framer-motion";
import { Database, FileCheck2 } from "lucide-react";
import type { ReactNode } from "react";

interface HeroProps {
  children: ReactNode;
}

export default function Hero({ children }: HeroProps) {
  return (
    <section className="w-full px-4 md:px-6">
      <div className="relative flex min-h-[92vh] w-full flex-col justify-center overflow-hidden rounded-3xl border border-input bg-[#FAFAFA] bg-[radial-gradient(#CECECE_1px,transparent_1px)] px-4 py-20 [background-size:16px_16px] md:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/90 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white/95 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 42, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -5 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="absolute -left-12 top-24 hidden w-[22rem] lg:block"
        >
          <RadarLivePanel />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 54, y: 36, rotate: 2 }}
          animate={{ opacity: 1, x: 0, y: 0, rotate: 4 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="absolute -right-10 top-28 hidden w-[22rem] lg:block"
        >
          <GuidanceCard
            title="Waiting for a real call"
            description="No guidance is generated until live capture is enabled and approved sources are available."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 48, rotate: 4 }}
          animate={{ opacity: 1, y: 0, rotate: 2 }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          className="absolute -bottom-6 left-12 hidden w-[20rem] lg:block"
        >
          <RadarEmptyState
            icon={Database}
            title="Knowledge Studio empty"
            description="Admins add approved documents, policies, and playbooks before Radar can cite them."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 48, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
          className="absolute -bottom-4 right-16 hidden w-[19rem] lg:block"
        >
          <div className="rounded-3xl border border-input bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <RadarIndicator
              state="warning"
              label="Proof required"
              detail="Answers need approved citations."
            />
            <RadarEmptyState
              icon={FileCheck2}
              title="No cited answer yet"
              description="Radar asks for confirmation instead of inventing proof."
              compact
              className="mt-4"
            />
          </div>
        </motion.div>

        <div className="container relative z-10 flex min-h-[60vh] items-center justify-center">
          {children}
        </div>
      </div>
    </section>
  );
}
