import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

interface NavLinkProps {
  children: ReactNode;
  link: string;
}

const NavLink = ({ children, link }: NavLinkProps) => {
  return (
    <Link href={link} rel="nofollow" className="block overflow-hidden whitespace-nowrap">
      <motion.div
        whileHover={{ y: -20 }}
        transition={{ ease: "backInOut", duration: 0.5 }}
        className="h-[20px] whitespace-nowrap text-base"
      >
        <span className={cn("flex h-[20px] items-center whitespace-nowrap")}>
          {children}
        </span>
        <span className="flex h-[20px] items-center whitespace-nowrap text-primary">
          {children}
        </span>
      </motion.div>
    </Link>
  );
};
export default NavLink;
