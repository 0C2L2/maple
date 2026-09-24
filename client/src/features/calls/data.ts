import {getSupabaseClient} from '@/lib/supabase/client';
import type {BudgetBand} from '@/constants/budgetBands';
import type {Database,Json} from '@/types/database';
export type CallDetails=Database['public']['Tables']['opportunity_call_details']['Row'];
export type CallBudget=Database['public']['Tables']['opportunity_call_budgets']['Row'];
export type Call=Database['public']['Tables']['opportunities']['Row'] & {opportunity_call_details:CallDetails|null};
// Public query deliberately never references the private budget table.
export const publicCallSelect='id,type,event_id,owner_org_id,created_by,title,slug,description,status,created_at,updated_at,opportunity_call_details(*)' as const;
export async function getOrganizationCalls(orgId:string){
 const {data,error}=await getSupabaseClient().from('opportunities').select(publicCallSelect).eq('owner_org_id',orgId).eq('type','call').order('created_at');
 if(error)throw Error('Unable to load Calls. Please retry.');return data as Call[];
}
export async function getMyCallBudget(id:string){
 const {data,error}=await getSupabaseClient().from('opportunity_call_budgets').select('*').eq('opportunity_id',id).maybeSingle();
 if(error)throw Error('Unable to load your private budget. Check your session and retry.');return data;
}
export async function saveCall(orgId:string,id:string|undefined,title:string,slug:string,description:string,details:Json,budgetBand:BudgetBand|null){
 const client=getSupabaseClient();
 const {data,error}=id?await client.rpc('update_call_opportunity',{p_id:id,p_title:title,p_description:description,p_details:details,p_budget_band:budgetBand ?? undefined})
 :await client.rpc('create_call_opportunity',{p_org_id:orgId,p_title:title,p_slug:slug,p_description:description,p_details:details,p_budget_band:budgetBand ?? undefined});
 if(error)throw Error(error.code==='23505'?'This Call URL is already used in this organization.':'Unable to save. Check your fields, connection and Sponsor admin permission, or sign in again.');
 return data;
}
export async function publishCall(id:string,published:boolean){
 const {error}=await getSupabaseClient().from('opportunities').update({status:published?'published':'draft'}).eq('id',id).eq('type','call').select('id').single();
 if(error)throw Error('Unable to change publication. Check your session and Sponsor admin permission.');
}
