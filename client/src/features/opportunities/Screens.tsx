import {DetailLayout,Section,Identity,Chips,Badge,mutedText} from '@/components/marketplace/Marketplace';
import {orgTypes} from '@/features/organizations/validation';
import {displayDate} from '@/features/events/dates';
import {preferenceLabel} from '@/constants/taxonomy';
import {QuickPitch} from '@/features/pitches/QuickPitch';
import {useCallback,useState} from 'react';
import {Link,router,useFocusEffect,useLocalSearchParams} from 'expo-router';
import Head from 'expo-router/head';
import {Text,View} from 'react-native';
import {AuthFrame,AuthError} from '@/components/auth/AuthFrame';
import {RequireProfile} from '@/components/auth/RequireProfile';
import {Button} from '@/components/ui/Button';
import {textStyle} from '@/features/profiles/ProfileFields';
import {useEvent} from '@/features/events/EventContext';
import {listOpportunities,setPublished,type Package} from './data';
import {formatMoney} from './money';
import {OpportunityForm} from './OpportunityForm';
const path='/events/[slug]/opportunities/[opportunitySlug]' as const;
export function EventOpportunities(){
 const {event,canManage}=useEvent(); const {rows,error,loading,retry}=useRows(event?.id);
 return <View className="gap-md"><Text accessibilityRole="header" className={textStyle}>Sponsorship opportunities</Text>
 {loading?<Text className={textStyle}>Loading opportunities...</Text>:error?<><AuthError message={error}/><Button label="Retry opportunities" onPress={retry}/></>:rows.length?rows.map(o=><View key={o.id} className="gap-sm"><Link className={textStyle} href={{pathname:path,params:{slug:event!.slug,opportunitySlug:o.slug}}}>{o.title}</Link><Text className={textStyle}>{o.status==='draft'?'Draft':'Published'} · {o.opportunity_tiers.length} tiers</Text></View>):<Text className={textStyle}>No sponsorship opportunities available.</Text>}
 {canManage&&event?<Link href={{pathname:'/events/[slug]/opportunities/new',params:{slug:event.slug}}} asChild><Button label="Create sponsorship opportunity"/></Link>:null}</View>;
}
function useRows(eventId?:string){
 const [rows,setRows]=useState<Package[]>([]),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0);
 useFocusEffect(useCallback(()=>{let active=true;void attempt;void Promise.resolve().then(async()=>{if(!active)return;setLoading(true);setError(null);try{const data=eventId?await listOpportunities(eventId):[];if(active)setRows(data);}catch{if(active)setError('Unable to load opportunities. Please retry.');}finally{if(active)setLoading(false);}});return()=>{active=false;};},[eventId,attempt]));
 return {rows,error,loading,retry:()=>setAttempt(n=>n+1)};
}
export function OpportunityScreen({mode}:{mode:'new'|'view'|'edit'}){
 return mode==='view'?<Content mode={mode}/>:<RequireProfile><Content mode={mode}/></RequireProfile>;
}
function Content({mode}:{mode:'new'|'view'|'edit'}){
 const {event,organization,canManage,loading:parentLoading,error:parentError,retry:parentRetry}=useEvent();
 const {opportunitySlug}=useLocalSearchParams<{opportunitySlug:string}>();
 const {rows,error,loading,retry}=useRows(event?.id);
 const [failure,setFailure]=useState<string|null>(null),[busy,setBusy]=useState(false);
 if(parentLoading||loading)return <AuthFrame title="Loading opportunity"/>;
 if(parentError||error)return <AuthFrame title="Unable to load opportunity"><AuthError message={parentError||error}/><Button label="Retry" onPress={()=>{parentRetry();retry();}}/></AuthFrame>;
 const item=rows.find(o=>o.slug===opportunitySlug);
 if(!event||(mode!=='new'&&!item))return <AuthFrame title="Opportunity unavailable"><Text className={textStyle}>This opportunity was not found or is not available to you.</Text></AuthFrame>;
 if(mode!=='view'&&!canManage)return <AuthFrame title="Organizer admin required"><Text className={textStyle}>Only Organizer admins of this event organization can manage sponsorship opportunities.</Text></AuthFrame>;
 if(mode!=='view')return <AuthFrame title={mode==='new'?'Create sponsorship opportunity':'Edit sponsorship opportunity'}><OpportunityForm key={item?.id||event.id} eventId={event.id} initial={mode==='edit'?item:undefined} onSaved={slug=>router.replace({pathname:path,params:{slug:event.slug,opportunitySlug:slug}})}/></AuthFrame>;
 const opportunity=item!;
 async function publish(){if(busy)return;setBusy(true);setFailure(null);try{await setPublished(opportunity.id,opportunity.status==='draft');retry();}catch(e){setFailure(e instanceof Error?e.message:'Unable to publish.');}finally{setBusy(false);}}
 return <DetailLayout title={opportunity.title} badge="SPONSORSHIP OPPORTUNITY" subtitle={<><Link className={textStyle} href={{pathname:'/events/[slug]',params:{slug:event.slug}}}>{event.title}</Link><Text className={mutedText}>{displayDate(event.starts_at,event.timezone)} · {event.timezone}</Text><Chips values={[event.format.replace('_',' '),event.city||'',event.country||'',...event.categories.map(preferenceLabel),...event.audience_types.map(preferenceLabel),event.attendance_band+' attendees']}/>{opportunity.status==='draft'||event.status==='draft'?<Text className={mutedText}>{opportunity.status==='draft'?'Draft':'Private until the event is published'}</Text>:null}</>} sidebar={<>
 {organization?<><Identity name={organization.name} subtitle={orgTypes[organization.type]}/>{organization.verified?<Badge>Verified organization</Badge>:null}<Link className={textStyle} href={{pathname:'/org/[slug]',params:{slug:organization.slug}}}>View organization →</Link></>:null}
 <Text className={mutedText}>{event.title}</Text>
 <QuickPitch opportunityId={opportunity.id} ownerOrgId={opportunity.owner_org_id} type="package" title={opportunity.title} organizationName={organization?.name} published={opportunity.status==='published'&&event.status==='published'}/>
 {canManage?<><Link href={{pathname:'/events/[slug]/opportunities/[opportunitySlug]/edit',params:{slug:event.slug,opportunitySlug:opportunity.slug}}} asChild><Button size="small" variant="secondary" label="Edit opportunity"/></Link><Button size="small" label={busy?'Saving...':opportunity.status==='draft'?'Publish opportunity':'Unpublish opportunity'} disabled={busy} onPress={()=>void publish()}/></>:null}<AuthError message={failure}/>
 </>}>
 <Head><title>{opportunity.title} · {event.title} · Maple</title></Head>
 <Section title="About this opportunity"><Text className={textStyle}>{opportunity.description}</Text></Section>
 <Section title="Sponsorship options"><View className="flex-row flex-wrap gap-md">{[...opportunity.opportunity_tiers].sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id)).map(t=><View key={t.id} className="w-full gap-md rounded-xl border border-light-border p-lg dark:border-dark-border xl:w-[47%]"><Text accessibilityRole="header" className="text-sm font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted">{t.name}</Text><Text className="text-2xl font-semibold text-light-text dark:text-dark-text">{t.in_kind?'In-kind':formatMoney(t.price_minor!,t.currency!)}</Text>{t.benefits.map((b,i)=><Text key={i} className={textStyle}>✓ {b}</Text>)}{t.slots?<Text className={mutedText}>{t.slots} sponsorship slots</Text>:null}</View>)}</View></Section>
 </DetailLayout>;
}
