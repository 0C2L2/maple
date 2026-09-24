import {Pressable,ScrollView,Text,View} from 'react-native';
import {taxonomy,preferenceLabel} from '@/constants/taxonomy';
import type {Filters} from './data';
import {FilterOption} from './FilterOption';

export const exploreMuted='text-sm leading-5 text-light-muted dark:text-dark-muted';
export const focusRing='web:cursor-pointer web:transition-colors web:duration-150 web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand';
const categoryMarks=['</>','◫','◎','↗','✳'];
export function CategoryStrip({selected,onToggle}:{selected:string[];onToggle:(value:string)=>void}){
 return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={{gap:12,flexGrow:1}}>{taxonomy.categories.map((value,i)=><Pressable key={value} accessibilityRole="button" accessibilityLabel={'Browse '+preferenceLabel(value)} accessibilityState={{selected:selected.includes(value)}} onPress={()=>onToggle(value)} className={'min-h-[88px] w-[184px] flex-row items-center gap-3 rounded-2xl border bg-light-surface px-4 py-4 dark:bg-dark-surface md:min-w-0 md:w-auto md:flex-1 '+focusRing+' '+(selected.includes(value)?'border-brand':'border-light-border hover:border-light-muted dark:border-dark-border dark:hover:border-dark-muted')}>
 <View className={'h-10 w-10 items-center justify-center rounded-xl '+(selected.includes(value)?'bg-brand/10':'bg-light-background dark:bg-dark-background')}><Text className={'text-xl font-medium '+(selected.includes(value)?'text-brand':'text-light-text dark:text-dark-text')}>{categoryMarks[i]}</Text></View>
 <View className="min-w-0 flex-1 gap-1"><Text className="text-sm font-semibold text-light-text dark:text-dark-text">{preferenceLabel(value)}</Text><Text className="text-xs text-light-muted dark:text-dark-muted">{selected.includes(value)?'Selected':'Explore category'}</Text></View>
 </Pressable>)}</ScrollView>;
}
export type FilterGroup={key:keyof Filters;label:string;options:readonly string[]};
export function FilterPanel({groups,filters,onToggle,onClear}:{groups:FilterGroup[];filters:Filters;onToggle:(key:keyof Filters,value:string)=>void;onClear:()=>void}){
 const count=Object.values(filters).reduce((sum,values)=>sum+values.length,0);
 return <View className="gap-5 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
 <View className="flex-row items-center justify-between"><Text accessibilityRole="header" className="text-base font-semibold text-light-text dark:text-dark-text">Filter opportunities</Text>{count>0?<Text className="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">{count}</Text>:null}</View>
 {groups.map(group=><View key={group.key} className="gap-2 border-t border-light-border pt-4 dark:border-dark-border"><Text accessibilityRole="header" className="px-2 text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted">{group.label}</Text>{group.options.map(value=><FilterOption key={value} group={group.label} label={preferenceLabel(value.replace('_','-'))} selected={filters[group.key].includes(value)} onPress={()=>onToggle(group.key,value)}/>)}</View>)}
 <Pressable accessibilityRole="button" onPress={onClear} className={'min-h-11 items-center justify-center rounded-lg border border-light-border dark:border-dark-border hover:bg-light-background dark:hover:bg-dark-background '+focusRing}><Text className="text-sm font-semibold text-light-text dark:text-dark-text">Clear all</Text></Pressable>
 </View>;
}
export function ListingSkeleton(){return <View accessibilityLabel="Loading opportunities" accessibilityRole="progressbar" className="gap-5 rounded-2xl border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface"><View className="h-4 w-40 rounded bg-light-background dark:bg-dark-background"/><View className="h-7 w-4/5 rounded bg-light-background dark:bg-dark-background"/><View className="h-4 w-full rounded bg-light-background dark:bg-dark-background"/><View className="h-4 w-3/4 rounded bg-light-background dark:bg-dark-background"/><View className="flex-row gap-2">{[0,1,2].map(i=><View key={i} className="h-7 w-20 rounded bg-light-background dark:bg-dark-background"/>)}</View></View>;}
