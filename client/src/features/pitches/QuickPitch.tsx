import {useCallback,useRef,useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {Text,TextInput,View} from 'react-native';
import {useSession} from '@/providers/SessionProvider';
import {Button} from '@/components/ui/Button';
import {AuthError} from '@/components/auth/AuthFrame';
import {textStyle} from '@/features/profiles/ProfileFields';
import {getPitchState,sendPitch} from './data';
type Props={opportunityId:string;ownerOrgId:string;type:'package'|'call';published:boolean};
export function QuickPitch(props:Props){
 const {profile}=useSession();
 if(!profile||!props.published||profile.role!==(props.type==='package'?'sponsor':'organizer'))return null;
 return <PitchForm key={props.opportunityId+profile.id} {...props} fromId={profile.id}/>;
}
function PitchForm({opportunityId,ownerOrgId,fromId}:Props&{fromId:string}){
 const [state,setState]=useState<{ownSide:boolean;sent:boolean}|null>(null);
 const [open,setOpen]=useState(false),[note,setNote]=useState(''),[error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[attempt,setAttempt]=useState(0),[duplicate,setDuplicate]=useState(false);
 const lock=useRef(false);
 useFocusEffect(useCallback(()=>{let active=true;void attempt;
 void Promise.resolve().then(async()=>{if(!active)return;setState(null);setError(null);
 try{const data=await getPitchState(opportunityId,ownerOrgId,fromId);if(active)setState(data);}
 catch(e){if(active)setError(e instanceof Error?e.message:'Unable to check pitch availability.');}
 });return()=>{active=false;};},[opportunityId,ownerOrgId,fromId,attempt]));
 async function submit(){
 if(lock.current)return;
 setError(null);lock.current=true;setBusy(true);
 try{const result=await sendPitch(opportunityId,fromId,note);setDuplicate(result==='already-sent');setState({ownSide:false,sent:true});setOpen(false);setNote('');}
 catch(e){setError(e instanceof Error?e.message:'Unable to send your pitch. Please retry.');}
 finally{lock.current=false;setBusy(false);}
 }
 if(state?.ownSide)return null;
 if(state?.sent)return <Text accessibilityLiveRegion="polite" className={textStyle}>{duplicate?'You already sent a pitch for this opportunity.':'Pitch sent'}</Text>;
 if(!state)return <View className="gap-sm"><AuthError message={error}/>{error?<Button label="Retry pitch availability" onPress={()=>setAttempt(n=>n+1)}/>:<Text className={textStyle}>Checking pitch availability...</Text>}</View>;
 if(!open)return <Button label="Quick Pitch" onPress={()=>setOpen(true)}/>;
 const count=Array.from(note.trim()).length;
 return <View className="gap-md rounded-card border border-light-border p-md dark:border-dark-border">
 <Text accessibilityRole="header" className="text-xl font-semibold text-light-text dark:text-dark-text">Quick Pitch</Text>
 <Text className={textStyle}>Optional note · maximum 300 characters</Text>
 <TextInput accessibilityLabel="Optional note" aria-describedby="pitch-note-count" value={note} onChangeText={setNote} multiline editable={!busy} className="min-h-28 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"/>
 <Text nativeID="pitch-note-count" className={textStyle}>{count}/300 characters{count>300?' · Shorten your note to send.':''}</Text>
 <AuthError message={error}/>
 <Button label={busy?'Sending...':'Send pitch'} disabled={busy||count>300} onPress={()=>void submit()}/>
 <Button label="Cancel" variant="secondary" disabled={busy} onPress={()=>{setOpen(false);setNote('');setError(null);}}/>
 </View>;
}
