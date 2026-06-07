"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useIsClient } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Sidebar } from "./sidebar";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { Logo } from "@/components/logo";

export const MobileSidebar = () => {
  const pathname = usePathname();
  const isClient = useIsClient();

  const onOpen = useMobileSidebar((state) => state.onOpen);
  const onClose = useMobileSidebar((state) => state.onClose);
  const isOpen = useMobileSidebar((state) => state.isOpen);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!isClient) return null;

  return (
    <>
      <Button
        onClick={onOpen}
        className="block md:hidden mr-2"
        variant="ghost"
        size="sm"
      >
        <Menu className="h-4 w-4" />
      </Button>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-2 pt-10">
          <SheetHeader>
            <SheetTitle>
              <Logo isMobile />
            </SheetTitle>
          </SheetHeader>
          <Sidebar storageKey="t-sidebar-mobile-state" />
        </SheetContent>
      </Sheet>
    </>
  );
};
