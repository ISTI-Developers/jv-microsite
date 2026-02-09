'use client';

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const SIDEBAR_WIDTH = 260;

export default function Sidebar() {
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);

  const content = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box p={3}>
        <Typography variant="h6" fontWeight={600}>
          JV Microsite
        </Typography>
      </Box>

      <Divider />

      {/* Nav */}
      <List sx={{ flexGrow: 1 }}>
        {['Dashboard', 'Users', 'Reports', 'Settings'].map((text) => (
          <ListItemButton key={text}>
            <ListItemText primary={text} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* Footer */}
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">
          {user?.email || 'user@email.com'}
        </Typography>

        <ListItemButton onClick={logout} sx={{ mt: 1, borderRadius: 1 }}>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile toggle */}
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          display: { md: 'none' },
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Mobile drawer */}
      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { md: 'none' } }}>
        {content}
      </Drawer>

      {/* Desktop sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          display: { xs: 'none', md: 'block' },
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        {content}
      </Box>
    </>
  );
}
