import {
  ClerkLoaded,
  ClerkLoading,
  OrganizationSwitcher,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormPopover } from "@/components/form/form-popover";
import { Logo } from "@/components/logo";
import { isOrgAdmin } from "@/lib/board-access";
import { MobileSidebar } from "./mobile-sidebar";
import { TelegramAccount } from "./telegram-account";
import { DisplayNameAccount } from "./display-name-account";
import { NotificationBell } from "@/components/notification-bell";

export const Navbar = async () => {
  const { orgId } = await auth();
  const admin = orgId ? await isOrgAdmin(orgId) : false;

  return (
    <nav className="fixed z-50 top-0 w-full px-2 sm:px-4 h-14 border-b border-border bg-card flex items-center">
      <MobileSidebar />
      <div className="flex items-center gap-x-2 sm:gap-x-4">
        <div className="hidden md:flex">
          <Logo />
        </div>

        {admin && (
          <FormPopover align="start" side="bottom" sideOffset={18}>
            <Button
              size="sm"
              className="rounded-sm md:flex md:gap-x-1 h-auto py-1.5 px-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:block">Create</span>
            </Button>
          </FormPopover>
        )}
      </div>

      <div className="ml-auto flex items-center gap-x-1 sm:gap-x-2 overflow-x-auto">
        <ClerkLoading>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </ClerkLoading>
        <ClerkLoaded>
          <DisplayNameAccount />
          <TelegramAccount />
          <NotificationBell />
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/organization/:id"
            afterLeaveOrganizationUrl="/select-org"
            afterSelectOrganizationUrl="/organization/:id"
            appearance={{
              elements: {
                // Local layout tweak specific to this compact navbar slot — colors
                // and surfaces come from the root ClerkProvider's clerkAppearance cascade.
                rootBox: { display: "flex", justifyContent: "center", alignItems: "center" },
                ...(admin
                  ? {}
                  : {
                      organizationSwitcherPopoverActionButton__createOrganization: { display: "none" },
                    }),
              },
            }}
          />
          <UserButton
            appearance={{
              elements: {
                // Local sizing tweak for the compact navbar slot — colors and
                // surfaces come from the root ClerkProvider's clerkAppearance cascade.
                avatarBox: { height: 30, width: 30 },
                loaderIcon: { display: "block" },
              },
            }}
          />
        </ClerkLoaded>
      </div>
    </nav>
  );
};
