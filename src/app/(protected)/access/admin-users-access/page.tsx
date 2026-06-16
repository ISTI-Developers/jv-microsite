'use client';

import { useMemo, useState } from 'react';
import { UserCog } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AccessAction, AccessMenu, fetchActionAccess, fetchAdminUsers, fetchMenuAccess, saveUserActionAccess, saveUserMenuAccess } from '../action';
import { Button } from '@/components/ui/button';
import { Roles } from '@/constants/roles';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import PageHeader from '../../components/PageHeader';

type OverrideValue = 'inherit' | 'allow' | 'deny';

export default function AdminUsersAccessPage() {
  const queryClient = useQueryClient();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [menuOverrides, setMenuOverrides] = useState<Record<number, OverrideValue> | null>(null);
  const [actionOverrides, setActionOverrides] = useState<Record<number, OverrideValue> | null>(null);

  const { data: users = [], isFetching: usersFetching } = useQuery({
    queryKey: ['access-admin-users'],
    queryFn: fetchAdminUsers,
  });

  const { data: menus = [], isFetching: menusFetching } = useQuery<AccessMenu[]>({
    queryKey: ['access-menus', 'user', selectedUserId],
    queryFn: () => fetchMenuAccess({ roleId: Roles.ADMIN, userId: selectedUserId || undefined }),
    enabled: !!selectedUserId,
  });

  const { data: actions = [], isFetching: actionsFetching } = useQuery<AccessAction[]>({
    queryKey: ['access-actions', 'user', selectedUserId],
    queryFn: () => fetchActionAccess({ roleId: Roles.ADMIN, userId: selectedUserId || undefined }),
    enabled: !!selectedUserId,
  });

  const defaultMenuOverrides = useMemo(() => {
    return menus.reduce<Record<number, OverrideValue>>((acc, item) => {
      acc[item.id] = item.user_override || 'inherit';
      return acc;
    }, {});
  }, [menus]);

  const defaultActionOverrides = useMemo(() => {
    return actions.reduce<Record<number, OverrideValue>>((acc, item) => {
      acc[item.id] = item.user_override || 'inherit';
      return acc;
    }, {});
  }, [actions]);

  const currentMenuOverrides = menuOverrides ?? defaultMenuOverrides;
  const currentActionOverrides = actionOverrides ?? defaultActionOverrides;

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const saveMenusMutation = useMutation({
    mutationFn: () => {
      if (!selectedUserId) {
        throw new Error('Please select an Admin user first');
      }

      const overrides = Object.entries(currentMenuOverrides)
        .filter(([, type]) => type !== 'inherit')
        .map(([menuId, type]) => ({
          menu_id: Number(menuId),
          type: type as 'allow' | 'deny',
        }));

      return saveUserMenuAccess(selectedUserId, overrides);
    },
    onSuccess: () => {
      toast.success('Admin user menu access updated');
      queryClient.invalidateQueries({ queryKey: ['access-menus', 'user', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
    },
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    },
  });

  const saveActionsMutation = useMutation({
    mutationFn: () => {
      if (!selectedUserId) {
        throw new Error('Please select an Admin user first');
      }

      const overrides = Object.entries(currentActionOverrides)
        .filter(([, type]) => type !== 'inherit')
        .map(([permissionId, type]) => ({
          permission_id: Number(permissionId),
          type: type as 'allow' | 'deny',
        }));

      return saveUserActionAccess(selectedUserId, overrides);
    },
    onSuccess: () => {
      toast.success('Admin user action access updated');
      queryClient.invalidateQueries({ queryKey: ['access-actions', 'user', selectedUserId] });
    },
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    },
  });

  const updateMenuOverride = (menuId: number, value: OverrideValue) => {
    setMenuOverrides((prev) => ({
      ...(prev ?? defaultMenuOverrides),
      [menuId]: value,
    }));
  };

  const updateActionOverride = (permissionId: number, value: OverrideValue) => {
    setActionOverrides((prev) => ({
      ...(prev ?? defaultActionOverrides),
      [permissionId]: value,
    }));
  };

  const handleUserChange = (value: string) => {
    setSelectedUserId(value ? Number(value) : null);
    setMenuOverrides(null);
    setActionOverrides(null);
  };

  const parentMenus = menus.filter((item) => item.parent_id === null);
  const childMenus = menus.filter((item) => item.parent_id !== null);

  const getChildren = (parentId: number) => childMenus.filter((item) => item.parent_id === parentId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users Access"
        subtitle="Control menu and action overrides for a specific Admin user."
        icon={UserCog}
        actions={
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background/70 p-4">
            <label className="text-sm font-medium">Select Admin User</label>
            <Select value={selectedUserId ? String(selectedUserId) : ''} onValueChange={handleUserChange}>
              <SelectTrigger className="mt-2 w-full rounded-xl">
                <SelectValue placeholder={usersFetching ? 'Loading users...' : 'Select user'} />
              </SelectTrigger>

              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.profile?.company_name || `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim() || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedUser && <p className="mt-3 text-xs text-muted-foreground">{selectedUser.email}</p>}
          </div>
        }
      />

      {!selectedUserId && (
        <Card className="rounded-3xl border-dashed shadow-sm">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Select an Admin user first to manage access overrides.</CardContent>
        </Card>
      )}

      {selectedUserId && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Menu Overrides</CardTitle>
                <CardDescription>Set menu override access for this Admin user.</CardDescription>
              </div>

              <Button type="button" onClick={() => saveMenusMutation.mutate()} disabled={saveMenusMutation.isPending}>
                Save Menus
              </Button>
            </CardHeader>

            <CardContent className="space-y-2">
              {menusFetching && <p className="text-sm text-muted-foreground">Loading menus...</p>}

              {!menusFetching &&
                parentMenus.map((item) => {
                  const children = getChildren(item.id);

                  return (
                    <Card key={item.id} className="rounded-2xl shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">General: {Number(item.role_allowed) === 1 ? 'Allowed' : 'Hidden'}</p>
                          </div>

                          <Select
                            value={currentMenuOverrides[item.id] || 'inherit'}
                            onValueChange={(value) => updateMenuOverride(item.id, value as OverrideValue)}
                          >
                            <SelectTrigger className="w-[130px] rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inherit">Inherit</SelectItem>
                              <SelectItem value="allow">Allow</SelectItem>
                              <SelectItem value="deny">Deny</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {children.length > 0 && (
                          <div className="mt-3 space-y-2 border-l border-border pl-5">
                            {children.map((child) => (
                              <div key={child.id} className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">{child.label}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    General: {Number(child.role_allowed) === 1 ? 'Allowed' : 'Hidden'}
                                  </p>
                                </div>

                                <Select
                                  value={currentMenuOverrides[child.id] || 'inherit'}
                                  onValueChange={(value) => updateMenuOverride(child.id, value as OverrideValue)}
                                >
                                  <SelectTrigger className="w-[130px] rounded-xl">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="inherit">Inherit</SelectItem>
                                    <SelectItem value="allow">Allow</SelectItem>
                                    <SelectItem value="deny">Deny</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Action Overrides</CardTitle>
                <CardDescription>Set button/action overrides for this Admin user.</CardDescription>
              </div>

              <Button type="button" onClick={() => saveActionsMutation.mutate()} disabled={saveActionsMutation.isPending}>
                Save Actions
              </Button>
            </CardHeader>

            <CardContent className="space-y-2">
              {actionsFetching && <p className="text-sm text-muted-foreground">Loading actions...</p>}

              {!actionsFetching &&
                actions.map((item) => (
                  <Card key={item.id} className="rounded-2xl shadow-none">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.code}</p>
                        <p className="mt-1 text-xs text-muted-foreground">General: {Number(item.role_allowed) === 1 ? 'Allowed' : 'Hidden'}</p>
                      </div>

                      <Select
                        value={currentActionOverrides[item.id] || 'inherit'}
                        onValueChange={(value) => updateActionOverride(item.id, value as OverrideValue)}
                      >
                        <SelectTrigger className="w-[130px] rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">Inherit</SelectItem>
                          <SelectItem value="allow">Allow</SelectItem>
                          <SelectItem value="deny">Deny</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
