import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { IdentityFields, PreferenceFields } from '@/features/profiles/ProfileFields';
import { validateIdentity } from '@/features/profiles/validation';
import type { Profile, ProfileFields } from '@/features/profiles/data';
import { useSession } from '@/providers/SessionProvider';

function EditForm({ initial }: { initial: Profile }) {
  const { updateProfile } = useSession();
  const [fields, setFields] = useState<ProfileFields>(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateIdentity>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  async function save() {
    if (locked.current) return;
    const validation = validateIdentity(fields); setErrors(validation);
    if (Object.keys(validation).length) return;
    locked.current = true; setBusy(true); setError(null);
    try { await updateProfile(fields); router.replace('/me'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save. Please retry.'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <AuthFrame title="Edit profile">
    <IdentityFields value={fields} onChange={setFields} errors={errors} disabled={busy} />
    <PreferenceFields value={fields} onChange={setFields} role={initial.role} disabled={busy} />
    <AuthError message={error} />
    <Button label={busy ? 'Saving…' : 'Save changes'} onPress={() => void save()} disabled={busy} />
    <Button label="Cancel" variant="secondary" disabled={busy} onPress={() => router.replace('/me')} />
  </AuthFrame>;
}
export default function EditProfile() {
  const { profile } = useSession();
  return profile ? <EditForm key={profile.id} initial={profile} /> : null;
}
