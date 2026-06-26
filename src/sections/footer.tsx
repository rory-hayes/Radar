"use client";

import NavLink from "@/components/common/nav-link";
import {
  RadarEmptyState,
  RadarLogo,
  RadarStatusRow,
} from "@/components/radar/radar-ui";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Database, FileCheck2, Radio } from "lucide-react";
import Link from "next/link";

const primaryLinks = [
  { href: "/#platform", label: "Platform" },
  { href: "/#knowledge-studio", label: "Knowledge Studio" },
  { href: "/#sources", label: "Approved Sources" },
  { href: "/#proof", label: "Proof Model" },
  { href: "/#rollout", label: "Rollout" },
];

const secondaryLinks = [
  { href: "mailto:support@radar.local", label: "Contact" },
  { href: "/auth/sign-in", label: "Sign In" },
  { href: "/#faq", label: "FAQ" },
];

const Footer = () => {
  return (
    <section className="h-fit w-full px-4 md:px-6">
      <footer className="flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl rounded-b-none border border-input bg-[#FAFAFA] bg-[radial-gradient(#CECECE_1px,transparent_1px)] px-4 pt-12 [background-size:16px_16px] md:min-h-[78vh] md:px-14">
        <div className="flex w-full flex-col items-start justify-between gap-12 md:flex-row">
          <div className="flex w-full max-w-xl flex-col items-start">
            <Link href="/" aria-label="Radar home">
              <RadarLogo />
            </Link>
            <h3 className="mt-6 max-w-lg text-5xl font-medium leading-tight text-black">
              Approved knowledge, quiet live guidance, cited answers
            </h3>
            <p className="mt-6 text-lg leading-8 text-black/60">
              Radar V1 keeps the live experience small and the admin experience
              rigorous, so customer teams can trust what appears on a call.
            </p>
          </div>

          <div className="grid w-full gap-10 sm:grid-cols-2 md:w-auto md:grid-cols-2 md:gap-20">
            <FooterLinkGroup links={primaryLinks} />
            <FooterLinkGroup links={secondaryLinks} />
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <RadarStatusRow
            icon={Radio}
            title="Live capture"
            description="Off until configured for production calls."
            state="warning"
          />
          <RadarStatusRow
            icon={Database}
            title="Knowledge Studio"
            description="Waiting for approved sources."
          />
          <RadarEmptyState
            icon={FileCheck2}
            title="No generated guidance"
            description="This UI does not ship seeded answer history."
          />
        </div>

        <div className="pb-12">
          <Separator
            orientation="horizontal"
            className="mb-8 mt-12 w-full md:mt-16"
          />

          <div className="flex flex-col items-center justify-between text-base text-black/60 md:flex-row">
            <p>(c) 2026 Radar. All rights reserved.</p>

            <div className="mt-4 flex flex-col items-center gap-4 md:mt-0 md:flex-row">
              <p>Privacy Policy</p>
              <p>Terms Of Service</p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
};

function FooterLinkGroup({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-x-2 gap-y-4">
      {links.map((link) => (
        <div key={link.href} className="group inline-flex max-w-full items-center gap-2">
          <ArrowRight className="h-5 w-5 group-hover:text-primary" />
          <NavLink link={link.href}>{link.label}</NavLink>
        </div>
      ))}
    </div>
  );
}

export default Footer;
