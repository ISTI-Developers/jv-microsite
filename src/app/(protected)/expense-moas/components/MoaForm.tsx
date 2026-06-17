'use client';

import { ReactNode, useId, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { User } from '../../users/users.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CheckboxMultiSelect from '../../components/CheckboxMultiSelect';
import { getTotals, getUserLabel, LocationItem, mapEditLocations } from '../../components/moamodal.types';
import { cn } from '@/lib/utils';
import { Moa } from '@/app/types/moa';

type LocationOption = {
  id: number;
  structure_code: string;
  cLocation: string;
};

type ChildGroupNameRecord = {
  cCompanyID: string;
  cCode: string;
  cAddress: string;
  cReportGroup: string;
  cGroupName: string;
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

const getUniqueTrimmedValues = (values: Array<string | null | undefined>) => {
  const uniqueValues = new Map<string, string>();

  values.forEach((value) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return;

    const normalizedValue = trimmedValue.toLowerCase();
    if (!uniqueValues.has(normalizedValue)) {
      uniqueValues.set(normalizedValue, trimmedValue);
    }
  });

  return Array.from(uniqueValues.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
};

const normalizeAddress = (value: string) => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getAddressTokens = (value: string) => {
  return normalizeAddress(value).split(' ').filter(Boolean);
};

const getAddressSimilarityScore = (selectedLocation: string, childAddress: string) => {
  const selectedTokens = new Set(getAddressTokens(selectedLocation));
  const childTokens = new Set(getAddressTokens(childAddress));

  if (selectedTokens.size === 0 || childTokens.size === 0) return 0;

  const overlapCount = Array.from(selectedTokens).filter((token) => childTokens.has(token)).length;
  return overlapCount / Math.max(selectedTokens.size, childTokens.size);
};

const findBestChildGroupMatch = (locationName: string, childGroupRecords: ChildGroupNameRecord[]) => {
  const normalizedLocation = normalizeAddress(locationName);
  if (!normalizedLocation) return null;

  let bestMatch: ChildGroupNameRecord | null = null;
  let bestScore = 0;

  for (const record of childGroupRecords) {
    const normalizedAddress = normalizeAddress(record.cAddress ?? '');
    if (!normalizedAddress) continue;

    if (normalizedAddress === normalizedLocation) {
      return record;
    }

    const score = getAddressSimilarityScore(normalizedLocation, normalizedAddress);
    if (score > bestScore) {
      bestMatch = record;
      bestScore = score;
    }
  }

  return bestScore >= 0.6 ? bestMatch : null;
};

const getManagementFeeError = (value: LocationItem['unai_management_fee'], label: 'UNAI management fee' | 'JV management fee') => {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) return `${label} is required.`;

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return `${label} must be a valid number.`;
  if (numericValue < 0) return `${label} cannot be negative.`;

  return null;
};

const getLocationErrors = (location: LocationItem) => ({
  name: location.name.trim() ? null : 'Location name is required.',
  report_group: location.report_group?.trim() ? null : 'Report group is required.',
  group_name: location.group_name?.trim() ? null : 'Group name is required.',
  unai_management_fee: getManagementFeeError(location.unai_management_fee, 'UNAI management fee'),
  jv_management_fee: getManagementFeeError(location.jv_management_fee, 'JV management fee'),
});

const hasLocationErrors = (location: LocationItem) => {
  return Object.values(getLocationErrors(location)).some(Boolean);
};

export default function MoaForm({ mode, editData, onCancel, onSuccess, layout = 'modal', renderLayout }: MoaFormProps) {
  const queryClient = useQueryClient();
  const formId = useId();
  const reportGroupOptionsId = `${formId}-report-group-options`;
  const groupNameOptionsId = `${formId}-group-name-options`;

  const initialLocations = mapEditLocations(editData);

  const [moaName, setMoaName] = useState(editData?.moa_name ?? '');
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [activeTab, setActiveTab] = useState(initialLocations[0]?.name ?? '');
  const [error, setError] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

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

  const { data: childGroupNameRecords = [] } = useQuery<ChildGroupNameRecord[]>({
    queryKey: ['moa-child-group-names'],
    queryFn: async () => {
      const res = await apiFetch('https://api.unmg.com.ph/jv/getChildGroupName');
      const json: {
        success: boolean;
        data?: ChildGroupNameRecord[];
        error?: string;
      } = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch child group names');
      }

      return Array.isArray(json.data) ? json.data : [];
    },
    retry: false,
  });

  const uniqueReportGroups = useMemo(() => {
    return getUniqueTrimmedValues(childGroupNameRecords.map((record) => record.cReportGroup));
  }, [childGroupNameRecords]);

  const uniqueGroupNames = useMemo(() => {
    return getUniqueTrimmedValues(childGroupNameRecords.map((record) => record.cGroupName));
  }, [childGroupNameRecords]);

  const jvOptions = useMemo(() => {
    return (users ?? []).map((user) => ({
      value: user.id,
      label: getUserLabel(user),
    }));
  }, [users]);

  const locationMultiSelectOptions = useMemo(() => {
    return locationOptions
      .map((location) => {
        const locationName = location.cLocation.trim();
        if (!locationName) return null;

        return {
          value: locationName,
          label: locationName,
        };
      })
      .filter((option): option is { value: string; label: string } => option !== null);
  }, [locationOptions]);

  const selectedLocationValues = useMemo(() => {
    return locations.map((location) => location.name.trim()).filter(Boolean);
  }, [locations]);

  const removeLocation = (locationName: string) => {
    const removedIndex = locations.findIndex((location) => location.name === locationName);
    const updated = locations.filter((location) => location.name !== locationName);

    setLocations(updated);
    setActiveTab((current) => {
      if (current !== locationName) return current;
      return updated[removedIndex]?.name ?? updated[removedIndex - 1]?.name ?? updated[0]?.name ?? '';
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

    const childGroupMatch = findBestChildGroupMatch(locationName, childGroupNameRecords);

    const newLocation: LocationItem = {
      structure_id: locationOption.id,
      name: locationName,
      report_group: childGroupMatch?.cReportGroup.trim() ?? '',
      group_name: childGroupMatch?.cGroupName.trim() ?? '',
      unai_management_fee: '',
      jv_management_fee: '',
      jv_users: [],
    };

    setLocations((prev) => [...prev, newLocation]);
    setActiveTab(locationName);
    setError('');
  };

  const handleLocationSelectChange = (nextValues: string[]) => {
    const currentValues = selectedLocationValues.map((value) => value.toLowerCase());
    const addedValue = nextValues.find((value) => !currentValues.includes(value.toLowerCase()));

    if (addedValue) {
      const locationOption = locationOptions.find((location) => location.cLocation.trim().toLowerCase() === addedValue.toLowerCase());

      if (locationOption) {
        toggleLocation(locationOption);
      }

      return;
    }

    const nextValueSet = new Set(nextValues.map((value) => value.toLowerCase()));
    const removedLocation = locations.find((location) => !nextValueSet.has(location.name.trim().toLowerCase()));

    if (removedLocation) {
      removeLocation(removedLocation.name);
    }
  };

  const updateLocationField = <K extends 'report_group' | 'group_name' | 'unai_management_fee' | 'jv_management_fee'>(
    locationName: string,
    field: K,
    value: LocationItem[K]
  ) => {
    setLocations((prev) =>
      prev.map((location) =>
        location.name === locationName
          ? {
              ...location,
              [field]: value,
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
      if (hasLocationErrors(location)) return false;
      return getTotals(location).unai >= 0;
    });
  }, [moaName, locations, hasDuplicateLocations]);

  const activeLocation = useMemo(() => {
    return locations.find((location) => location.name === activeTab) ?? locations[0] ?? null;
  }, [activeTab, locations]);

  const activeTotals = activeLocation ? getTotals(activeLocation) : null;
  const activeLocationErrors = submitAttempted && activeLocation ? getLocationErrors(activeLocation) : null;
  const moaNameError = submitAttempted && !moaName.trim() ? 'MOA name is required.' : null;
  const locationSelectionError = submitAttempted && locations.length === 0 ? 'Please select at least one location.' : null;
  const selectedLocationsError =
    submitAttempted && locations.length > 0 && locations.some(hasLocationErrors)
      ? 'Please complete all required fields for each selected location.'
      : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = locations.map((location) => ({
        id: location.id,
        structure_id: location.structure_id,
        location_name: location.name.trim(),
        report_group: location.report_group?.trim() ?? '',
        group_name: location.group_name?.trim() ?? '',
        unai_management_fee: location.unai_management_fee,
        jv_management_fee: location.jv_management_fee,
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
    onSuccess: async (result) => {
      toast.success(result?.message || (mode === 'edit' ? 'MOA updated successfully' : 'MOA created successfully'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expense-moas'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-moa-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['moa-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['jv-moas'] }),
        queryClient.invalidateQueries({ queryKey: ['jv-moa'] }),
      ]);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    },
  });

  const handleSave = () => {
    setSubmitAttempted(true);

    if (!isValid) {
      if (locations.length === 0) {
        setError('Please select at least one location.');
      } else if (locations.some(hasLocationErrors)) {
        setError('Please complete all required fields for each selected location.');
      } else {
        setError('');
      }

      toast.error('Please complete all required fields.');
      return;
    }

    setError('');
    mutation.mutate();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={mutation.isPending}>
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
          <label className="text-sm font-medium text-foreground">
            MOA Name <span className="text-destructive">*</span>
          </label>
          <Input value={moaName} onChange={(e) => setMoaName(e.target.value)} placeholder="MOA Name" aria-invalid={!!moaNameError} />
          {moaNameError && <p className="text-sm text-destructive">{moaNameError}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            Locations <span className="text-destructive">*</span>
          </p>
          <CheckboxMultiSelect
            options={locationMultiSelectOptions}
            value={selectedLocationValues}
            onChange={handleLocationSelectChange}
            placeholder="Select locations"
            searchPlaceholder="Search locations..."
            emptyMessage="No locations found."
          />
          {locationSelectionError && <p className="text-sm text-destructive">{locationSelectionError}</p>}
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
          {selectedLocationsError && <p className="mt-2 text-sm text-destructive">{selectedLocationsError}</p>}
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
                <p className="text-sm font-medium">
                  Report Group <span className="text-destructive">*</span>
                </p>
                <Input
                  list={reportGroupOptionsId}
                  value={activeLocation.report_group ?? ''}
                  onChange={(e) => updateLocationField(activeLocation.name, 'report_group', e.target.value)}
                  placeholder="Enter report group"
                  aria-invalid={!!activeLocationErrors?.report_group}
                />
                <datalist id={reportGroupOptionsId}>
                  {uniqueReportGroups.map((reportGroup) => (
                    <option key={reportGroup} value={reportGroup} />
                  ))}
                </datalist>
                {activeLocationErrors?.report_group && <p className="text-sm text-destructive">{activeLocationErrors.report_group}</p>}
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium">
                  Group Name <span className="text-destructive">*</span>
                </p>
                <Input
                  list={groupNameOptionsId}
                  value={activeLocation.group_name ?? ''}
                  onChange={(e) => updateLocationField(activeLocation.name, 'group_name', e.target.value)}
                  placeholder="Enter group name"
                  aria-invalid={!!activeLocationErrors?.group_name}
                />
                <datalist id={groupNameOptionsId}>
                  {uniqueGroupNames.map((groupName) => (
                    <option key={groupName} value={groupName} />
                  ))}
                </datalist>
                {activeLocationErrors?.group_name && <p className="text-sm text-destructive">{activeLocationErrors.group_name}</p>}
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium">Management Fee</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      UNAI Management Fee <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="UNAI fee"
                      className="text-right"
                      value={activeLocation.unai_management_fee ?? ''}
                      onChange={(event) => updateLocationField(activeLocation.name, 'unai_management_fee', event.target.value)}
                      aria-invalid={!!activeLocationErrors?.unai_management_fee}
                    />
                    {activeLocationErrors?.unai_management_fee && (
                      <p className="text-sm text-destructive">{activeLocationErrors.unai_management_fee}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      JV Management Fee <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="JV fee"
                      className="text-right"
                      value={activeLocation.jv_management_fee ?? ''}
                      onChange={(event) => updateLocationField(activeLocation.name, 'jv_management_fee', event.target.value)}
                      aria-invalid={!!activeLocationErrors?.jv_management_fee}
                    />
                    {activeLocationErrors?.jv_management_fee && <p className="text-sm text-destructive">{activeLocationErrors.jv_management_fee}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-medium">JV Share</p>

              <CheckboxMultiSelect
                options={jvOptions}
                value={activeLocation.jv_users.map((jv) => jv.id)}
                onChange={(ids) => updateLocationJVUsers(activeLocation.name, ids)}
                placeholder="Select JV users"
                searchPlaceholder="Search JV users..."
                emptyMessage="No JV users found."
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
