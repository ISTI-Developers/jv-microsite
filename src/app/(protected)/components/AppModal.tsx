'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  hideCloseButton?: boolean;
};

const widthMap: Record<NonNullable<AppModalProps['maxWidth']>, string> = {
  sm: 'sm:max-w-lg',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
  full: 'sm:max-w-[95vw]',
};

export default function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'sm',
  closeOnOverlayClick = true,
  hideCloseButton = false,
}: AppModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      modal={false}
    >
      <DialogContent
        showCloseButton={false}
        showOverlay
        overlayClassName="bg-black/55 backdrop-blur-sm"
        onOverlayClick={() => {
          if (closeOnOverlayClick) onClose();
        }}
        className={cn('w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden rounded-xl p-0', widthMap[maxWidth])}
        onInteractOutside={(e) => {
          if (!closeOnOverlayClick) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!closeOnOverlayClick) e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">{title || 'Dialog'}</DialogTitle>
        {description ? <DialogDescription className="sr-only">{description}</DialogDescription> : null}

        {(title || description || !hideCloseButton) && (
          <div className="relative border-b px-6 py-4">
            <div className="space-y-1 pr-10">
              {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
              {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>

            {!hideCloseButton && (
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            )}
          </div>
        )}

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-4">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
