'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function usePermissions() {
  const {
    data = [],
    isFetching,
    isError,
  } = useQuery<string[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/permissions`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch permissions');
      }

      return data.data;
    },
  });

  const can = (code: string) => data.includes(code);

  return {
    permissions: data,
    can,
    isFetching,
    isError,
  };
}
