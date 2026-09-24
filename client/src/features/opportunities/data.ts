import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database, Json } from '@/types/database';
export type Opportunity=Database['public']['Tables']['opportunities']['Row'];
export type Tier=Database['public']['Tables']['opportunity_tiers']['Row'];
export type Package=Opportunity & {opportunity_tiers: Tier[]};
export async function listOpportunities(eventId:string) {
 const {data,error}=await getSupabaseClient().from('opportunities').select('*,opportunity_tiers(*)').eq('event_id',eventId).eq('type','package').order('created_at');
 if(error) throw new Error('Unable to load sponsorship opportunities. Please retry.');
 return data as Package[];
}
export async function saveOpportunity(eventId:string,id:string|undefined,title:string,slug:string,description:string,tiers:Json) {
 const client=getSupabaseClient();
 const result=id ? await client.rpc('update_package_opportunity',{p_id:id,p_title:title,p_description:description,p_tiers:tiers})
 : await client.rpc('create_package_opportunity',{p_event_id:eventId,p_title:title,p_slug:slug,p_description:description,p_tiers:tiers});
 if(result.error) throw new Error(result.error.code==='23505'?'This URL is already used for this event. Choose another.':'Unable to save. Check your fields and Organizer permission, or sign in again.');
 return result.data;
}
export async function setPublished(id:string,published:boolean) {
 const {error}=await getSupabaseClient().from('opportunities').update({status:published?'published':'draft'}).eq('id',id).select('id').single();
 if(error) throw new Error('Unable to change publication. At least one valid tier and Organizer admin permission are required.');
}
