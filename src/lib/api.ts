import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

type ApiFetchOptions = RequestInit & {
  router?: AppRouterInstance;
  skipAuthRedirectOn401?: boolean;
  skipAuthHeader?: boolean;
};

export async function apiFetch(url: string, options: ApiFetchOptions = {}) {
  const session = localStorage.getItem('session');

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(session && !options.skipAuthHeader ? { Authorization: `Bearer ${session}` } : {}),
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401 && !options.skipAuthRedirectOn401) {
    localStorage.removeItem('session');

    if (options.router) {
      options.router.replace('/login');
    }

    throw new Error('Unauthorized');
  }

  return res;
}
