import {useEffect,useRef,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {Button} from '@/components/ui/Button';
import {AuthError} from '@/components/auth/AuthFrame';
import {textStyle} from '@/features/profiles/ProfileFields';
import {taxonomy,preferenceLabel} from '@/constants/taxonomy';
import {suggestSlug} from '@/features/organizations/validation';
import {budgetBands,isBudgetBand,type BudgetBand} from '@/constants/budgetBands';
import {getMyCallBudget,saveCall,type Call} from './data';
import {Choice} from './Choice';
const groups={target_categories:'categories',target_regions:'regions',target_audience_types:'audience_types',target_attendance_bands:'audience_band',gives:'gives'} as const;
type Criteria=Record<keyof typeof groups,string[]>;
const empty:Criteria={target_categories:[],target_regions:[],target_audience_types:[],target_attendance_bands:[],gives:[]};
function Field({label,value,onChange,disabled,multiline=false}:{label:string;value:string;onChange:(s:string)=>void;disabled:boolean;multiline?:boolean}){
 return <View className="gap-sm"><Text className={textStyle}>{label}</Text><TextInput accessibilityLabel={label} aria-describedby="call-form-error" value={value} onChangeText={onChange} editable={!disabled} multiline={multiline} className="min-h-14 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"/></View>;
}
// Mounted only after Sponsor admin authorization resolves; private state never enters the public page.
export function CallForm({orgId,initial,onSaved}:{orgId:string;initial?:Call;onSaved:(slug:string)=>void}){
 const [title,setTitle]=useState(initial?.title||''),[slug,setSlug]=useState(initial?.slug||''),[description,setDescription]=useState(initial?.description||'');
 const [criteria,setCriteria]=useState<Criteria>(initial?.opportunity_call_details||empty);
 const [budgetBand,setBudgetBand]=useState<BudgetBand|null>(null);
 const [loading,setLoading]=useState(!!initial),[loadError,setLoadError]=useState(false),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);const lock=useRef(false);
 useEffect(()=>{let active=true;void attempt;if(!initial)return;void getMyCallBudget(initial.id).then(b=>{if(!active)return;if(b && !isBudgetBand(b.budget_band)) throw Error('Unknown budget band');setBudgetBand(b ? b.budget_band as BudgetBand : null);setLoadError(false);setError(null);}).catch(()=>{if(active){setLoadError(true);setError('Unable to load your private budget. Retry before editing.');}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[initial,attempt]);
 async function submit(){
 if(lock.current||loading||loadError)return;setError(null);
 try{
 if(!title.trim()||title.trim().length>160)throw Error('Title must contain 1 to 160 characters.');
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||slug.length<3||slug.length>64)throw Error('URL must contain 3 to 64 lowercase letters, numbers and hyphens.');
 if(description.length>10000)throw Error('Description must be at most 10,000 characters.');
 for(const key of Object.keys(groups) as (keyof Criteria)[])if(key!=='gives'&&!criteria[key].length)throw Error('Choose at least one option for '+key.replaceAll('_',' ')+'.');
 if(budgetBand!==null&&!isBudgetBand(budgetBand))throw Error('Choose a valid budget band.');
 lock.current=true;setBusy(true);await saveCall(orgId,initial?.id,title.trim(),slug,description,criteria,budgetBand);onSaved(slug);
 }catch(e){setError(e instanceof Error?e.message:'Unable to save. Please retry.');}finally{lock.current=false;setBusy(false);}
 }
 const disabled=busy||loading||loadError;
 return <View className="gap-lg">
 <Field label="Title" value={title} disabled={disabled} onChange={s=>{setTitle(s);if(!initial&&(!slug||slug===suggestSlug(title)))setSlug(suggestSlug(s));}}/>
 {!initial?<Field label="Call URL" value={slug} disabled={disabled} onChange={setSlug}/>:null}
 <Field label="Description" value={description} disabled={disabled} onChange={setDescription} multiline/>
 {(Object.keys(groups) as (keyof Criteria)[]).map(key=><View key={key} className="gap-sm"><Text accessibilityRole="header" className={textStyle}>{key==='gives'?'What we give (optional)':key.replaceAll('_',' ')}</Text>{taxonomy[groups[key]].map(option=><Choice key={option} label={key+': '+preferenceLabel(option)} selected={criteria[key].includes(option)} disabled={disabled} onPress={()=>setCriteria({...criteria,[key]:criteria[key].includes(option)?criteria[key].filter(x=>x!==option):[...criteria[key],option]})}/>)}</View>)}
 <Text accessibilityRole="header" className={textStyle}>Budget band (optional)</Text>
 <Text className={textStyle}>Private - only Sponsor admins of your organization can see this for now.</Text>
 {loading?<Text className={textStyle}>Loading private budget...</Text>:null}
 <View className="gap-sm">{(Object.keys(budgetBands) as BudgetBand[]).map(band=><Choice key={band} single label={'Budget band: '+budgetBands[band]} selected={budgetBand===band} disabled={disabled} onPress={()=>setBudgetBand(band)}/>)}</View>
 <Button label="Clear private budget" variant="secondary" disabled={disabled} onPress={()=>setBudgetBand(null)}/>
 <View nativeID="call-form-error"><AuthError message={error}/></View>
 {loadError?<Button label="Retry private budget" onPress={()=>{setLoading(true);setAttempt(n=>n+1);}}/>:null}
 <Button label={busy?'Saving...':initial?'Save Call':'Create Call'} disabled={disabled} onPress={()=>void submit()}/>
 </View>;
}
