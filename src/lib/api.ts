import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

type ApiFetchOptions = RequestInit & {
  router?: AppRouterInstance;
  skipAuthRedirectOn401?: boolean;
  skipAuthHeader?: boolean;
};

export async function apiFetch(url: string, options: ApiFetchOptions = {}) {
  const { router, skipAuthRedirectOn401, skipAuthHeader, headers, ...fetchOptions } = options;

  const session = typeof window !== 'undefined' ? localStorage.getItem('session') : null;

  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(session && !skipAuthHeader ? { Authorization: `Bearer ${session}` } : {}),
    },
  });

  if (res.status === 401 && !skipAuthRedirectOn401) {
    localStorage.removeItem('session');
    router?.replace('/login');
    throw new Error('Unauthorized');
  }

  return res;
}
