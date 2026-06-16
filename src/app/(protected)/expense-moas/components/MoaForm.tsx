'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { User } from '../../users/users.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import JVComboSelect from '../../components/jvComboSelect';
import { getTotals, getUserLabel, LocationItem, mapEditLocations } from '../../components/moamodal.types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Moa } from '@/app/types/moa';

type LocationOption = {
  id: number;
  structure_code: string;
  cLocation: string;
};

type MoaFormRenderSlots = {
  body: ReactNode;
  footer: ReactNode;
};

type MoaFormProps = {
  mode: 'create' | 'edit';
  editData?: Moa | null;
  onCancel: () => void;
  onSuccess?: () => void;
  layout?: 'modal' | 'page';
  renderLayout?: (slots: MoaFormRenderSlots) => ReactNode;
};

export default function MoaForm({ mode, editData, onCancel, onSuccess, layout = 'modal', renderLayout }: MoaFormProps) {
  const queryClient = useQueryClient();

  const initialLocations = mapEditLocations(editData);

  const [moaName, setMoaName] = useState(editData?.moa_name ?? '');
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [activeTab, setActiveTab] = useState(initialLocations[0]?.name ?? '');
  const [locationSearch, setLocationSearch] = useState('');
  const [managementFees, setManagementFees] = useState<Record<string, { unai: string; jv: string }>>({});
  const [error, setError] = useState('');

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/jvusers`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      return data.users;
    },
  });

  const { data: locationOptions = [] } = useQuery<LocationOption[]>({
    queryKey: ['moa-locations'],
    queryFn: async () => {
      const res = await apiFetch('https://api.unmg.com.ph/jv/getLocations');
      const json: {
        success: boolean;
        data: { structure_id: number; structure_code: string; cLocation: string }[];
        error?: string;
      } = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch locations');
      }

      return json.data.map((location) => ({
        id: location.structure_id,
        structure_code: location.structure_code,
        cLocation: location.cLocation,
      }));
    },
  });

  const jvOptions = useMemo(() => {
    return (users ?? []).map((user) => ({
      value: user.id,
      label: getUserLabel(user),
    }));
  }, [users]);

  const removeLocation = (locationName: string) => {
    const removedIndex = locations.findIndex((location) => location.name === locationName);
    const updated = locations.filter((location) => location.name !== locationName);

    setLocations(updated);
    setActiveTab((current) => {
      if (current !== locationName) return current;
      return updated[removedIndex]?.name ?? updated[removedIndex - 1]?.name ?? updated[0]?.name ?? '';
    });
    setManagementFees((current) => {
      const { [locationName]: _removed, ...remaining } = current;
      void _removed;

      return remaining;
    });
  };

  const toggleLocation = (locationOption: LocationOption) => {
    const locationName = locationOption.cLocation.trim();
    if (!locationName) return;

    const existingLocation = locations.find((location) => location.name.trim().toLowerCase() === locationName.toLowerCase());

    if (existingLocation) {
      removeLocation(existingLocation.name);
      setError('');
      return;
    }

    const newLocation: LocationItem = {
      structure_id: locationOption.id,
      name: locationName,
      report_group: '',
      jv_users: [],
    };

    setLocations((prev) => [...prev, newLocation]);
    setActiveTab(locationName);
    setError('');
  };

  const updateLocationReportGroup = (locationName: string, value: string) => {
    setLocations((prev) =>
      prev.map((location) =>
        location.name === locationName
          ? {
              ...location,
              report_group: value,
            }
          : location
      )
    );
  };

  const updateLocationJVUsers = (locationName: string, ids: number[]) => {
    setLocations((prev) =>
      prev.map((location) => {
        if (location.name !== locationName) return location;

        return {
          ...location,
          jv_users: ids.map((id) => {
            const existing = location.jv_users.find((jv) => jv.id === id);
            return existing ?? { id, share_percentage: 0 };
          }),
        };
      })
    );
  };

  const removeJV = (locationName: string, userId: number) => {
    setLocations((prev) =>
      prev.map((location) =>
        location.name === locationName
          ? {
              ...location,
              jv_users: location.jv_users.filter((jv) => jv.id !== userId),
            }
          : location
      )
    );
  };

  const updateShare = (locationName: string, userId: number, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setLocations((prev) =>
      prev.map((location) => {
        if (location.name !== locationName) return location;
        const totalExceptCurrent = location.jv_users.filter((jv) => jv.id !== userId).reduce((sum, jv) => sum + (jv.share_percentage || 0), 0);
        const cappedValue = Math.min(safeValue, 99.9 - totalExceptCurrent);
        return {
          ...location,
          jv_users: location.jv_users.map((jv) =>
            jv.id === userId
              ? {
                  ...jv,
                  share_percentage: cappedValue,
                }
              : jv
          ),
        };
      })
    );
  };

  const hasDuplicateLocations = useMemo(() => {
    const normalized = locations.map((location) => location.name.trim().toLowerCase());
    return new Set(normalized).size !== normalized.length;
  }, [locations]);

  const isValid = useMemo(() => {
    if (!moaName.trim()) return false;
    if (locations.length === 0) return false;
    if (hasDuplicateLocations) return false;

    return locations.every((location) => {
      if (!location.name.trim()) return false;
      return getTotals(location).unai >= 0;
    });
  }, [moaName, locations, hasDuplicateLocations]);

  const selectedLocationNames = useMemo(() => {
    return new Set(locations.map((location) => location.name.trim().toLowerCase()));
  }, [locations]);

  const filteredLocationOptions = useMemo(() => {
    const search = locationSearch.trim().toLowerCase();

    if (!search) {
      return locationOptions;
    }

    return locationOptions.filter((location) => location.cLocation.toLowerCase().includes(search));
  }, [locationOptions, locationSearch]);

  const activeLocation = useMemo(() => {
    return locations.find((location) => location.name === activeTab) ?? locations[0] ?? null;
  }, [activeTab, locations]);

  const activeTotals = activeLocation ? getTotals(activeLocation) : null;
  const activeManagementFees = activeLocation ? (managementFees[activeLocation.name] ?? { unai: '', jv: '' }) : { unai: '', jv: '' };

  const updateManagementFee = (locationName: string, field: 'unai' | 'jv', value: string) => {
    setManagementFees((current) => ({
      ...current,
      [locationName]: {
        unai: current[locationName]?.unai ?? '',
        jv: current[locationName]?.jv ?? '',
        [field]: value,
      },
    }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = locations.map((location) => ({
        id: location.id,
        structure_id: location.structure_id,
        location_name: location.name.trim(),
        report_group: location.report_group?.trim() ?? '',
        jv_users: location.jv_users
          .filter((jv) => jv.share_percentage > 0)
          .map((jv) => ({
            id: jv.id,
            share_percentage: jv.share_percentage,
          })),
      }));

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa/save`, {
        method: 'POST',
        body: JSON.stringify({
          moa_id: editData?.id ?? null,
          moa_name: moaName.trim(),
          locations: payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save MOA');
      }
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expense-moas'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-moa-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['moa-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['jv-moas'] }),
        queryClient.invalidateQueries({ queryKey: ['jv-moa'] }),
      ]);
      onSuccess?.();
    },
  });

  const footer = (
    <>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !isValid}>
        {mode === 'edit' ? 'Save Changes' : 'Create'}
      </Button>
    </>
  );

  const pageLayout = layout === 'page' && !renderLayout;

  const body = (
    <div className="space-y-5">
      <div
        className={cn(
          'rounded-2xl border border-border bg-card p-4 shadow-sm',
          pageLayout ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)_auto] lg:items-end' : 'space-y-4'
        )}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">MOA Name</label>
          <Input value={moaName} onChange={(e) => setMoaName(e.target.value)} placeholder="MOA Name" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Locations</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-xl text-left font-normal">
                <span className={cn('truncate', locations.length === 0 && 'text-muted-foreground')}>
                  {locations.length > 0 ? `${locations.length} selected` : 'Select locations'}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-2" align="start">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.target.value)}
                  placeholder="Search locations..."
                  className="h-9 rounded-xl pl-9 text-sm"
                />
              </div>

              <div className="max-h-72 space-y-1 overflow-y-auto">
                {filteredLocationOptions.length > 0 ? (
                  filteredLocationOptions.map((location) => {
                    const locationName = location.cLocation.trim();
                    const selected = selectedLocationNames.has(locationName.toLowerCase());

                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => toggleLocation(location)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted',
                          selected && 'bg-muted text-foreground'
                        )}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                          {selected && <Check className="size-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate" title={locationName}>
                          {locationName}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">No locations found.</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {pageLayout && <div className="flex flex-wrap gap-2 lg:justify-end">{footer}</div>}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className={cn(pageLayout ? 'grid gap-4 lg:grid-cols-[22rem_1fr] lg:items-start' : 'space-y-4')}>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Selected Locations</p>
              <p className="text-xs text-muted-foreground">
                {locations.length} {locations.length === 1 ? 'selected' : 'selected'}
              </p>
            </div>
          </div>

          {locations.length > 0 ? (
            <div className={cn('space-y-2 overflow-y-auto pr-1', pageLayout ? 'max-h-[32rem]' : 'max-h-52')}>
              {locations.map((location) => {
                const active = location.name === activeLocation?.name;

                return (
                  <div
                    key={location.id ?? location.name}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 transition',
                      active ? 'border-primary/30 bg-primary/10 shadow-sm' : 'border-border bg-background hover:bg-muted/60'
                    )}
                  >
                    <button type="button" onClick={() => setActiveTab(location.name)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium" title={location.name}>
                        {location.name}
                      </span>
                    </button>

                    <Button type="button" size="icon" variant="ghost" onClick={() => removeLocation(location.name)} className="size-8 shrink-0">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">No locations selected.</div>
          )}
        </div>

        {activeLocation && activeTotals ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active Location</p>
                <h2 className="mt-1 break-words text-xl font-semibold tracking-tight" title={activeLocation.name}>
                  {activeLocation.name}
                </h2>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeLocation(activeLocation.name)} className="shrink-0">
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className={cn('grid gap-4', pageLayout && 'xl:grid-cols-2')}>
              <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium">Report Group</p>
                <Input
                  value={activeLocation.report_group ?? ''}
                  onChange={(e) => updateLocationReportGroup(activeLocation.name, e.target.value)}
                  placeholder="Enter report group"
                />
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium">Management Fee</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">UNAI Management Fee</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="UNAI fee"
                      className="text-right"
                      value={activeManagementFees.unai}
                      onChange={(event) => updateManagementFee(activeLocation.name, 'unai', event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">JV Management Fee</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="JV fee"
                      className="text-right"
                      value={activeManagementFees.jv}
                      onChange={(event) => updateManagementFee(activeLocation.name, 'jv', event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-medium">JV Share</p>

              <JVComboSelect
                options={jvOptions}
                value={activeLocation.jv_users.map((jv) => jv.id)}
                onChange={(ids) => updateLocationJVUsers(activeLocation.name, ids)}
              />

              <div className={cn('space-y-2 overflow-y-auto', pageLayout ? 'max-h-80' : 'max-h-60')}>
                {activeLocation.jv_users.map((jv) => {
                  const user = (users ?? []).find((item) => item.id === jv.id);
                  if (!user) return null;

                  return (
                    <div key={jv.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm" title={getUserLabel(user)}>
                        {getUserLabel(user)}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 text-right"
                        value={jv.share_percentage}
                        onChange={(e) => updateShare(activeLocation.name, jv.id, Number(e.target.value))}
                      />
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeJV(activeLocation.name, jv.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>Total JV: {activeTotals.totalJV.toFixed(2)}%</span>
              <span className={activeTotals.unai < 0 ? 'text-red-500' : ''}>UNAI: {activeTotals.unai.toFixed(2)}%</span>
            </div>
          </div>
        ) : (
          <div className="flex min-h-64 items-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground shadow-sm">
            Select one or more locations to configure report group and JV share.
          </div>
        )}
      </div>

      {mutation.error instanceof Error ? <p className="text-sm text-red-500">{mutation.error.message}</p> : null}
    </div>
  );

  if (renderLayout) {
    return renderLayout({ body, footer });
  }

  return (
    <div className={cn('space-y-5', layout === 'page' && 'space-y-5')}>
      {body}
      {!pageLayout && <div className="flex justify-end gap-2 border-t border-border pt-4">{footer}</div>}
    </div>
  );
}
