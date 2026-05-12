'use client';

import { useState } from 'react';
import AppModal from '../components/AppModal';
import { User } from './users.type';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
type Props = {
  open: boolean;
  user: User | null;
  onClose: () => void;
};

export default function UserProfileModal({ open, user, onClose }: Props) {
  const { user: currentUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(user?.profile?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.profile?.last_name ?? '');
  const [entityType, setEntityType] = useState<'individual' | 'company'>((user?.profile?.entity_type as 'individual' | 'company') ?? 'individual');
  const [companyName, setCompanyName] = useState(user?.profile?.company_name ?? '');
  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;

    const isSelf = currentUser?.id === user.id;

    const endpoint = isSelf ? '/users/update-profile' : '/admin/users/update-profile';

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('session')}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        entity_type: entityType,
        company_name: entityType === 'company' ? companyName : null,
      }),
    });

    if (isSelf) {
      await refreshUser();
    } else {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }

    onClose();
  };

  return (
    <AppModal
      key={user.id}
      open={open}
      onClose={onClose}
      title="User Profile"
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="profile-email" className="text-sm font-medium">
            Email
          </label>
          <Input id="profile-email" value={user.email} disabled className="h-10" />
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-first-name" className="text-sm font-medium">
            First Name
          </label>
          <Input id="profile-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10" />
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-last-name" className="text-sm font-medium">
            Last Name
          </label>
          <Input id="profile-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10" />
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-entity-type" className="text-sm font-medium">
            Entity Type
          </label>
          <Select value={entityType} onValueChange={(val) => setEntityType(val as 'individual' | 'company')}>
            <SelectTrigger id="profile-entity-type">
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem> <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {entityType === 'company' && (
          <div className="space-y-2">
            <label htmlFor="profile-company-name" className="text-sm font-medium">
              Company Name
            </label>
            <Input id="profile-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-10" />
          </div>
        )}
      </div>
    </AppModal>
  );
}
