'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Roles } from '@/constants/roles';
import { User } from '../users/users.type';
import AppModal from './AppModal';
import { Moa } from '../../types/moa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LocationItem = {
  id?: number;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editData?: Moa | null;
};

export default function MoaModal({ open, onClose, editData }: Props) {
  const queryClient = useQueryClient();

  const [locInput, setLocInput] = useState('');
  const [moaName, setMoaName] = useState(editData?.moa_name ?? '');

  const [jvUserIds, setJvUserIds] = useState<string[]>(editData ? editData.jv_users.map((u) => String(u.id)) : []);

  const [locations, setLocations] = useState<LocationItem[]>(
    editData
      ? editData.locations.map((l) => ({
          id: l.id,
          name: l.location_name,
        }))
      : []
  );

  const addLocation = () => {
    if (!locInput.trim()) return;

    setLocations((prev) => [...prev, { name: locInput.trim() }]);
    setLocInput('');
  };

  const updateLocation = (index: number, value: string) => {
    setLocations((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: value,
      };
      return updated;
    });
  };

  const removeLocation = (index: number) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      return data.users;
    },
  });

  const jvUsers = (users ?? []).filter((u) => u.role_id === Roles.JOINT_VENTURE);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa/save`, {
        method: 'POST',
        body: JSON.stringify({
          moa_id: editData?.id ?? null,
          moa_name: moaName,
          jv_user_ids: jvUserIds.map(Number),
          locations: locations.map((l) => ({
            id: l.id ?? null,
            name: l.name,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save MOA');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['expense-moas'],
      });

      onClose();

      if (!editData) {
        setMoaName('');
        setJvUserIds([]);
        setLocations([]);
      }
    },
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={editData ? 'Edit MOA' : 'Create MOA'}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {editData ? 'Save Changes' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="moa-name" className="text-sm font-medium">
            MOA Name
          </label>
          <Input id="moa-name" value={moaName} onChange={(e) => setMoaName(e.target.value)} className="h-10" />
        </div>

        <div className="space-y-2">
          <label htmlFor="jv-users" className="text-sm font-medium">
            JV Users
          </label>
          <select
            id="jv-users"
            multiple
            value={jvUserIds}
            onChange={(e) => setJvUserIds(Array.from(e.target.selectedOptions, (option) => option.value))}
            className="min-h-36 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {jvUsers.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.profile.first_name} {user.profile.last_name} ({user.profile.company_name})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Input value={locInput} onChange={(e) => setLocInput(e.target.value)} placeholder="Location" className="h-10" />
          <Button type="button" onClick={addLocation}>
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {locations.map((loc, i) => (
            <div key={loc.id ?? i} className="flex items-center gap-2">
              <Input value={loc.name} onChange={(e) => updateLocation(i, e.target.value)} className="h-10" />
              <Button type="button" variant="outline" size="icon" onClick={() => removeLocation(i)}>
                <Trash2 className="size-4" />
                <span className="sr-only">Remove location</span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppModal>
  );
}
