import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileFields = Pick<Profile, 'name' | 'handle' | 'headline' | 'bio' | 'location' | 'categories' | 'regions' | 'audience_types' | 'audience_band' | 'gives'>;
export type CreateProfileInput = ProfileFields & Pick<Profile, 'role'>;

async function currentId() {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error || !data.session) throw new Error('Your session has ended. Please sign in again.');
  return data.session.user.id;
}
export async function getCurrentProfile() {
  const id = await currentId();
  const { data, error } = await getSupabaseClient().from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('We could not load your profile. Check your connection and retry.');
  return data;
}
// Explicit allowlist: callers cannot sneak protected columns into a runtime object.
function editable(input: ProfileFields): ProfileFields {
  return { name: input.name.trim(), handle: input.handle, headline: input.headline?.trim() || null,
    bio: input.bio?.trim() || null, location: input.location?.trim() || null,
    categories: input.categories, regions: input.regions, audience_types: input.audience_types,
    audience_band: input.audience_band || null, gives: input.gives };
}
function writeError(error: { code?: string }) {
  return new Error(error.code === '23505'
    ? 'That handle was just taken. Please choose another.'
    : 'We could not save your profile. Check your connection and try again.');
}
export async function insertCurrentProfile(input: CreateProfileInput) {
  const id = await currentId();
  const { data, error } = await getSupabaseClient().from('profiles').insert({ ...editable(input), id, role: input.role }).select('*').single();
  if (!error) return data;
  if (error.code === '23505') {
    // Recover an existing own row without upserting or overwriting it.
    const { data: existing, error: lookupError } = await getSupabaseClient().from('profiles').select('*').eq('id', id).maybeSingle();
    if (!lookupError && existing) return existing;
  }
  throw writeError(error);
}
export async function updateCurrentProfile(input: ProfileFields) {
  const id = await currentId();
  const { data, error } = await getSupabaseClient().from('profiles').update(editable(input)).eq('id', id).select('*').single();
  if (error) throw writeError(error);
  return data;
}
export async function isHandleAvailable(handle: string) {
  const id = await currentId();
  const { data, error } = await getSupabaseClient().from('profiles').select('id').eq('handle', handle).maybeSingle();
  if (error) throw new Error('Handle availability could not be checked. Please retry.');
  return !data || data.id === id;
}
