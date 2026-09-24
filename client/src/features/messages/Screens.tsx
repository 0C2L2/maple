import {useCallback,useRef,useState} from 'react';
import {Link,useFocusEffect,useLocalSearchParams} from 'expo-router';
import {Text,TextInput,View} from 'react-native';
import {RequireProfile} from '@/components/auth/RequireProfile';
import {AuthError,AuthFrame} from '@/components/auth/AuthFrame';
import {Button} from '@/components/ui/Button';
import {textStyle} from '@/features/profiles/ProfileFields';
import {useSession} from '@/providers/SessionProvider';
import {getThread,listMessages,listThreads,sendMessage,type Message,type Thread} from './data';
export function InboxScreen(){return <RequireProfile><Inbox/></RequireProfile>;}
function Inbox(){
 const {profile}=useSession();const [rows,setRows]=useState<Thread[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[more,setMore]=useState(false);
 const lock=useRef(false);const version=useRef(0);
 const load=useCallback(async(offset=0)=>{
 if(lock.current)return;lock.current=true;const request=++version.current;setLoading(true);setError(null);
 try{const data=await listThreads(offset);if(request===version.current){setRows(old=>offset?[...old,...data.filter(x=>!old.some(y=>y.id===x.id))]:data);setMore(data.length===20);}}
 catch(e){if(request===version.current)setError(e instanceof Error?e.message:'Unable to load conversations.');}
 finally{if(request===version.current){lock.current=false;setLoading(false);}}
 },[]);
 useFocusEffect(useCallback(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void load();});return()=>{active=false;version.current++;lock.current=false;};},[load]));
 return <AuthFrame title="Messages"><Link href="/me" className={textStyle}>Back to profile</Link>
 <Button label="Refresh conversations" disabled={loading} onPress={()=>void load()}/><AuthError message={error}/>
 {error?<Button label="Retry" onPress={()=>void load()}/>:null}
 {loading?<Text className={textStyle}>Loading conversations...</Text>:!rows.length&&!error?<Text className={textStyle}>No conversations yet. Open a conversation after sending a Quick Pitch.</Text>:null}
 {rows.map(row=><View key={row.id} className="gap-sm rounded-card border border-light-border p-md dark:border-dark-border">
 <Link href={{pathname:'/messages/[threadId]',params:{threadId:row.id}}} className={textStyle}>{row.opportunities?.title||'Opportunity conversation'}</Link>
 <Text className={textStyle}>{row.from_id===profile!.id?row.owner?.name:row.sender?.name} · {row.opportunities?.organizations?.name||'Organization'}</Text>
 <Text className={textStyle}>Started {new Date(row.created_at).toLocaleString()}</Text></View>)}
 {more?<Button label="Load more conversations" disabled={loading} onPress={()=>void load(rows.length)}/>:null}</AuthFrame>;
}
export function ConversationScreen(){return <RequireProfile><Conversation/></RequireProfile>;}
function Conversation(){
 const {threadId}=useLocalSearchParams<{threadId:string}>();const {profile}=useSession();
 const [thread,setThread]=useState<Thread|null>(null),[rows,setRows]=useState<Message[]>([]),[body,setBody]=useState('');
 const [loading,setLoading]=useState(true),[sending,setSending]=useState(false),[more,setMore]=useState(false),[error,setError]=useState<string|null>(null);
 const sendLock=useRef(false),loadLock=useRef(false),version=useRef(0);
 const load=useCallback(async(offset=0)=>{
 if(loadLock.current)return;loadLock.current=true;const request=++version.current;setLoading(true);setError(null);
 try{const [context,data]=await Promise.all([getThread(threadId),listMessages(threadId,offset)]);
 if(request===version.current){setThread(context);setRows(old=>offset?[...old,...data.filter(x=>!old.some(y=>y.id===x.id))]:data);setMore(data.length===50);}}
 catch(e){if(request===version.current)setError(e instanceof Error?e.message:'Unable to load messages.');}
 finally{if(request===version.current){loadLock.current=false;setLoading(false);}}
 },[threadId]);
 useFocusEffect(useCallback(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void load();});return()=>{active=false;version.current++;loadLock.current=false;};},[load]));
 async function send(){if(sendLock.current)return;sendLock.current=true;setSending(true);setError(null);
 try{await sendMessage(threadId,profile!.id,body);setBody('');await load();}
 catch(e){setError(e instanceof Error?e.message:'Unable to send. Please retry.');}
 finally{sendLock.current=false;setSending(false);}
 }
 const opportunity=thread?.opportunities;
 const href=opportunity?.type==='package'&&opportunity.events?{pathname:'/events/[slug]/opportunities/[opportunitySlug]' as const,params:{slug:opportunity.events.slug,opportunitySlug:opportunity.slug}}:opportunity?.type==='call'&&opportunity.organizations?{pathname:'/org/[slug]/calls/[opportunitySlug]' as const,params:{slug:opportunity.organizations.slug,opportunitySlug:opportunity.slug}}:null;
 const count=Array.from(body.trim()).length;
 return <AuthFrame title="Conversation"><Link href="/messages" className={textStyle}>All conversations</Link>
 {href?<Link href={href} className={textStyle}>{opportunity!.title}</Link>:null}
 <Button label="Refresh messages" disabled={loading||sending} onPress={()=>void load()}/><AuthError message={error}/>
 {error?<Button label="Retry loading" disabled={loading} onPress={()=>void load()}/>:null}
 {loading?<Text className={textStyle}>Loading messages...</Text>:!thread&&!error?<Text className={textStyle}>Conversation unavailable.</Text>:null}
 {thread?<><Text className={textStyle}>With {thread.from_id===profile!.id?thread.owner?.name:thread.sender?.name}</Text>
 {!loading&&!rows.length?<Text className={textStyle}>Start the conversation.</Text>:null}
 {more?<Button label="Load older messages" disabled={loading||sending} onPress={()=>void load(rows.length)}/>:null}
 {[...rows].reverse().map(message=><View key={message.id} className="gap-sm rounded-card border border-light-border p-md dark:border-dark-border">
 <Text className="text-sm text-light-muted dark:text-dark-muted">{message.sender_id===profile!.id?'You':message.sender_id===thread.from_id?thread.sender?.name:thread.owner?.name} · {new Date(message.created_at).toLocaleString()}</Text>
 <Text className={textStyle+' web:break-all'}>{message.body}</Text></View>)}
 <TextInput accessibilityLabel="Message" aria-describedby="message-count" multiline value={body} onChangeText={setBody} editable={!sending} className="min-h-28 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"/>
 <Text nativeID="message-count" className={textStyle}>{count}/2,000 characters</Text>
 <Button label={sending?'Sending...':'Send message'} disabled={sending||loading||count===0||count>2000} onPress={()=>void send()}/></>:null}
 </AuthFrame>;
}
