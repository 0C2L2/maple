import { useQuery } from '@tanstack/react-query';

import type { Category } from '@/constants/taxonomy';
import { supabase } from '@/lib/supabase';

/** A past event, like a portfolio item (public.showcases). */
export type Showcase = {
  id: string;
  org_id: string;
  post_id: string | null;
  title: string;
  summary: string;
  body: string;
  categories: Category[];
  starts_on: string | null;
  ends_on: string | null;
  city: string | null;
  venue: string | null;
  facts: { label: string; value: string }[];
  highlights: string[];
  sponsors: string[];
  cover_url: string | null;
  gallery: string[];
  link: string | null;
  org: { handle: string; name: string; logo_url: string | null };
};

const COLUMNS = '*, org:organizations!showcases_org_id_fkey(handle, name, logo_url)';

/** Newest events first; one organization's when `orgId` is set. */
export function useShowcases(orgId?: string) {
  return useQuery({
    queryKey: ['showcases', 'list', orgId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('showcases').select(COLUMNS).order('starts_on', { ascending: false }).limit(24);
      if (orgId) query = query.eq('org_id', orgId);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Showcase[];
    },
  });
}

export function useShowcase(id: string) {
  return useQuery({
    queryKey: ['showcases', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('showcases').select(COLUMNS).eq('id', id).maybeSingle();
      if (error) throw error;
      return data as unknown as Showcase | null;
    },
  });
}
