"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const dragState = React.useRef<{
    startY: number;
    lastY: number;
    startT: number;
    dragging: boolean;
  }>({ startY: 0, lastY: 0, startT: 0, dragging: false });

  const setTranslate = (y: number) => {
    if (contentRef.current) {
      contentRef.current.style.transform = y > 0 ? `translateY(${y}px)` : "";
      contentRef.current.style.transition = "none";
    }
  };

  const resetTranslate = () => {
    if (contentRef.current) {
      contentRef.current.style.transform = "";
      contentRef.current.style.transition = "transform 150ms ease-out";
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    // Don't fight internal scrolling — only start drag at top of scroll
    if (contentRef.current && contentRef.current.scrollTop > 0) return;
    dragState.current = {
      startY: e.clientY,
      lastY: e.clientY,
      startT: performance.now(),
      dragging: true,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.dragging) return;
    const dy = e.clientY - dragState.current.startY;
    if (dy <= 0) {
      setTranslate(0);
      return;
    }
    dragState.current.lastY = e.clientY;
    setTranslate(dy);
  };

  const onPointerUp = () => {
    if (!dragState.current.dragging) return;
    const { startY, lastY, startT } = dragState.current;
    const dy = lastY - startY;
    const dt = Math.max(1, performance.now() - startT);
    const velocity = dy / dt; // px/ms
    dragState.current.dragging = false;

    if (dy > 80 || velocity > 0.5) {
      closeRef.current?.click();
    } else {
      resetTranslate();
    }
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        ref={contentRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          // Layout: bottom sheet on mobile, centered modal on desktop
          "fixed z-50 border border-border bg-background shadow-lg touch-pan-y",
          "bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto p-4 pt-6",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:right-auto sm:bottom-auto sm:w-full sm:max-w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6 sm:max-h-[85vh]",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
          "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        {/* Drag-handle affordance on mobile */}
        <div aria-hidden="true" className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 bg-muted-foreground/30" />
        {children}
        {/* Hidden close button so drag-dismiss can trigger Radix's onOpenChange */}
        <DialogPrimitive.Close ref={closeRef} className="sr-only" aria-hidden="true" tabIndex={-1}>
          Close
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-bold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
