'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import UserProfileModal from '../users/UserProfileModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export const SIDEBAR_WIDTH = 260;

type NavItem = {
  id: number;
  label: string;
  path: string | null;
  parent_id: number | null;
  display_order: number;
};

const normalizePath = (path: string) => {
  const [pathOnly] = path.split(/[?#]/);
  return pathOnly.length > 1 ? pathOnly.replace(/\/+$/, '') : pathOnly;
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openParentIds, setOpenParentIds] = useState<number[]>([]);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeOpenProfile, setChangeOpenProfile] = useState(false);

  const forced = Boolean(user?.force_password_change);
  const forcedProfile = Boolean(user?.force_update_profile);

  const passwordModalOpen = forced || changeOpen;
  const profileModalOpen = !forced && (forcedProfile || changeOpenProfile);
  const blocking = forced || forcedProfile;

  const { data: navItems = [] } = useQuery<NavItem[]>({
    queryKey: ['navigation'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/navigation`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch navigation');
      }

      return data.data;
    },
    enabled: !!user,
  });

  const parentItems = useMemo(() => navItems.filter((item) => item.parent_id === null), [navItems]);
  const childItems = useMemo(() => navItems.filter((item) => item.parent_id !== null), [navItems]);

  const getChildren = useCallback((parentId: number) => childItems.filter((item) => item.parent_id === parentId), [childItems]);

  const isActivePath = useCallback(
    (path: string | null) => {
      if (!path || path === '#') {
        return false;
      }

      const currentPath = normalizePath(pathname);
      const itemPath = normalizePath(path);

      return itemPath === '/' ? currentPath === itemPath : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    },
    [pathname]
  );

  const activeParentIds = useMemo(
    () => parentItems.filter((item) => getChildren(item.id).some((child) => isActivePath(child.path))).map((item) => item.id),
    [getChildren, isActivePath, parentItems]
  );

  const toggleParent = (parentId: number) => {
    setOpenParentIds((current) => (current.includes(parentId) ? current.filter((id) => id !== parentId) : [...current, parentId]));
  };

  const navItemClassName = (active: boolean, child = false) =>
    cn(
      'relative flex w-full items-center rounded-xl text-sm font-medium transition',
      child ? 'px-3 py-2' : 'px-3 py-2.5',
      active ? 'bg-slate-200 text-slate-950 shadow-sm hover:bg-slate-300' : 'text-foreground hover:bg-slate-100',
      child && !active && 'text-muted-foreground hover:text-foreground'
    );

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-5 py-5">
        <p className="text-lg font-semibold tracking-tight text-foreground">JV Microsite</p>
      </div>

      <nav className="sidebar-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {parentItems.map((item) => {
          const children = getChildren(item.id);
          const parentActive = isActivePath(item.path);

          if (children.length > 0) {
            const expanded = openParentIds.includes(item.id) || activeParentIds.includes(item.id);
            const childActive = children.some((child) => isActivePath(child.path));
            const active = parentActive || childActive;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleParent(item.id)}
                  className={cn(navItemClassName(active), 'justify-between gap-2 text-left')}
                >
                  <span className="truncate">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 transition-transform',
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                      expanded && 'rotate-180'
                    )}
                  />
                </button>

                {expanded && (
                  <div className="space-y-1 pl-3">
                    {children.map((child) => {
                      const active = isActivePath(child.path);

                      return (
                        <Link key={child.id} href={child.path || '#'} onClick={() => setOpen(false)} className={navItemClassName(active, true)}>
                          <span
                            className={cn(
                              'absolute left-0 h-5 w-0.5 rounded-full transition',
                              active ? 'bg-primary-foreground/80' : 'bg-transparent'
                            )}
                          />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (!item.path) {
            return null;
          }

          return (
            <Link key={item.id} href={item.path} onClick={() => setOpen(false)} className={navItemClassName(parentActive)}>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border px-3 py-4">
        <p className="px-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <p className="truncate px-3 pt-2 text-sm text-foreground">{user?.email || 'user@email.com'}</p>

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

          <div className="absolute inset-y-0 left-0 flex h-dvh flex-col border-r border-border bg-card shadow-xl" style={{ width: SIDEBAR_WIDTH }}>
            <div className="shrink-0 border-b border-border p-3">
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="size-4" />
                  <span className="sr-only">Close navigation</span>
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1">{content}</div>
          </div>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden h-dvh border-r border-border bg-card md:block" style={{ width: SIDEBAR_WIDTH }}>
        {content}
      </aside>
    </>
  );
}
