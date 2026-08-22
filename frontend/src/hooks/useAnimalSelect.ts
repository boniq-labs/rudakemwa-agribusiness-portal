import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

/**
 * Canonical animal-selector data source for ALL Animal Production and
 * Veterinary forms. Reuses the existing `/animals/select` endpoint
 * (deleted/dead/sold excluded server-side) — no second data source.
 */
export interface AnimalOption {
  id: number;
  tag_number: string;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  gender?: string | null;
}

export function useAnimalSelect() {
  const q = useQuery({
    queryKey: ['animals', 'select'],
    queryFn: async (): Promise<AnimalOption[]> =>
      (await client.get('/animals/select')).data?.data || [],
    staleTime: 30_000, // refetches on mount when stale → newly registered animals appear
  });

  // Defensive dedupe by id (id is the PK; guards against any upstream duplication)
  const animals: AnimalOption[] = q.data
    ? Array.from(new Map(q.data.map(a => [a.id, a])).values())
    : [];

  return { animals, isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** `Name — TAG` identity label used across every animal dropdown. */
export const animalLabel = (a: AnimalOption): string =>
  `${a.name || 'Unnamed'} — ${a.tag_number}`;

/** State <option>s to render inside an animal <select> while loading / on error / when empty. */
export function animalSelectStateOptions(res: {
  animals: AnimalOption[];
  isLoading: boolean;
  isError: boolean;
}): { value: string; label: string }[] {
  if (res.isError) return [{ value: '', label: '⚠ Could not load animals' }];
  if (res.isLoading) return [{ value: '', label: 'Loading animals…' }];
  if (res.animals.length === 0) return [{ value: '', label: 'No animals available' }];
  return [];
}
