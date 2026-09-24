import {QuickPitch} from '@/features/pitches/QuickPitch';
import {useCallback,useState} from 'react';
import {Link,router,useFocusEffect,useLocalSearchParams} from 'expo-router';
import Head from 'expo-router/head';
import {Text,View} from 'react-native';
import {AuthFrame,AuthError} from '@/components/auth/AuthFrame';
import {RequireProfile} from '@/components/auth/RequireProfile';
import {Button} from '@/components/ui/Button';
import {textStyle} from '@/features/profiles/ProfileFields';
import {useOrganization} from '@/features/organizations/OrganizationContext';
import {useSession} from '@/providers/SessionProvider';
import {preferenceLabel} from '@/constants/taxonomy';
import {getOrganizationCalls,publishCall,type Call} from './data';
import {CallForm} from './CallForm';
const route='/org/[slug]/calls/[opportunitySlug]' as const;
function useCalls(orgId?:string){
 const [rows,setRows]=useState<Call[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
 useFocusEffect(useCallback(()=>{let active=true;void attempt;void Promise.resolve().then(async()=>{if(!active)return;setLoading(true);setError(null);try{const calls=orgId?await getOrganizationCalls(orgId):[];if(active)setRows(calls);}catch{if(active)setError('Unable to load Calls. Please retry.');}finally{if(active)setLoading(false);}});return()=>{active=false;};},[orgId,attempt]));
 return {rows,loading,error,retry:()=>setAttempt(n=>n+1)};
}
export function OrganizationCalls(){
 const {organization:org,membership}=useOrganization();const {profile}=useSession();const {rows,loading,error,retry}=useCalls(org?.id);
 return <View className="gap-md"><Text accessibilityRole="header" className={textStyle}>Calls for Events</Text>
 {loading?<Text className={textStyle}>Loading Calls...</Text>:error?<><AuthError message={error}/><Button label="Retry Calls" onPress={retry}/></>:rows.length?rows.map(call=><View key={call.id} className="gap-sm"><Link className={textStyle} href={{pathname:route,params:{slug:org!.slug,opportunitySlug:call.slug}}}>{call.title}</Link><Text className={textStyle}>{call.status==='draft'?'Draft':'Published'}</Text></View>):<Text className={textStyle}>No Calls available.</Text>}
 {profile?.role==='sponsor'&&membership?.role==='admin'&&org?<Link href={{pathname:'/org/[slug]/calls/new',params:{slug:org.slug}}} asChild><Button label="Create Call for Events"/></Link>:null}</View>;
}
export function CallScreen({mode}:{mode:'new'|'view'|'edit'}){return mode==='view'?<Content mode={mode}/>:<RequireProfile><Content mode={mode}/></RequireProfile>;}
function Content({mode}:{mode:'new'|'view'|'edit'}){
 const {organization:org,membership,loading:orgLoading,error:orgError,retry:orgRetry}=useOrganization();const {profile}=useSession();
 const {opportunitySlug}=useLocalSearchParams<{opportunitySlug:string}>();const {rows,loading,error,retry}=useCalls(org?.id);
 const [failure,setFailure]=useState<string|null>(null),[busy,setBusy]=useState(false);
 if(orgLoading||loading)return <AuthFrame title="Loading Call"/>;
 if(orgError||error)return <AuthFrame title="Unable to load Call"><AuthError message={orgError||error}/><Button label="Retry" onPress={()=>{orgRetry();retry();}}/></AuthFrame>;
 if(!org)return <AuthFrame title="Organization required"><Text className={textStyle}>You need an administered organization before creating a Call.</Text><Link href="/org/new">Create organization</Link></AuthFrame>;
 const canManage=profile?.role==='sponsor'&&membership?.role==='admin';
 if(mode!=='view'&&!canManage)return <AuthFrame title="Sponsor admin required"><Text className={textStyle}>Only Sponsor admins of this organization can manage Calls.</Text><Link href="/org/new">Create organization</Link></AuthFrame>;
 const call=rows.find(c=>c.slug===opportunitySlug);
 if(mode!=='new'&&!call)return <AuthFrame title="Call unavailable"><Text className={textStyle}>This Call was not found or is not available to you.</Text></AuthFrame>;
 if(mode!=='view')return <AuthFrame title={mode==='new'?'Create Call for Events':'Edit Call'}><CallForm key={call?.id||org.id} orgId={org.id} initial={mode==='edit'?call:undefined} onSaved={slug=>router.replace({pathname:route,params:{slug:org.slug,opportunitySlug:slug}})}/></AuthFrame>;
 const item=call!;
 async function changeStatus(){if(busy)return;setBusy(true);setFailure(null);try{await publishCall(item.id,item.status==='draft');retry();}catch(e){setFailure(e instanceof Error?e.message:'Unable to publish Call.');}finally{setBusy(false);}}
 return <AuthFrame title={item.title}><Head><title>{item.title} · {org.name} · Maple</title></Head>
 <Link className={textStyle} href={{pathname:'/org/[slug]',params:{slug:org.slug}}}>{org.name}</Link>
 <Text className={textStyle}>{item.status==='draft'?'Draft - visible only to Sponsor admins of this organization.':'Published'}</Text>
 <Text className={textStyle}>{item.description}</Text>
 {item.opportunity_call_details?( ['target_categories','target_regions','target_audience_types','target_attendance_bands','gives'] as const).map(key=><Text key={key} className={textStyle}>{key.replaceAll('_',' ')}: {item.opportunity_call_details![key].map(preferenceLabel).join(', ')||'Not specified'}</Text>):null}
 <QuickPitch opportunityId={item.id} ownerOrgId={item.owner_org_id} type="call" published={item.status==='published'}/>
 {canManage?<><Link href={{pathname:'/org/[slug]/calls/[opportunitySlug]/edit',params:{slug:org.slug,opportunitySlug:item.slug}}} asChild><Button label="Edit Call"/></Link><Button label={busy?'Saving...':item.status==='draft'?'Publish Call':'Unpublish Call'} disabled={busy} onPress={()=>void changeStatus()}/></>:null}
 <AuthError message={failure}/></AuthFrame>;
}
