import { Moa } from '@/app/types/moa';
import { User } from '../users/users.type';

export type JVItem = {
  id: number;
  share_percentage: number;
};

export type LocationItem = {
  id?: number;
  structure_id?: number | null;
  name: string;
  report_group: string;
  jv_users: JVItem[];
};

export type Props = {
  open: boolean;
  onClose: () => void;
  editData?: Moa | null;
};

export function mapEditLocations(editData?: Moa | null): LocationItem[] {
  return (
    editData?.locations.map((location) => ({
      id: location.id,
      structure_id: location.structure_id ?? null,
      name: location.location_name,
      report_group: location.report_group ?? '',
      jv_users: (location.jv_users ?? []).map((jv) => ({
        id: jv.id,
        share_percentage: jv.share_percentage ?? 0,
      })),
    })) ?? []
  );
}

export function getUserLabel(user: User) {
  const firstName = user.profile?.first_name ?? '';
  const lastName = user.profile?.last_name ?? '';
  const companyName = user.profile?.company_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName && companyName) return `${fullName} - ${companyName}`;
  if (fullName) return fullName;
  if (companyName) return companyName;
  return user.email;
}

export function getTotals(location: LocationItem) {
  const totalJV = location.jv_users.reduce((sum, jv) => sum + (jv.share_percentage || 0), 0);

  return {
    totalJV,
    unai: 100 - totalJV,
  };
}
