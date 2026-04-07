// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import { Roles } from '@/constants/roles';
import UserProfileModal from '../users/UserProfileModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
          { label: 'Expenses', href: '/expense' },
          { label: 'Revenues', href: '/revenue' },
          { label: 'MOAs', href: '/expense-moas' },
          { label: 'Sites', href: '/site-management' },
        ];
      case Roles.JOINT_VENTURE:
        return [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Expenses', href: '/expense' },
          { label: 'Revenues', href: '/revenue' },
          { label: 'JV Expenses', href: '/jv/expense-moas' },
        ];
      default:
        return [{ label: 'Dashboard', href: '/dashboard' }];
    }
  }, [user]);

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <p className="text-lg font-semibold tracking-tight text-foreground">JV Microsite</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <p className="px-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <p className="px-3 pt-2 text-sm text-foreground">{user?.email || 'user@email.com'}</p>

        <div className="mt-3 space-y-1">
          {!forcedProfile && (
            <button
              type="button"
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
              onClick={() => setChangeOpenProfile(true)}
            >
              Update Profile
            </button>
          )}

          {!forced && (
            <button
              type="button"
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
              onClick={() => setChangeOpen(true)}
            >
              Change Password
            </button>
          )}

          <button
            type="button"
            onClick={blocking ? undefined : logout}
            className={cn(
              'w-full rounded-xl px-3 py-2 text-left text-sm transition',
              blocking ? 'pointer-events-none opacity-50' : 'text-destructive hover:bg-destructive/10'
            )}
          >
            Logout
          </button>
        </div>
      </div>

      <ChangePasswordModal open={passwordModalOpen} onClose={forced ? () => {} : () => setChangeOpen(false)} forced={forced} />

      <UserProfileModal open={profileModalOpen} user={user} onClose={forcedProfile ? () => {} : () => setChangeOpenProfile(false)} />
    </div>
  );

  return (
    <>
      <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)} className="fixed top-4 left-4 z-40 md:hidden">
        <Menu className="size-4" />
        <span className="sr-only">Open navigation</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close navigation" />

          <div className="absolute inset-y-0 left-0 border-r border-border bg-card shadow-xl" style={{ width: SIDEBAR_WIDTH }}>
            <div className="flex justify-end p-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-4" />
                <span className="sr-only">Close navigation</span>
              </Button>
            </div>
            {content}
          </div>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-card md:block" style={{ width: SIDEBAR_WIDTH }}>
        {content}
      </aside>
    </>
  );
}
