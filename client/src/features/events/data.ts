import { getSupabaseClient } from '@/lib/supabase/client';
import { getCurrentProfile } from '@/features/profiles/data';
import { normalizeWebsite } from '@/features/organizations/validation';
import type { Database } from '@/types/database';
import { instantToWall, wallToInstant } from './dates';
import { validateEvent, type EventInput } from './validation';
export type Event = Database['public']['Tables']['events']['Row'];
export type AdminOrganization = { id: string; name: string; slug: string };
async function organizer() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Your session has ended. Please sign in and complete your profile.');
  if (profile.role !== 'organizer') throw new Error('Only Organizer profiles can manage events.');
  return profile;
}
export async function getMyAdminOrganizations(): Promise<AdminOrganization[]> {
  const profile = await organizer();
  const { data, error } = await getSupabaseClient().from('organization_members')
    .select('organizations(id,name,slug)').eq('profile_id', profile.id).eq('role', 'admin');
  if (error) throw new Error('We could not load your organizations. Please retry.');
  return data.map(row => row.organizations).filter((org): org is AdminOrganization => org !== null);
}
export async function getEventBySlug(slug: string) {
  const { data, error } = await getSupabaseClient().from('events').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error('We could not load this event. Please retry.');
  return data;
}
export async function getOrganizationEvents(orgId: string) {
  const { data, error } = await getSupabaseClient().from('events').select('*').eq('org_id', orgId).order('starts_at');
  if (error) throw new Error('We could not load the organization events. Please retry.');
  return data;
}
function fields(input: EventInput, editing: boolean) {
  if (Object.keys(validateEvent(input, editing)).length) throw new Error('Check the highlighted event fields.');
  return {
    title: input.title.trim(), description: input.description.trim() || null, format: input.format,
    starts_at: wallToInstant(input.starts_at, input.timezone), ends_at: wallToInstant(input.ends_at, input.timezone),
    timezone: input.timezone, venue_name: input.venue_name.trim() || null, city: input.city.trim() || null,
    country: input.country.trim() || null, website: normalizeWebsite(input.website),
    categories: [...new Set(input.categories)], audience_types: [...new Set(input.audience_types)], attendance_band: input.attendance_band,
  };
}
function failure(error: { code?: string }) {
  return new Error(error.code === '23505' ? 'That event URL was just taken. Please choose another.'
    : error.code === '23514' || error.code === '23502' ? 'Check the event details, timezone, and dates, then retry.'
    : 'We could not save this event. Check your connection and organization permission, then retry.');
}
export async function createEvent(input: EventInput) {
  await organizer();
  const { data, error } = await getSupabaseClient().from('events')
    .insert({ ...fields(input, false), org_id: input.org_id, slug: input.slug }).select('*').single();
  if (error) throw failure(error);
  return data;
}
export async function updateEvent(id: string, input: EventInput) {
  await organizer();
  const { data, error } = await getSupabaseClient().from('events').update(fields(input, true)).eq('id', id).select('*').single();
  if (error) throw failure(error);
  return data;
}
export async function publishEvent(id: string, published: boolean) {
  await organizer();
  const { data, error } = await getSupabaseClient().from('events').update({ status: published ? 'published' : 'draft' }).eq('id', id).select('*').single();
  if (error) throw failure(error);
  return data;
}
export function eventInput(event: Event): EventInput {
  return { org_id: event.org_id, title: event.title, slug: event.slug, description: event.description || '',
    format: event.format, starts_at: instantToWall(event.starts_at, event.timezone), ends_at: instantToWall(event.ends_at, event.timezone),
    timezone: event.timezone, venue_name: event.venue_name || '', city: event.city || '', country: event.country || '',
    website: event.website || '', categories: event.categories, audience_types: event.audience_types, attendance_band: event.attendance_band };
}
