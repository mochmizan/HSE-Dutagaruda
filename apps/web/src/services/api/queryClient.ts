import { QueryClient } from '@tanstack/react-query';

/**
 * Klien Query global — stale-while-revalidate ringan.
 * retry: 1 agar kegagalan sesi/validasi cepat terlihat di UI.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
