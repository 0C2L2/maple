import {getSupabaseClient} from '@/lib/supabase/client';
import type {Database} from '@/types/database';
type Row=Database['public']['Functions']['list_public_opportunities']['Returns'][number];
export type OpportunityCardData=(Row & {type:'package'})|(Row & {type:'call'});
export type Filters={categories:string[];audience_types:string[];attendance_bands:string[];regions:string[];formats:string[]};
export const emptyFilters:Filters={categories:[],audience_types:[],attendance_bands:[],regions:[],formats:[]};
export async function loadOpportunities(type:'package'|'call',filters:Filters,offset:number):Promise<OpportunityCardData[]>{
 const {data,error}=await getSupabaseClient().rpc('list_public_opportunities',{p_type:type,p_categories:filters.categories,p_audience_types:filters.audience_types,p_attendance_bands:filters.attendance_bands,p_regions:filters.regions,p_formats:filters.formats,p_limit:20,p_offset:offset});
 if(error)throw Error('Unable to load opportunities. Check your connection or sign in again, then retry.');
 return data as OpportunityCardData[];
}
