"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sidebar } from "@/components/layout/sidebar";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 h-dvh w-[min(86vw,340px)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
        <DialogHeader className="sr-only">
          <DialogTitle>Navegação principal</DialogTitle>
          <DialogDescription>
            Acesse as áreas do painel financeiro Finanse.
          </DialogDescription>
        </DialogHeader>
        <Sidebar mobile onNavigate={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
