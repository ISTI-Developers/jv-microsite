'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type AppModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hideCloseButton?: boolean;
};

export default function AppModal({ open, title, children, actions, onClose, maxWidth = 'sm', hideCloseButton = false }: AppModalProps) {
  const widthClass = {
    xs: 'sm:max-w-md',
    sm: 'sm:max-w-lg',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    xl: 'sm:max-w-6xl',
  }[maxWidth];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className={widthClass} showCloseButton={!hideCloseButton}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="space-y-4">{children}</div>
        {actions && <DialogFooter className="mt-2">{actions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
