// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
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
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import { Roles } from '@/constants/roles';
import UserProfileModal from '../users/UserProfileModal';

export const SIDEBAR_WIDTH = 260;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeOpenProfile, setChangeOpenProfile] = useState(false);

  const forced = Boolean(user?.force_password_change);
  const forcedProfile = Boolean(user?.force_update_profile);

  const passwordModalOpen = forced || changeOpen;
  const profileModalOpen = !forced && (forcedProfile || changeOpenProfile);
  const blocking = forced || forcedProfile;

  const navItems = useMemo(() => {
    if (!user) return [];

    switch (user.role_id) {
      case Roles.SUPER_USER:
        return [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: 'Expenses', href: '/expense' },
          { label: 'Revenues', href: '/revenue' },
        ];

      case Roles.ADMIN:
        return [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
        ];
      case Roles.JOINT_VENTURE:
        return [{ label: 'Dashboard', href: '/dashboard' }];
      default:
        return [{ label: 'Dashboard', href: '/dashboard' }];
    }
  }, [user]);

  const content = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box p={3}>
        <Typography variant="h6" fontWeight={600}>
          JV Microsite
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton key={item.href} component={Link} href={item.href}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <Box p={2}>
        <Typography variant="body2" color="text.secondary">
          {user?.email || 'user@email.com'}
        </Typography>

        {!forcedProfile && (
          <ListItemButton
            sx={{ mt: 1, borderRadius: 1 }}
            onClick={() => setChangeOpenProfile(true)}
          >
            <ListItemText primary="Update Profile" />
          </ListItemButton>
        )}
        {!forced && (
          <ListItemButton sx={{ mt: 1, borderRadius: 1 }} onClick={() => setChangeOpen(true)}>
            <ListItemText primary="Change Password" />
          </ListItemButton>
        )}

        <ListItemButton
          onClick={blocking ? undefined : logout}
          sx={{
            mt: 1,
            borderRadius: 1,
            opacity: blocking ? 0.5 : 1,
            pointerEvents: blocking ? 'none' : 'auto',
          }}
        >
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={forced ? () => {} : () => setChangeOpen(false)}
        forced={forced}
      />

      <UserProfileModal
        open={profileModalOpen}
        user={user}
        onClose={forcedProfile ? () => {} : () => setChangeOpenProfile(false)}
      />
    </Box>
  );

  return (
    <>
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

      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { md: 'none' } }}>
        {content}
      </Drawer>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: SIDEBAR_WIDTH,
          height: '100vh',
          display: { xs: 'none', md: 'block' },
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          zIndex: 1200,
        }}
      >
        {content}
      </Box>
    </>
  );
}
