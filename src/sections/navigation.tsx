"use client";

import NavLink from "@/components/common/nav-link";
import { RadarLogo } from "@/components/radar/radar-ui";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

const Navigation = () => {
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScroll(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      className={`w-full bg-gradient-to-b from-transparent to-[#FAFAFA] backdrop-blur-lg sticky top-0 z-[999999] ${
        scroll ? "border-b shadow-sm" : ""
      }`}
    >
      <nav className="flex w-full items-center justify-between gap-4 px-4 py-2.5 md:grid md:grid-cols-[1fr_auto_1fr] md:px-20 md:py-2">
        <div className="min-w-0">
          <Link href="/" aria-label="Radar home">
            <RadarLogo />
          </Link>
        </div>

        <aside className="hidden md:block">
          <div className="flex min-w-0 flex-col items-center">
            <ul className="inline-flex items-center gap-6 lg:gap-8">
              <NavLink link="/#platform">Platform</NavLink>
              <NavLink link="/#knowledge-studio">Knowledge Studio</NavLink>
              <NavLink link="/#sources">Sources</NavLink>
              <NavLink link="/#proof">Proof</NavLink>
              <NavLink link="/#rollout">Rollout</NavLink>
            </ul>
          </div>
        </aside>

        <div className="flex min-w-0 items-center justify-end gap-4">
          <Link className=" hidden md:block" href="/auth/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/sign-in">
            <Button>Request access</Button>
          </Link>
        </div>
      </nav>
    </section>
  );
};

export default Navigation;
