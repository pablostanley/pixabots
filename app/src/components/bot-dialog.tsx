"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { BotDetail } from "@/components/bot-detail";

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
    </Dialog>
  );
}
