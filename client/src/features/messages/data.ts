import {getSupabaseClient} from '@/lib/supabase/client';
import type {Database} from '@/types/database';
export type Message=Database['public']['Tables']['messages']['Row'];
const threadSelect='id,pitch_id,opportunity_id,from_id,owner_id,created_at,matched_at,sender:profiles!threads_from_id_fkey(name),owner:profiles!threads_owner_id_fkey(name),opportunities(title,slug,type,events(slug),organizations!opportunities_owner_org_id_fkey(name,slug))' as const;
export async function listThreads(offset=0){
 const {data,error}=await getSupabaseClient().from('threads').select(threadSelect).order('created_at',{ascending:false}).order('id').range(offset,offset+19);
 if(error)throw Error('Unable to load conversations. Please retry.');return data;
}
export type Thread=Awaited<ReturnType<typeof listThreads>>[number];
export async function getThread(id:string){
 const {data,error}=await getSupabaseClient().from('threads').select(threadSelect).eq('id',id).maybeSingle();
 if(error)throw Error('Unable to load this conversation. Please retry.');return data;
}
export async function listMessages(id:string,offset=0){
 const {data,error}=await getSupabaseClient().from('messages').select('id,thread_id,sender_id,body,created_at').eq('thread_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+49);
 if(error)throw Error('Unable to load messages. Please retry.');return data;
}
export async function sendMessage(id:string,senderId:string,body:string){
 const text=body.trim();if(!text||Array.from(text).length>2000)throw Error('Enter a message of 1 to 2,000 characters.');
 const {error}=await getSupabaseClient().from('messages').insert({thread_id:id,sender_id:senderId,body:text});
 if(error)throw Error('Unable to send. Check your connection and conversation access, then retry.');
}
export async function openConversation(opportunityId:string,fromId:string){
 const client=getSupabaseClient();
 const {data:pitch,error}=await client.from('pitches').select('id').eq('opportunity_id',opportunityId).eq('from_id',fromId).single();
 if(error)throw Error('Unable to find your pitch. Please retry.');
 const result=await client.rpc('get_or_create_thread',{p_pitch_id:pitch.id});
 if(result.error)throw Error('Unable to open the conversation. Please retry.');
 return result.data;
}
