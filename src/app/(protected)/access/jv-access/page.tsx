'use client';

import { useMemo, useState } from 'react';
import { Shield } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AccessAction, AccessMenu, fetchActionAccess, fetchMenuAccess, saveRoleActionAccess, saveRoleMenuAccess } from '../action';
import { Button } from '@/components/ui/button';
import { Roles } from '@/constants/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '../../components/PageHeader';

export default function JVAccessPage() {
  const queryClient = useQueryClient();

  const [selectedMenuIds, setSelectedMenuIds] = useState<number[] | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[] | null>(null);
  const { data: menus = [], isFetching: menusFetching } = useQuery<AccessMenu[]>({
    queryKey: ['access-menus', 'role', Roles.JOINT_VENTURE],
    queryFn: () => fetchMenuAccess({ roleId: Roles.JOINT_VENTURE }),
  });

  const { data: actions = [], isFetching: actionsFetching } = useQuery<AccessAction[]>({
    queryKey: ['access-actions', 'role', Roles.JOINT_VENTURE],
    queryFn: () => fetchActionAccess({ roleId: Roles.JOINT_VENTURE }),
  });

  const defaultSelectedMenuIds = useMemo(() => menus.filter((item) => Number(item.role_allowed) === 1).map((item) => item.id), [menus]);

  const defaultSelectedPermissionIds = useMemo(() => actions.filter((item) => Number(item.role_allowed) === 1).map((item) => item.id), [actions]);

  const currentSelectedMenuIds = selectedMenuIds ?? defaultSelectedMenuIds;
  const currentSelectedPermissionIds = selectedPermissionIds ?? defaultSelectedPermissionIds;

  const saveMenusMutation = useMutation({
    mutationFn: () => saveRoleMenuAccess(Roles.JOINT_VENTURE, currentSelectedMenuIds),
    onSuccess: () => {
      toast.success('JV menu access updated');
      queryClient.invalidateQueries({ queryKey: ['access-menus', 'role', Roles.JOINT_VENTURE] });
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
    mutationFn: () => saveRoleActionAccess(Roles.JOINT_VENTURE, currentSelectedPermissionIds),
    onSuccess: () => {
      toast.success('JV action access updated');
      queryClient.invalidateQueries({ queryKey: ['access-actions', 'role', Roles.JOINT_VENTURE] });
    },
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    },
  });

  const toggleMenu = (menuId: number) => {
    setSelectedMenuIds((prev) => {
      const current = prev ?? defaultSelectedMenuIds;
      return current.includes(menuId) ? current.filter((id) => id !== menuId) : [...current, menuId];
    });
  };

  const toggleAction = (permissionId: number) => {
    setSelectedPermissionIds((prev) => {
      const current = prev ?? defaultSelectedPermissionIds;
      return current.includes(permissionId) ? current.filter((id) => id !== permissionId) : [...current, permissionId];
    });
  };

  const parentMenus = menus.filter((item) => item.parent_id === null);
  const childMenus = menus.filter((item) => item.parent_id !== null);

  const getChildren = (parentId: number) => childMenus.filter((item) => item.parent_id === parentId);

  return (
    <div className="space-y-6">
      <PageHeader title="JV Access" subtitle="Control the general menu and action access for all JV users." icon={Shield} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Menu Access</CardTitle>
              <CardDescription>Select the menus that JV users can see.</CardDescription>
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
                      <label className="flex cursor-pointer items-center gap-3">
                        <Checkbox checked={currentSelectedMenuIds.includes(item.id)} onCheckedChange={() => toggleMenu(item.id)} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </label>

                      {children.length > 0 && (
                        <div className="mt-3 space-y-2 border-l border-border pl-5">
                          {children.map((child) => (
                            <label key={child.id} className="flex cursor-pointer items-center gap-3">
                              <Checkbox checked={currentSelectedMenuIds.includes(child.id)} onCheckedChange={() => toggleMenu(child.id)} />
                              <span className="text-sm text-muted-foreground">{child.label}</span>
                            </label>
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
              <CardTitle className="text-lg">Action Access</CardTitle>
              <CardDescription>Select the buttons/actions that JV users can use.</CardDescription>
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
                  <CardContent className="flex cursor-pointer items-center justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.code}</p>
                    </div>

                    <Checkbox checked={currentSelectedPermissionIds.includes(item.id)} onCheckedChange={() => toggleAction(item.id)} />
                  </CardContent>
                </Card>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
