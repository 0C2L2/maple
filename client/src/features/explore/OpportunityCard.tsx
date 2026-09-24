import {Link} from 'expo-router';
import {Text,View} from 'react-native';
import {textStyle} from '@/features/profiles/ProfileFields';
import {preferenceLabel} from '@/constants/taxonomy';
import {displayDate} from '@/features/events/dates';
import {formatMoney} from '@/features/opportunities/money';
import type {OpportunityCardData} from './data';
export function OpportunityCard({item}:{item:OpportunityCardData}){
 const href=item.type==='package'?{pathname:'/events/[slug]/opportunities/[opportunitySlug]' as const,params:{slug:item.event_slug,opportunitySlug:item.slug}}:{pathname:'/org/[slug]/calls/[opportunitySlug]' as const,params:{slug:item.organization_slug,opportunitySlug:item.slug}};
 return <View className="gap-sm rounded-card border border-light-border bg-light-surface p-lg dark:border-dark-border dark:bg-dark-surface">
 <Text className="text-sm font-semibold text-light-muted dark:text-dark-muted">{item.type==='package'?'Sponsorship package':'Sponsor Call'}</Text>
 <Link href={href} accessibilityLabel={'View '+item.title} className="text-xl font-semibold text-light-text dark:text-dark-text">{item.title}</Link>
 <Text className={textStyle}>{item.organization_name}</Text>
 <Text className={textStyle}>{item.excerpt}</Text>
 {item.type==='package'?<>
 <Text className={textStyle}>{item.event_title}</Text>
 <Text className={textStyle}>{displayDate(item.starts_at,item.timezone)} · {item.timezone}</Text>
 <Text className={textStyle}>{preferenceLabel(item.format)} · {[item.city,item.country].filter(Boolean).join(', ')||'Online'}</Text>
 <Text className={textStyle}>{item.primary_tier_name}: {item.primary_tier_in_kind?'In-kind':item.primary_tier_currency?formatMoney(item.primary_tier_price_minor,item.primary_tier_currency):'Details available'}</Text>
 <Text className={textStyle}>{item.tier_count} sponsorship {item.tier_count===1?'tier':'tiers'} · {item.has_cash_tier&&item.has_in_kind_tier?'Cash + In-kind':item.has_cash_tier?'Cash':'In-kind'}</Text>
 </>:<Text className={textStyle}>Regions: {(item.regions||[]).map(preferenceLabel).join(', ')}</Text>}
 <Text className={textStyle}>Categories: {item.categories.map(preferenceLabel).join(', ')}</Text>
 <Text className={textStyle}>Audience: {item.audience_types.map(preferenceLabel).join(', ')}</Text>
 <Text className={textStyle}>Attendance: {item.attendance_bands.map(preferenceLabel).join(', ')}</Text>
 </View>;
}
