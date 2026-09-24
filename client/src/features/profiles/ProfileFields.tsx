import { Pressable, Text, TextInput, View } from 'react-native';
import { taxonomy, preferenceLabel } from '@/constants/taxonomy';
import type { Profile, ProfileFields } from './data';
import { suggestHandle } from './validation';

export const textStyle = 'text-base leading-6 text-light-text dark:text-dark-text';
const inputStyle = 'min-h-14 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-brand';
type Props = { value: ProfileFields; onChange: (next: ProfileFields) => void; disabled?: boolean };
export function IdentityFields({ value, onChange, disabled, errors = {}, suggest = false }: Props & { errors?: Partial<Record<keyof ProfileFields, string>>; suggest?: boolean }) {
  return <View className="gap-md">{(['name', 'handle', 'headline', 'location', 'bio'] as const).map((field) => {
    const label = field[0].toUpperCase() + field.slice(1);
    const error = errors[field];
    return <View key={field} className="gap-sm">
      <Text nativeID={field + '-label'} className={textStyle}>{label}{['name', 'handle', 'headline'].includes(field) ? ' *' : ' (optional)'}</Text>
      <TextInput accessibilityLabel={label} accessibilityLabelledBy={field + '-label'} accessibilityHint={error} aria-describedby={error ? field + '-error' : undefined}
        value={value[field] ?? ''} editable={!disabled} autoCapitalize={field === 'handle' ? 'none' : 'sentences'} autoCorrect={field !== 'handle'} multiline={field === 'bio'}
        maxLength={field === 'handle' ? 30 : field === 'name' ? 120 : field === 'headline' ? 200 : field === 'bio' ? 5000 : undefined}
        onChangeText={(text) => onChange({ ...value, [field]: text, ...(field === 'name' && suggest && (!value.handle || value.handle === suggestHandle(value.name)) ? { handle: suggestHandle(text) } : {}) })}
        className={inputStyle} />
      {error ? <Text nativeID={field + '-error'} accessibilityRole="alert" className="text-sm text-light-text dark:text-dark-text">{error}</Text> : null}
    </View>;
  })}</View>;
}
export function Choice({ label, selected, onPress, disabled, single = false }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; single?: boolean }) {
  return <Pressable accessibilityRole={single ? 'radio' : 'checkbox'} accessibilityLabel={label} aria-checked={selected} accessibilityState={{ checked: selected, disabled: !!disabled }} disabled={disabled} onPress={onPress}
    className={`min-h-14 flex-shrink justify-center rounded-button border px-md py-md web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-brand ${selected ? 'border-brand bg-brand' : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'}`}>
    <Text className={selected ? 'text-base font-semibold text-on-brand' : textStyle}>{selected ? '✓ ' : ''}{label}</Text>
  </Pressable>;
}
export function PreferenceFields({ value, onChange, disabled, role }: Props & { role: Profile['role'] }) {
  const keys = ['categories', 'regions', 'audience_types', role === 'organizer' ? 'audience_band' : 'gives'] as const;
  const labels = { categories: 'Categories', regions: 'Regions', audience_types: 'Audience types', audience_band: 'Typical attendance', gives: 'What you can give' };
  return <View className="gap-lg"><Text className="text-sm text-light-muted dark:text-dark-muted">Choose what fits. Preferences are optional and can be edited later.</Text>
    {keys.map((key) => <View key={key} className="gap-sm"><Text accessibilityRole="header" className={textStyle}>{labels[key]}</Text>
      <View className="flex-row flex-wrap gap-sm">{taxonomy[key].map((option) => {
        const selected = key === 'audience_band' ? value[key] === option : value[key].includes(option);
        return <Choice key={option} label={preferenceLabel(option)} selected={selected} disabled={disabled}
          onPress={() => onChange({ ...value, [key]: key === 'audience_band' ? selected ? null : option : selected ? (value[key] as string[]).filter((v) => v !== option) : [...value[key] as string[], option] })} />;
      })}</View>
    </View>)}
  </View>;
}
export function PreferenceSummary({ profile }: { profile: ProfileFields & Pick<Profile, 'role'> }) {
  const values = [
    ['Categories', profile.categories.map(preferenceLabel).join(', ')],
    ['Regions', profile.regions.map(preferenceLabel).join(', ')],
    ['Audience', profile.audience_types.map(preferenceLabel).join(', ')],
    profile.role === 'organizer' ? ['Typical attendance', profile.audience_band ? preferenceLabel(profile.audience_band) : ''] : ['What I give', profile.gives.map(preferenceLabel).join(', ')],
  ];
  return <View className="gap-sm">{values.map(([label, value]) => <Text key={label} className={textStyle}>{label}: {value || 'Not set'}</Text>)}</View>;
}
