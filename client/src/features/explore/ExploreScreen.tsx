import {useCallback,useEffect,useRef,useState} from 'react';
import {CategoryStrip,FilterPanel,ListingSkeleton,exploreMuted,focusRing,type FilterGroup} from './ExplorePresentation';
import {Pressable,ScrollView,Text,View} from 'react-native';

import {RequireProfile} from '@/components/auth/RequireProfile';
import {AuthError} from '@/components/auth/AuthFrame';
import {Button} from '@/components/ui/Button';
import {useSession} from '@/providers/SessionProvider';


import {taxonomy} from '@/constants/taxonomy';
import {emptyFilters,loadOpportunities,type Filters,type OpportunityCardData} from './data';
import {OpportunityCard} from './OpportunityCard';
export function ExploreScreen(){return <RequireProfile><Explore/></RequireProfile>;}
function Explore(){
 const {profile}=useSession();const type=profile!.role==='sponsor'?'package':'call';
 const [filters,setFilters]=useState<Filters>(emptyFilters),[open,setOpen]=useState(false);
 const [rows,setRows]=useState<OpportunityCardData[]>([]),[loading,setLoading]=useState(true),[more,setMore]=useState(false),[error,setError]=useState<string|null>(null);
 const generation=useRef(0),lock=useRef(false),offset=useRef(0),failedMore=useRef(false);
 const fetchPage=useCallback(async(append=false)=>{
  if(append&&lock.current)return;
  const id=++generation.current;lock.current=true;setLoading(true);setError(null);failedMore.current=append;
  if(!append){setRows([]);offset.current=0;}
  try{const data=await loadOpportunities(type,filters,append?offset.current:0);if(id!==generation.current)return;
   setRows(old=>append?[...old,...data.filter(x=>!old.some(y=>y.opportunity_id===x.opportunity_id))]:data);offset.current+=data.length;setMore(data.length===20);
  }catch(e){if(id===generation.current)setError(e instanceof Error?e.message:'Unable to load opportunities. Please retry.');}
  finally{if(id===generation.current){lock.current=false;setLoading(false);}}
 },[type,filters]);
 useEffect(()=>{let active=true;const request=generation;const busy=lock;void Promise.resolve().then(()=>{if(active)void fetchPage();});return()=>{active=false;request.current++;busy.current=false;};},[fetchPage]);
 const groups:FilterGroup[]=[
 {key:'categories',label:'Categories',options:taxonomy.categories},
 ...(type==='call'?[{key:'regions' as const,label:'Regions',options:taxonomy.regions}]:[]),
 {key:'audience_types',label:'Audience',options:taxonomy.audience_types},
 {key:'attendance_bands',label:'Attendance',options:taxonomy.audience_band},
 ...(type==='package'?[{key:'formats' as const,label:'Format',options:['in_person','online','hybrid']}]:[])];
 const selectedCount=Object.values(filters).reduce((sum,values)=>sum+values.length,0);
 const toggle=(key:keyof Filters,value:string)=>setFilters(old=>({...old,[key]:old[key].includes(value)?old[key].filter(x=>x!==value):[...old[key],value]}));
 const clear=()=>setFilters({...emptyFilters});
 return <ScrollView className="flex-1 bg-light-background dark:bg-dark-background" keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1}}>
 <View className="w-full max-w-[1320px] self-center gap-6 px-4 pb-12 pt-7 md:px-6 lg:pt-9">
 <View className="gap-2"><Text accessibilityRole="header" className="text-[30px] font-semibold leading-tight tracking-tight text-light-text dark:text-dark-text md:text-[36px]">{type==='package'?'Explore Sponsorship Opportunities':'Explore Sponsor Calls'}</Text><Text className="text-[15px] leading-6 text-light-muted dark:text-dark-muted">{type==='package'?'Discover events currently looking for sponsorship partners.':'Find companies actively looking to sponsor events like yours.'}</Text></View>
 <CategoryStrip selected={filters.categories} onToggle={value=>toggle('categories',value)}/>
 <View className="flex-row flex-wrap items-center justify-between gap-3 border-b border-light-border pb-4 dark:border-dark-border">
 <View className="flex-row items-center gap-3"><Text accessibilityRole="header" className="text-base font-semibold text-light-text dark:text-dark-text">{selectedCount?'Filtered opportunities':'All opportunities'}</Text><Text accessibilityLiveRegion="polite" className="rounded-full border border-light-border px-2 py-1 text-xs text-light-muted dark:border-dark-border dark:text-dark-muted">{loading?'Loading':rows.length+(more?'+':'')+' loaded'}</Text></View>
 <View className="flex-row items-center gap-4"><View className="lg:hidden"><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} className={'min-h-11 flex-row items-center justify-center rounded-lg border border-light-border bg-light-surface px-4 dark:border-dark-border dark:bg-dark-surface '+focusRing}><Text className="text-sm font-semibold text-light-text dark:text-dark-text">{open?'Close filters':'Filters'}{selectedCount?' ('+selectedCount+')':''}</Text></Pressable></View><Text className="text-xs text-light-muted dark:text-dark-muted">Sort: <Text className="font-medium text-light-text dark:text-dark-text">{type==='package'?'Upcoming first':'Most recent'}</Text></Text>{selectedCount?<Pressable accessibilityRole="button" accessibilityLabel="Clear filters" onPress={clear} className={'min-h-11 justify-center '+focusRing}><Text className="text-xs font-semibold text-brand">Clear filters</Text></Pressable>:null}</View>
 </View>
 <View className="flex-col items-start gap-6 lg:flex-row lg:gap-7">
 <View testID="explore-filters" className={(open?'flex':'hidden')+' w-full lg:flex lg:w-[248px]'}><FilterPanel groups={groups} filters={filters} onToggle={toggle} onClear={clear}/></View>
 <View className="w-full min-w-0 gap-4 lg:flex-1">
 <AuthError message={error}/>{error?<Button size="small" label="Retry" onPress={()=>void fetchPage(failedMore.current)}/>:null}
 {loading&&!rows.length?<><ListingSkeleton/><ListingSkeleton/></>:null}
 {!loading&&!error&&!rows.length?<View className="items-start gap-3 rounded-2xl border border-light-border bg-light-surface p-8 dark:border-dark-border dark:bg-dark-surface"><Text accessibilityRole="header" className="text-xl font-semibold text-light-text dark:text-dark-text">{type==='package'?'No sponsorship opportunities match your filters.':'No sponsor calls match your filters.'}</Text><Text className={exploreMuted}>Try another category, audience or attendance size to explore more partnerships.</Text><Pressable accessibilityRole="button" onPress={clear} className={'mt-2 min-h-11 justify-center rounded-lg bg-brand px-4 '+focusRing}><Text className="text-sm font-semibold text-on-brand">Clear filters</Text></Pressable></View>:null}
 {rows.map(item=><OpportunityCard key={item.opportunity_id} item={item}/>)}
 {more&&!error?<View className="items-center py-3"><Button size="small" variant="secondary" label={loading?'Loading more...':'Load more'} disabled={loading} onPress={()=>void fetchPage(true)}/></View>:null}
 </View></View></View></ScrollView>;
}
