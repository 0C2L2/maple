import { getSupabaseClient } from '@/lib/supabase/client';
import { getCurrentProfile } from '@/features/profiles/data';
import type { Database } from '@/types/database';
import { normalizeDomain, normalizeWebsite, validateOrganization, type OrgInput, type OrgType } from './validation';
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Membership = Pick<Database['public']['Tables']['organization_members']['Row'], 'org_id' | 'profile_id' | 'role'>;
async function currentId() {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error || !data.session) throw new Error('Your session has ended. Please sign in again.');
  return data.session.user.id;
}
function fields(input: OrgInput, editing: boolean) {
  if (Object.keys(validateOrganization(input, editing)).length) throw new Error('Check the highlighted organization fields.');
  return { name: input.name.trim(), type: input.type as OrgType, domain: normalizeDomain(input.domain), website: normalizeWebsite(input.website), about: input.about.trim() || null };
}
function failure(error: { code?: string }) {
  return new Error(error.code === '23505' ? 'That organization URL was just taken. Please choose another.' : 'We could not save this organization. Check your connection and permission, then retry.');
}
export async function getOrganizationBySlug(slug: string) {
  const { data, error } = await getSupabaseClient().from('organizations').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error('We could not load the organization. Please retry.');
  return data;
}
export async function getMyOrganizationMembership(orgId: string) {
  const id = await currentId();
  const { data, error } = await getSupabaseClient().from('organization_members').select('org_id,profile_id,role').eq('org_id', orgId).eq('profile_id', id).maybeSingle();
  if (error) throw new Error('We could not load your membership. Please retry.');
  return data;
}
export async function getMyOrganizations() {
  const id = await currentId();
  const { data, error } = await getSupabaseClient().from('organization_members').select('org_id,organizations(id,name,slug,type)').eq('profile_id', id);
  if (error) throw new Error('We could not load your organizations. Please retry.');
  return data.map((item) => item.organizations).filter((org) => org !== null);
}
export async function createOrganization(input: OrgInput) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Complete your Maple profile before creating an organization.');
  const { data, error } = await getSupabaseClient().from('organizations').insert({ ...fields(input, false), slug: input.slug, created_by: profile.id }).select('*').single();
  if (error) throw failure(error);
  return data;
}
export async function updateOrganization(id: string, input: OrgInput) {
  await currentId();
  const { data, error } = await getSupabaseClient().from('organizations').update(fields(input, true)).eq('id', id).select('*').single();
  if (error) throw failure(error);
  return data;
}
