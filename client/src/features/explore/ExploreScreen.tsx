import {useCallback,useEffect,useRef,useState} from 'react';
import {Link} from 'expo-router';
import {ScrollView,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RequireProfile} from '@/components/auth/RequireProfile';
import {AuthError} from '@/components/auth/AuthFrame';
import {Button} from '@/components/ui/Button';
import {useSession} from '@/providers/SessionProvider';
import {textStyle} from '@/features/profiles/ProfileFields';
import {Choice} from '@/features/calls/Choice';
import {taxonomy,preferenceLabel} from '@/constants/taxonomy';
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
 const groups:{key:keyof Filters;label:string;options:readonly string[]}[]=[
 {key:'categories',label:'Categories',options:taxonomy.categories},{key:'audience_types',label:'Audience',options:taxonomy.audience_types},{key:'attendance_bands',label:'Attendance',options:taxonomy.audience_band},
 type==='package'?{key:'formats',label:'Format',options:['in_person','online','hybrid']}:{key:'regions',label:'Regions',options:taxonomy.regions}];
 return <SafeAreaView className="flex-1 bg-light-background dark:bg-dark-background"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:24}}>
 <View className="w-full max-w-5xl self-center gap-lg">
 <Link href="/me" className={textStyle}>Back to profile</Link>
 <Text accessibilityRole="header" className="text-3xl font-semibold text-light-text dark:text-dark-text">{type==='package'?'Explore Sponsorship Opportunities':'Explore Sponsor Calls'}</Text>
 <Text className={textStyle}>{type==='package'?'Find upcoming events seeking sponsorship.':'Find sponsors looking for events like yours.'}</Text>
 <View className="flex-row flex-wrap gap-sm"><Button label={open?'Hide filters':'Show filters'} variant="secondary" onPress={()=>setOpen(!open)}/><Button label="Clear filters" variant="secondary" onPress={()=>setFilters({...emptyFilters})}/><Button label="Refresh" variant="secondary" disabled={loading} onPress={()=>void fetchPage()}/></View>
 {open?<View className="gap-md rounded-card border border-light-border p-md dark:border-dark-border">{groups.map(group=><View key={group.key} className="gap-sm"><Text accessibilityRole="header" className={textStyle}>{group.label}</Text><View className="flex-row flex-wrap gap-sm">{group.options.map(value=><Choice key={value} label={group.label+': '+preferenceLabel(value.replace('_','-'))} selected={filters[group.key].includes(value)} onPress={()=>setFilters(old=>({...old,[group.key]:old[group.key].includes(value)?old[group.key].filter(x=>x!==value):[...old[group.key],value]}))}/>)}</View></View>)}</View>:null}
 <AuthError message={error}/>{error?<Button label="Retry" onPress={()=>void fetchPage(failedMore.current)}/>:null}
 {loading?<Text accessibilityLiveRegion="polite" className={textStyle}>Loading opportunities...</Text>:null}
 {!loading&&!error&&!rows.length?<Text className={textStyle}>{type==='package'?'No sponsorship opportunities match these filters.':'No sponsor calls match these filters.'}</Text>:null}
 {rows.map(item=><OpportunityCard key={item.opportunity_id} item={item}/>)}
 {more&&!error?<Button label={loading?'Loading more...':'Load more'} disabled={loading} onPress={()=>void fetchPage(true)}/>:null}
 </View></ScrollView></SafeAreaView>;
}
