"use client";

import logo from "@/assets/icons/logo.svg";
import NavLink from "@/components/common/nav-link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
      <nav className="w-full flex items-center justify-between px-4 md:px-20 py-2.5 md:py-2">
        <div className=" w-full">
          <Link href="/">
            <div className=" relative h-12 w-[140px]">
              <Image fill src={logo} alt="Logo" />
            </div>
          </Link>
        </div>

        <aside className=" hidden md:block">
          <div className=" w-full flex flex-col items-center">
            <ul className=" inline-flex items-center gap-8">
              <NavLink link="/#features">Features</NavLink>
              <NavLink link="/#solutions">Solutions</NavLink>
              <NavLink link="/#integrations">Integrations</NavLink>
              <NavLink link="/changelog">Changelog</NavLink>
              <NavLink link="/#pricing">Pricing</NavLink>
              <NavLink link="/blog">Blog</NavLink>
            </ul>
          </div>
        </aside>

        <div className=" w-full flex items-center justify-end gap-4">
          <Link className=" hidden md:block" href="/auth/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/sign-in">
            <Button>Get free demo</Button>
          </Link>
        </div>
      </nav>
    </section>
  );
};

export default Navigation;
