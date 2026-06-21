import Link from "next/link";
import localFont from "next/font/local";

import { cn } from "@/lib/utils";

const headingFont = localFont({
  src: "../public/fonts/font.woff2",
});

export const Logo = () => {
  return (
    <Link href="/">
      <div className="hover:opacity-75 transition items-center gap-x-2 flex">
        <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">T</span>
        </div>
        <p className={cn("text-lg text-[#e5e5e5] pb-1", headingFont.className)}>
          Taskify
        </p>
      </div>
    </Link>
  );
};
