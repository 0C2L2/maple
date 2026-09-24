import {Link} from 'expo-router';
import {Text,View} from 'react-native';
import {preferenceLabel} from '@/constants/taxonomy';
import {formatMoney} from '@/features/opportunities/money';
import {exploreMuted,focusRing} from './ExplorePresentation';
import type {OpportunityCardData} from './data';

export function OpportunityCard({item}:{item:OpportunityCardData}){
 const isPackage=item.type==='package';
 const href=isPackage?{pathname:'/events/[slug]/opportunities/[opportunitySlug]' as const,params:{slug:item.event_slug,opportunitySlug:item.slug}}:{pathname:'/org/[slug]/calls/[opportunitySlug]' as const,params:{slug:item.organization_slug,opportunitySlug:item.slug}};
 const chips=[...(item.regions||[]).map(preferenceLabel),...item.categories.map(preferenceLabel),...item.audience_types.map(preferenceLabel),...item.attendance_bands.map(value=>preferenceLabel(value)+' attendees'),...(isPackage?[item.city,preferenceLabel(item.format.replace('_','-'))]:[])].filter(Boolean);
 const initials=item.organization_name.trim().split(/\s+/).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase();
 const eventDate=isPackage?new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:item.timezone}).format(new Date(item.starts_at)):null;
 return <View testID="marketplace-listing" className="gap-6 rounded-2xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface lg:flex-row web:transition-all web:duration-200 hover:border-light-muted dark:hover:border-dark-muted web:hover:shadow-sm">
 <View className="min-w-0 flex-1 gap-3">
 <View className="flex-row flex-wrap items-center gap-3"><View className="rounded-md bg-light-background px-2 py-1 dark:bg-dark-background"><Text className="text-[11px] font-semibold tracking-wider text-light-muted dark:text-dark-muted">{isPackage?'SPONSORSHIP OPPORTUNITY':'SPONSOR CALL'}</Text></View><Text className="text-xs text-light-muted dark:text-dark-muted">{isPackage?eventDate:'Posted '+new Date(item.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</Text></View>
 <Link href={href} accessibilityLabel={'View '+item.title} className={'text-[21px] font-semibold leading-7 tracking-tight text-light-text dark:text-dark-text hover:text-brand '+focusRing}>{item.title}</Link>
 <Text className="text-sm font-medium text-light-text dark:text-dark-text">{isPackage?item.event_title+' · '+item.organization_name:item.organization_name}</Text>
 <Text numberOfLines={2} className={exploreMuted}>{item.excerpt}</Text>
 <View className="flex-row flex-wrap gap-2 pt-1">{chips.map((chip,i)=><Text key={chip+i} className="rounded-md bg-light-background px-2 py-1 text-xs text-light-muted dark:bg-dark-background dark:text-dark-muted">{chip}</Text>)}</View>
 {isPackage?<View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1 border-t border-light-border pt-3 dark:border-dark-border"><Text className="text-[15px] font-semibold text-light-text dark:text-dark-text">{item.primary_tier_name} · {item.primary_tier_in_kind?'In-kind':item.primary_tier_currency?formatMoney(item.primary_tier_price_minor,item.primary_tier_currency):'View tier'}</Text><Text className="text-xs text-light-muted dark:text-dark-muted">{item.tier_count} sponsorship {item.tier_count===1?'tier':'tiers'} · {item.has_cash_tier&&item.has_in_kind_tier?'Cash + In-kind':item.has_cash_tier?'Cash':'In-kind'}</Text></View>:null}
 </View>
 <View className="gap-5 border-t border-light-border pt-5 dark:border-dark-border lg:w-[190px] lg:justify-between lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
 <View className="flex-row items-center gap-3 lg:flex-col lg:items-start">
 <View className="h-11 w-11 items-center justify-center rounded-xl border border-light-border bg-light-background dark:border-dark-border dark:bg-dark-background"><Text className="text-sm font-semibold text-light-text dark:text-dark-text">{initials}</Text></View>
 <View className="min-w-0 flex-1 gap-1 lg:flex-none"><Text className="text-sm font-semibold leading-5 text-light-text dark:text-dark-text">{item.organization_name}</Text><Text className="text-xs leading-5 text-light-muted dark:text-dark-muted">{isPackage?'Event organizer':'Sponsor organization'}</Text>{isPackage?<><Text className="mt-2 text-xs font-medium text-light-text dark:text-dark-text">{eventDate}</Text><Text className="text-xs text-light-muted dark:text-dark-muted">{[item.city,item.country].filter(Boolean).join(', ')||preferenceLabel(item.format.replace('_','-'))}</Text></>:null}</View>
 </View>
 <Link href={href} className={'rounded-lg bg-brand px-3 py-3 text-center text-[13px] font-semibold text-on-brand hover:opacity-90 '+focusRing}>{isPackage?'View opportunity':'View call'} →</Link>
 </View>
 </View>;
}
