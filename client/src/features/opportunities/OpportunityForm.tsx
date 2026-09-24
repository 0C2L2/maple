import { Choice } from './Choice';
import { useRef,useState } from 'react';
import { Text,TextInput,View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AuthError } from '@/components/auth/AuthFrame';
import { textStyle } from '@/features/profiles/ProfileFields';
import { suggestSlug } from '@/features/organizations/validation';
import { amountFromMinor,parseMoney,currencies } from './money';
import { saveOpportunity,type Package } from './data';
type DraftTier={id?:string;name:string;in_kind:boolean;amount:string;currency:string;benefits:string[];slots:string};
const emptyTier=():DraftTier=>({name:'',in_kind:false,amount:'',currency:'USD',benefits:[''],slots:''});
const inputStyle='min-h-14 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text';
function Field({label,value,onChange,multiline=false,disabled=false}:{label:string;value:string;onChange:(s:string)=>void;multiline?:boolean;disabled?:boolean}) {
 return <View className="gap-sm"><Text className={textStyle}>{label}</Text><TextInput accessibilityLabel={label} aria-describedby="opportunity-form-error" value={value} onChangeText={onChange} multiline={multiline} editable={!disabled} className={inputStyle}/></View>;
}
export function OpportunityForm({eventId,initial,onSaved}:{eventId:string;initial?:Package;onSaved:(slug:string)=>void}) {
 const [title,setTitle]=useState(initial?.title||''),[slug,setSlug]=useState(initial?.slug||''),[description,setDescription]=useState(initial?.description||'');
 const [tiers,setTiers]=useState<DraftTier[]>(initial ? [...initial.opportunity_tiers].sort((a,b)=>a.sort_order-b.sort_order).map(t=>({id:t.id,name:t.name,in_kind:t.in_kind,amount:t.price_minor&&t.currency?amountFromMinor(t.price_minor,t.currency):'',currency:t.currency||'USD',benefits:t.benefits,slots:t.slots?.toString()||''})):[emptyTier()]);
 const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false); const lock=useRef(false);
 const update=(index:number,patch:Partial<DraftTier>)=>setTiers(current=>current.map((t,i)=>i===index?{...t,...patch}:t));
 async function save() {
 if(lock.current)return; setError(null);
 try {
 if(!title.trim()||title.trim().length>160)throw Error('Title must contain 1 to 160 characters.');
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||slug.length<3||slug.length>64)throw Error('URL must contain 3 to 64 lowercase letters, numbers and hyphens.');
 if(description.length>10000)throw Error('Description must be at most 10,000 characters.');
 if(!tiers.length||tiers.length>20)throw Error('Add 1 to 20 tiers.');
 const payload=tiers.map((t,index)=>{
 if(!t.name.trim()||t.name.trim().length>120)throw Error('Tier '+(index+1)+': enter a name of 1 to 120 characters.');
 const benefits=t.benefits.map(b=>b.trim()).filter(Boolean);
 if(!benefits.length||benefits.length>30||benefits.some(b=>b.length>500))throw Error('Tier '+(index+1)+': add 1 to 30 benefits, each at most 500 characters.');
 if(t.slots && (!/^[1-9]\d*$/.test(t.slots)||Number(t.slots)>2147483647))throw Error('Tier '+(index+1)+': slots must be a positive whole number.');
 return {...(t.id?{id:t.id}:{}),name:t.name.trim(),in_kind:t.in_kind,price_minor:t.in_kind?null:parseMoney(t.amount,t.currency),currency:t.in_kind?null:t.currency,benefits,slots:t.slots?Number(t.slots):null};
 });
 lock.current=true;setBusy(true);
 await saveOpportunity(eventId,initial?.id,title.trim(),slug,description,payload);onSaved(slug);
 }catch(e){setError(e instanceof Error?e.message:'Unable to save. Please retry.');}
 finally{lock.current=false;setBusy(false);}
 }
 return <View className="gap-lg">
 <Field label="Title" value={title} disabled={busy} onChange={s=>{setTitle(s);if(!initial&&(!slug||slug===suggestSlug(title)))setSlug(suggestSlug(s));}}/>
 {!initial?<Field label="Opportunity URL" value={slug} disabled={busy} onChange={setSlug}/>:null}
 <Field label="Description" value={description} disabled={busy} onChange={setDescription} multiline/>
 {tiers.map((t,i)=><View key={t.id||i} className="gap-md rounded-card border border-light-border p-md dark:border-dark-border">
 <Text accessibilityRole="header" className={textStyle}>Tier {i+1}</Text>
 <Field label={'Tier '+(i+1)+' name'} value={t.name} disabled={busy} onChange={name=>update(i,{name})}/>
 <Choice single label={'Tier '+(i+1)+' Cash'} selected={!t.in_kind} disabled={busy} onPress={()=>update(i,{in_kind:false})}/>
 <Choice single label={'Tier '+(i+1)+' In-kind'} selected={t.in_kind} disabled={busy} onPress={()=>update(i,{in_kind:true,amount:''})}/>
 {!t.in_kind?<><Field label={'Tier '+(i+1)+' amount'} value={t.amount} disabled={busy} onChange={amount=>update(i,{amount})}/><Text className={textStyle}>Currency</Text><View className="flex-row flex-wrap gap-sm">{currencies.map(currency=><Choice key={currency} single label={'Tier '+(i+1)+' '+currency} selected={t.currency===currency} disabled={busy} onPress={()=>update(i,{currency,amount:''})}/>)}</View></>:<Text className={textStyle}>In-kind: no cash price applies.</Text>}
 {t.benefits.map((benefit,b)=><View className="gap-sm" key={b}><Field label={'Tier '+(i+1)+' benefit '+(b+1)} value={benefit} disabled={busy} onChange={s=>update(i,{benefits:t.benefits.map((x,j)=>j===b?s:x)})}/><Button label={'Remove benefit '+(b+1)+' from tier '+(i+1)} disabled={busy} onPress={()=>update(i,{benefits:t.benefits.filter((_,j)=>j!==b)})}/></View>)}
 <Button label={'Add benefit to tier '+(i+1)} disabled={busy||t.benefits.length>=30} onPress={()=>update(i,{benefits:[...t.benefits,'']})}/>
 <Field label={'Tier '+(i+1)+' slots (optional)'} value={t.slots} disabled={busy} onChange={slots=>update(i,{slots})}/>
 <Button label={'Remove tier '+(i+1)} disabled={busy} onPress={()=>setTiers(tiers.filter((_,j)=>j!==i))}/>
 </View>)}
 <Button label="Add tier" disabled={busy||tiers.length>=20} onPress={()=>setTiers([...tiers,emptyTier()])}/>
 <View nativeID="opportunity-form-error"><AuthError message={error}/></View><Button label={busy?'Saving...':initial?'Save opportunity':'Create opportunity'} disabled={busy} onPress={()=>void save()}/>
 </View>;
}
