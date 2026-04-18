"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BotDetail } from "@/components/bot-detail";

export function BotDialog({ id }: { id: string }) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent>
        <DialogTitle className="sr-only">Pixabot {id}</DialogTitle>
        <DialogDescription className="sr-only">
          Details for pixabot {id}
        </DialogDescription>
        <BotDetail id={id} />
      </DialogContent>
    </Dialog>
  );
}
