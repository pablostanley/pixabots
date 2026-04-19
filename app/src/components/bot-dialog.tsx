"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { BotDetail } from "@/components/bot-detail";
import { BotEdgeNav } from "@/components/bot-edge-nav";

/**
 * Client-owned id so prev/next arrows don't fire a full Next route
 * transition. `router.replace` re-renders the parallel-route segment,
 * which repaints the dialog scrim and causes an obvious flash. Instead,
 * BotEdgeNav updates our local state and shallow-updates the URL via
 * history.replaceState — the Dialog tree stays mounted and only
 * BotDetail's id prop changes.
 */
export function BotDialog({ id }: { id: string }) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState(id);

  const dismiss = () => {
    if (window.history.length > 1) router.back();
    else router.push("/browse");
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">Pixabot {currentId}</DialogTitle>
        <BotDetail id={currentId} />
        {/* Edge nav stays a DOM child of DialogContent (fixed position
            takes it to the viewport edges visually). If it sat outside,
            Radix would treat taps on the arrows as outside-pointer-down
            and dismiss the dialog. */}
        <BotEdgeNav id={currentId} onNavigate={setCurrentId} />
      </DialogContent>
    </Dialog>
  );
}
