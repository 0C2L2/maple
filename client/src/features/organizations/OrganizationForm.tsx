import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AuthError } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { Choice, textStyle } from '@/features/profiles/ProfileFields';
import { orgTypes, suggestSlug, validateOrganization, type OrgInput } from './validation';
export function OrganizationForm({ initial, editing = false, verified = false, onSave }: { initial: OrgInput; editing?: boolean; verified?: boolean; onSave: (value: OrgInput) => Promise<void> }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateOrganization>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  async function submit() {
    if (locked.current) return;
    const next = validateOrganization(value, editing); setErrors(next);
    if (Object.keys(next).length) return;
    locked.current = true; setBusy(true); setError(null);
    try { await onSave(value); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save. Please retry.'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <View className="gap-lg">
    {(['name', ...(!editing ? ['slug'] as const : []), 'domain', 'website', 'about'] as const).map((field) => <View className="gap-sm" key={field}>
      <Text nativeID={'org-' + field} className={textStyle}>{field[0].toUpperCase() + field.slice(1)}{field === 'name' || field === 'slug' ? ' *' : ' (optional)'}</Text>
      <TextInput accessibilityLabel={field[0].toUpperCase() + field.slice(1)} accessibilityLabelledBy={'org-' + field} aria-describedby={errors[field] ? field + '-error' : undefined}
        value={value[field]} editable={!busy} multiline={field === 'about'} autoCapitalize={field === 'name' || field === 'about' ? 'sentences' : 'none'} autoCorrect={false}
        keyboardType={field === 'website' || field === 'domain' ? 'url' : 'default'} maxLength={field === 'name' ? 160 : field === 'slug' ? 64 : undefined}
        onChangeText={(text) => setValue({ ...value, [field]: text, ...(field === 'name' && !editing && (!value.slug || value.slug === suggestSlug(value.name)) ? { slug: suggestSlug(text) } : {}) })}
        className="min-h-14 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-brand" />
      {errors[field] ? <Text nativeID={field + '-error'} accessibilityRole="alert" className={textStyle}>{errors[field]}</Text> : null}
    </View>)}
    <Text accessibilityRole="header" className={textStyle}>Organization type *</Text>
    <View className="gap-sm">{Object.entries(orgTypes).map(([type, label]) => <Choice key={type} single label={label} selected={value.type === type} disabled={busy} onPress={() => setValue({ ...value, type: type as keyof typeof orgTypes })} />)}</View>
    {errors.type ? <AuthError message={errors.type} /> : null}
    {verified ? <Text className={textStyle}>Changing the domain will remove verification.</Text> : null}
    <AuthError message={error} />
    <Button label={busy ? 'Saving…' : editing ? 'Save organization' : 'Create organization'} disabled={busy} onPress={() => void submit()} />
  </View>;
}
