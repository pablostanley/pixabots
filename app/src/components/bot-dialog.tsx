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
      </DialogContent>
      <BotEdgeNav id={currentId} onNavigate={setCurrentId} />
    </Dialog>
  );
}
