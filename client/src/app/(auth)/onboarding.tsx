import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/providers/SessionProvider';
import { isHandleAvailable, type Profile } from '@/features/profiles/data';
import { emptyFields, validateIdentity } from '@/features/profiles/validation';
import { Choice, IdentityFields, PreferenceFields, PreferenceSummary, textStyle } from '@/features/profiles/ProfileFields';

const steps = ['Choose your role', 'Your identity', 'Your preferences', 'Review your profile'];
export default function Onboarding() {
  const { createProfile, signOut } = useSession();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Profile['role'] | null>(null);
  const [fields, setFields] = useState(emptyFields);
  const [errors, setErrors] = useState<ReturnType<typeof validateIdentity>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [availability, setAvailability] = useState('');
  async function checkHandle() {
    if (locked.current) return;
    const validation = validateIdentity(fields);
    if (validation.handle) { setErrors({ handle: validation.handle }); return; }
    locked.current = true; setBusy(true); setError(null);
    try { setAvailability(await isHandleAvailable(fields.handle) ? 'Available' : 'That handle is already taken.'); }
    catch { setError('Handle availability could not be checked. Please retry.'); }
    finally { locked.current = false; setBusy(false); }
  }
  async function finish() {
    if (locked.current || !role) return;
    const validation = validateIdentity(fields);
    setErrors(validation);
    if (Object.keys(validation).length) { setStep(1); return; }
    locked.current = true; setBusy(true); setError(null);
    try {
      await createProfile({ ...fields, role, audience_band: role === 'organizer' ? fields.audience_band : null, gives: role === 'sponsor' ? fields.gives : [] });
      // Shared state changes the protected route directly; no stale-cache redirect.
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not create your profile. Please retry.'); }
    finally { locked.current = false; setBusy(false); }
  }
  function next() {
    if (step === 1) {
      const validation = validateIdentity(fields); setErrors(validation);
      if (Object.keys(validation).length) return;
    }
    setError(null); setStep(step + 1);
  }
  return <AuthFrame key={step} title={steps[step]}>
    <Text accessibilityLiveRegion="polite" className="text-sm text-light-muted dark:text-dark-muted">Step {step + 1} of 4</Text>
    {step === 0 ? <View className="gap-md">
      <Text className={textStyle}>Choose your primary role. It cannot be changed after creating your profile.</Text>
      <Choice single label="I organize events" selected={role === 'organizer'} onPress={() => setRole('organizer')} />
      <Choice single label="I sponsor events" selected={role === 'sponsor'} onPress={() => setRole('sponsor')} />
    </View> : null}
    {step === 1 ? <>
      <IdentityFields value={fields} onChange={(value) => { setFields(value); setAvailability(''); }} errors={errors} suggest disabled={busy} />
      <Button label="Check handle availability" variant="secondary" onPress={() => void checkHandle()} disabled={busy} />
      {availability ? <Text accessibilityLiveRegion="polite" className={textStyle}>{availability}</Text> : null}
    </> : null}
    {step === 2 && role ? <PreferenceFields value={fields} onChange={setFields} role={role} /> : null}
    {step === 3 && role ? <View className="gap-md">
      <Text className={textStyle}>{fields.name} · @{fields.handle}</Text><Text className={textStyle}>{fields.headline}</Text>
      <Text className={textStyle}>Role: {role === 'organizer' ? 'Organizer' : 'Sponsor'}</Text>
      <Text className={textStyle}>Location: {fields.location || 'Not set'}</Text><Text className={textStyle}>Bio: {fields.bio || 'Not set'}</Text>
      <PreferenceSummary profile={{ ...fields, role }} />
      <Text className="text-sm text-light-muted dark:text-dark-muted">Your role is permanent. You can edit the other fields later.</Text>
    </View> : null}
    <AuthError message={error} />
    {step === 3 ? <Button label={busy ? 'Creating profile…' : 'Create profile'} disabled={busy} onPress={() => void finish()} /> : <Button label="Next" disabled={busy || (step === 0 && !role)} onPress={next} />}
    {step > 0 ? <Button label="Back" variant="secondary" disabled={busy} onPress={() => { setStep(step - 1); setError(null); }} /> : <Button label="Sign out" variant="secondary" onPress={() => void signOut().catch(() => setError('Could not sign out. Please retry.'))} />}
  </AuthFrame>;
}
