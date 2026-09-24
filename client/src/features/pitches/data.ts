import {getSupabaseClient} from '@/lib/supabase/client';
export async function getPitchState(opportunityId:string,orgId:string,fromId:string){
 const client=getSupabaseClient();
 const [membership,pitch]=await Promise.all([
  client.from('organization_members').select('org_id').eq('org_id',orgId).eq('profile_id',fromId).maybeSingle(),
  client.from('pitches').select('id').eq('opportunity_id',opportunityId).eq('from_id',fromId).maybeSingle(),
 ]);
 if(membership.error||pitch.error)throw Error('Unable to check pitch availability. Please retry.');
 return {ownSide:!!membership.data,sent:!!pitch.data};
}
export async function sendPitch(opportunityId:string,fromId:string,note:string){
 const trimmed=note.trim();
 if(Array.from(trimmed).length>300)throw Error('Keep your note to 300 characters or fewer.');
 const {error}=await getSupabaseClient().from('pitches').insert({opportunity_id:opportunityId,from_id:fromId,note:trimmed||null});
 if(error?.code==='23505')return 'already-sent' as const;
 if(error)throw Error('Unable to send your pitch. Check your connection and sign-in, or refresh this opportunity.');
 return 'sent' as const;
}
