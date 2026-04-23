"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav, type NavRole } from "./sidebar-nav";

type Props = {
  role: NavRole;
  orgName: string;
  openEscalations?: number;
};

export function MobileNav({ role, orgName, openEscalations = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const th = useTranslations("Header");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={th("menu")}
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="border-b">
          <SheetTitle className="text-left">{orgName}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav
            role={role}
            orgName={orgName}
            openEscalations={openEscalations}
            onNavigate={() => setOpen(false)}
            compact
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
