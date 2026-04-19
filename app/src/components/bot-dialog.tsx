"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { BotDetail } from "@/components/bot-detail";
import { BotEdgeNav } from "@/components/bot-edge-nav";

export function BotDialog({ id }: { id: string }) {
  const router = useRouter();

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
        <DialogTitle className="sr-only">Pixabot {id}</DialogTitle>
        <BotDetail id={id} />
      </DialogContent>
      {/* Edge arrows render outside the dialog so they don't reflow its
          content; keyed on id so preload links update on every step. */}
      <BotEdgeNav id={id} key={id} />
    </Dialog>
  );
}
