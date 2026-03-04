'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ReactNode } from 'react';

type AppModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

export default function AppModal({
  open,
  title,
  children,
  actions,
  onClose,
  maxWidth = 'sm',
}: AppModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}
