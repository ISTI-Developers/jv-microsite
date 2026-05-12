'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { User } from '../users/users.type';
import AppModal from './AppModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import JVComboSelect from './jvComboSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTotals, getUserLabel, LocationItem, mapEditLocations, Props } from './moamodal.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MoaModal(props: Props) {
  if (!props.open) return null;

  return <MoaModalContent {...props} />;
}

function MoaModalContent({ open, onClose, editData }: Props) {
  const queryClient = useQueryClient();

  const initialLocations = mapEditLocations(editData);

  const [moaName, setMoaName] = useState(editData?.moa_name ?? '');
  const [locInput, setLocInput] = useState('');
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [activeTab, setActiveTab] = useState(initialLocations[0]?.name ?? '');
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
  const { data: locationOptions = [] } = useQuery<{ id: number; structure_code: string; cLocation: string }[]>({
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

  const addLocation = () => {
    const trimmed = locInput.trim();
    if (!trimmed) return;

    const selectedLocation = locationOptions.find((location) => location.cLocation.trim().toLowerCase() === trimmed.toLowerCase());

    const exists = locations.some((location) => location.name.trim().toLowerCase() === trimmed.toLowerCase());

    if (exists) {
      setError('Location already exists.');
      return;
    }

    const newLocation: LocationItem = {
      structure_id: selectedLocation?.id,
      name: trimmed,
      report_group: '',
      jv_users: [],
    };

    setLocations((prev) => [...prev, newLocation]);
    setActiveTab(trimmed);
    setLocInput('');
    setError('');
  };

  const removeLocation = (locationName: string) => {
    const updated = locations.filter((location) => location.name !== locationName);

    setLocations(updated);
    setActiveTab((current) => {
      if (current !== locationName) return current;
      return updated[0]?.name ?? '';
    });
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
      onClose();
    },
  });
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={editData ? 'Edit MOA' : 'Create MOA'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !isValid}>
            {editData ? 'Save Changes' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Input value={moaName} onChange={(e) => setMoaName(e.target.value)} placeholder="MOA Name" />

        <div className="flex gap-2">
          <div className="flex gap-2">
            <Select
              value={locInput}
              onValueChange={(value) => {
                setLocInput(value);
                if (error) setError('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>

              <SelectContent>
                {locationOptions.map((location) => (
                  <SelectItem key={location.id} value={location.cLocation}>
                    {location.cLocation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" onClick={addLocation} disabled={!locInput}>
              Add
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        {locations.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap">
              {locations.map((location) => (
                <TabsTrigger key={location.id ?? location.name} value={location.name}>
                  {location.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {locations.map((location) => {
              const { totalJV, unai } = getTotals(location);

              return (
                <TabsContent key={location.id ?? location.name} value={location.name}>
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{location.name}</span>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeLocation(location.name)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Report Group</p>
                      <Input
                        value={location.report_group ?? ''}
                        onChange={(e) => updateLocationReportGroup(location.name, e.target.value)}
                        placeholder="Enter report group"
                      />
                    </div>

                    <JVComboSelect
                      options={jvOptions}
                      value={location.jv_users.map((jv) => jv.id)}
                      onChange={(ids) => updateLocationJVUsers(location.name, ids)}
                    />

                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {location.jv_users.map((jv) => {
                        const user = (users ?? []).find((item) => item.id === jv.id);
                        if (!user) return null;

                        return (
                          <div key={jv.id} className="flex items-center gap-3">
                            <span className="flex-1 text-sm">{getUserLabel(user)}</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-24 text-right"
                              value={jv.share_percentage}
                              onChange={(e) => updateShare(location.name, jv.id, Number(e.target.value))}
                            />
                            <Button type="button" size="icon" variant="ghost" onClick={() => removeJV(location.name, jv.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Total JV: {totalJV.toFixed(2)}%</span>
                      <span className={unai < 0 ? 'text-red-500' : ''}>UNAI: {unai.toFixed(2)}%</span>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        ) : null}

        {mutation.error instanceof Error ? <p className="text-sm text-red-500">{mutation.error.message}</p> : null}
      </div>
    </AppModal>
  );
}
