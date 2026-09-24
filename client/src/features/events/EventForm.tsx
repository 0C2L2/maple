import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AuthError } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { Choice, textStyle } from '@/features/profiles/ProfileFields';
import { taxonomy, preferenceLabel } from '@/constants/taxonomy';
import { suggestSlug } from '@/features/organizations/validation';
import { DateTimeField } from './DateTimeField';
import { instantToWall, timezoneOptions, wallToInstant } from './dates';
import { formats, validateEvent, type EventInput } from './validation';
import type { AdminOrganization } from './data';
const inputStyle = 'min-h-14 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text';
export function EventForm({ initial, organizations = [], editing = false, onSave }: {
  initial: EventInput; organizations?: AdminOrganization[]; editing?: boolean; onSave: (value: EventInput) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateEvent>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [zoneQuery, setZoneQuery] = useState('');
  const [zones] = useState(timezoneOptions);
  const set = <K extends keyof EventInput>(field: K, next: EventInput[K]) => setValue(current => ({ ...current, [field]: next }));
  function chooseZone(zone: string) {
    try {
      const convert = (wall: string) => wall ? instantToWall(wallToInstant(wall, value.timezone), zone) : '';
      setValue({ ...value, timezone: zone, starts_at: convert(value.starts_at), ends_at: convert(value.ends_at) });
      setZoneQuery(''); setError(null);
    } catch { setError('Correct the current dates before changing timezone. The selected times have not changed.'); }
  }
  async function submit() {
    if (lock.current) return;
    const next = validateEvent(value, editing); setErrors(next);
    if (Object.keys(next).length) return;
    lock.current = true; setBusy(true); setError(null);
    try { await onSave(value); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save. Please retry.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function field(name: 'title' | 'slug' | 'description' | 'venue_name' | 'city' | 'country' | 'website', label: string, maxLength: number) {
    return <View key={name} className="gap-sm">
      <Text nativeID={'event-' + name} className={textStyle}>{label}</Text>
      <TextInput accessibilityLabel={label} accessibilityLabelledBy={'event-' + name}
        aria-describedby={errors[name] ? name + '-error' : undefined} accessibilityHint={errors[name]}
        value={value[name]} editable={!busy} maxLength={maxLength} multiline={name === 'description'}
        autoCapitalize={name === 'slug' || name === 'website' ? 'none' : 'sentences'}
        onChangeText={text => setValue(current => ({ ...current, [name]: text,
          ...(name === 'title' && !editing && (!current.slug || current.slug === suggestSlug(current.title)) ? { slug: suggestSlug(text) } : {}) }))}
        className={inputStyle} />
      {errors[name] ? <Text nativeID={name + '-error'} accessibilityRole="alert" className={textStyle}>{errors[name]}</Text> : null}
    </View>;
  }
  return <View className="gap-lg">
    <Text accessibilityRole="header" className={textStyle}>Basics</Text>
    {field('title', 'Title *', 160)}
    {!editing ? <>
      {field('slug', 'Event URL *', 64)}
      <Text accessibilityRole="header" className={textStyle}>Organization *</Text>
      {organizations.map(org => <Choice key={org.id} single label={org.name} selected={value.org_id === org.id} disabled={busy} onPress={() => set('org_id', org.id)} />)}
      <AuthError message={errors.org_id || null} />
    </> : null}
    {field('description', 'Description (optional)', 10000)}
    <Text accessibilityRole="header" className={textStyle}>Schedule</Text>
    <DateTimeField id="event-start" label="Start" value={value.starts_at} onChange={next => set('starts_at', next)} disabled={busy} error={errors.starts_at} />
    <DateTimeField id="event-end" label="End" value={value.ends_at} onChange={next => set('ends_at', next)} disabled={busy} error={errors.ends_at} />
    <Text className={textStyle}>Timezone: {value.timezone}</Text>
    <Text className={textStyle}>Dates use this timezone. Changing it preserves entered instants and updates the displayed times.</Text>
    <TextInput accessibilityLabel="Find timezone" placeholder="Find timezone, e.g. Asia/Seoul" value={zoneQuery}
      onChangeText={setZoneQuery} editable={!busy} autoCapitalize="none" className={inputStyle} />
    {zones.filter(zone => zone.toLowerCase().includes(zoneQuery.toLowerCase())).slice(0, 8).map(zone =>
      <Choice key={zone} single label={zone} selected={zone === value.timezone} disabled={busy} onPress={() => chooseZone(zone)} />)}
    <AuthError message={errors.timezone || null} />
    <Text accessibilityRole="header" className={textStyle}>Format and location</Text>
    {Object.entries(formats).map(([format, label]) => <Choice key={format} single label={label} selected={value.format === format} disabled={busy} onPress={() => set('format', format as EventInput['format'])} />)}
    <AuthError message={errors.format || null} />
    {field('venue_name', 'Venue (optional)', 200)}
    {field('city', value.format === 'online' ? 'City (optional)' : 'City *', 120)}
    {field('country', value.format === 'online' ? 'Country (optional)' : 'Country *', 120)}
    {field('website', 'Website (optional)', 2048)}
    <Text accessibilityRole="header" className={textStyle}>Audience</Text>
    {(['categories', 'audience_types', 'attendance_band'] as const).map(key => <View key={key} className="gap-sm">
      <Text accessibilityRole="header" className={textStyle}>{key === 'categories' ? 'Categories *' : key === 'audience_types' ? 'Audience types *' : 'Attendance band *'}</Text>
      <View className="flex-row flex-wrap gap-sm">{taxonomy[key === 'attendance_band' ? 'audience_band' : key].map(option =>
        <Choice key={option} label={preferenceLabel(option)} single={key === 'attendance_band'}
          selected={key === 'attendance_band' ? value[key] === option : value[key].includes(option)} disabled={busy}
          onPress={() => key === 'attendance_band' ? set(key, option) : set(key, value[key].includes(option) ? value[key].filter(v => v !== option) : [...value[key], option])} />)}</View>
      <AuthError message={errors[key] || null} />
    </View>)}
    <AuthError message={error} />
    <Button label={busy ? 'Saving…' : editing ? 'Save event' : 'Create draft'} disabled={busy} onPress={() => void submit()} />
  </View>;
}
