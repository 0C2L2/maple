import {useState} from 'react';
import {Link,router,usePathname} from 'expo-router';
import {Text,View} from 'react-native';
import {useSession} from '@/providers/SessionProvider';
import {Button} from '@/components/ui/Button';
import {getMyOrganizations,getMyOrganizationMembership} from '@/features/organizations/data';
import {mutedText} from './Marketplace';
export function MarketplaceHeader(){
 const {profile}=useSession();const pathname=usePathname();const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const [orgs,setOrgs]=useState<Awaited<ReturnType<typeof getMyOrganizations>>>([]);
 if(pathname==='/login'||pathname==='/onboarding'||pathname==='/')return null;
 async function createCall(){if(busy)return;setBusy(true);setError(false);
 try{const all=await getMyOrganizations();const memberships=await Promise.all(all.map(org=>getMyOrganizationMembership(org.id)));const allowed=all.filter((_,i)=>memberships[i]?.role==='admin');setOrgs(allowed);if(allowed.length===1){setOpen(false);router.push({pathname:'/org/[slug]/calls/new',params:{slug:allowed[0].slug}});}else setOpen(true);
 }catch{setError(true);setOpen(true);}finally{setBusy(false);}}
 return <View className="border-b border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"><View className={pathname==='/explore'?'w-full max-w-[1320px] self-center gap-md px-4 py-3 md:px-6':'w-full max-w-7xl self-center gap-md px-md py-md lg:px-xl'}><View className="flex-row flex-wrap items-center justify-between gap-md">
 <Link href="/explore" accessibilityLabel="Maple marketplace" className={(pathname==='/explore'?'text-[28px]':'text-2xl')+' font-bold tracking-tight text-light-text dark:text-dark-text'}>maple<Text className="text-brand">.</Text></Link>
 <View className="flex-row items-center gap-lg">{([['/explore','Explore'],['/messages','Messages'],['/me','Profile']] as const).map(([href,label])=><Link key={href} href={href} className={'py-sm text-sm '+((pathname===href||pathname.startsWith(href+"/"))?'font-semibold text-brand':'text-light-muted dark:text-dark-muted')}>{label}</Link>)}</View>
 <View className="hidden flex-row items-center gap-md md:flex">{profile?.role==='organizer'?<Link href="/events/new" asChild><Button size="small" label="+ Create event"/></Link>:profile?.role==='sponsor'?<Button size="small" label={busy?'Opening...':'+ Create sponsor call'} disabled={busy} onPress={()=>void createCall()}/>:<Link href="/login" className={mutedText}>Sign in</Link>}
 {profile?<Link href="/me" accessibilityLabel="Your profile" className={(pathname==='/explore'?'h-10 w-10 py-[10px] text-center':'px-md py-sm')+' rounded-full bg-light-background text-sm font-semibold text-light-text dark:bg-dark-background dark:text-dark-text'}>{profile.name.trim().split(/\s+/).slice(0,2).map(x=>Array.from(x)[0]).join('')}</Link>:null}</View></View>
 <View className="md:hidden">{profile?.role==='organizer'?<Link href="/events/new" className="text-sm font-semibold text-brand">+ Create event</Link>:profile?.role==='sponsor'?<Button size="small" variant="secondary" label={busy?'Opening...':'+ Create sponsor call'} disabled={busy} onPress={()=>void createCall()}/>:null}</View>
 {open?<View className="gap-sm rounded-lg border border-light-border p-md dark:border-dark-border"><Text className={mutedText}>{error?'Unable to load organizations. Please retry.':'Choose the organization publishing this Call.'}</Text>{orgs.map(org=><Link key={org.id} href={{pathname:'/org/[slug]/calls/new',params:{slug:org.slug}}} onPress={()=>setOpen(false)} className="py-sm text-base text-light-text dark:text-dark-text">{org.name} →</Link>)}{!error&&!orgs.length?<Link href="/org/new" onPress={()=>setOpen(false)} className="text-sm font-semibold text-brand">Create an organization</Link>:null}<View className="flex-row gap-sm">{error?<Button size="small" label="Retry" onPress={()=>void createCall()}/>:null}<Button size="small" variant="secondary" label="Close" onPress={()=>setOpen(false)}/></View></View>:null}
 </View></View>;
}
