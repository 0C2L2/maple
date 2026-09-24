import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ATTENDANCE_BANDS,
  AUDIENCES,
  BUDGET_BANDS,
  CATEGORIES,
  GIVES,
  ORG_KINDS,
  REGIONS,
  ROLES,
  type AudienceType,
  type Category,
  type Give,
  type OrgKind,
  type Region,
  type Role,
} from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession, type Organization } from '@/features/auth/session';
import { OrgBanner, OrgLogo } from '@/features/organizations/components/org-logo';
import { pickAndUploadImage } from '@/features/organizations/upload-image';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import { ChoiceChips } from '@/ui/choice-chips';
import { MultiChips } from '@/ui/multi-chips';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

type Props = {
  /** Editing an existing page. Without it the form creates the signed-in account's organization. */
  org?: Organization;
  initialRole?: Role;
  onSaved: () => void;
};

type Field = 'role' | 'kind' | 'name' | 'handle' | 'image' | 'terms' | 'form';

// Create (onboarding) or edit (settings) an organization page. Role and handle are permanent once created.
export function OrgForm({ org, initialRole, onSaved }: Props) {
  const theme = useTheme();
  const { session, refreshOrg } = useSession();
  const [role, setRole] = useState<Role | null>(org?.role ?? initialRole ?? null);
  const [kind, setKind] = useState<OrgKind | null>(org?.kind ?? null);
  const [name, setName] = useState(org?.name ?? '');
  const [handle, setHandle] = useState(org?.handle ?? '');
  const [handleEdited, setHandleEdited] = useState(!!org);
  const [tagline, setTagline] = useState(org?.tagline ?? '');
  const [location, setLocation] = useState(org?.location ?? '');
  const [website, setWebsite] = useState(org?.website ?? '');
  const [about, setAbout] = useState(org?.about ?? '');
  const [logoUrl, setLogoUrl] = useState(org?.logo_url ?? null);
  const [bannerUrl, setBannerUrl] = useState(org?.banner_url ?? null);
  const [categories, setCategories] = useState<Category[]>(org?.categories ?? []);
  const [regions, setRegions] = useState((org?.regions ?? []) as Region[]);
  const [audiences, setAudiences] = useState<AudienceType[]>(org?.audience_types ?? []);
  const [attendance, setAttendance] = useState<string | null>(org?.attendance_band ?? null);
  const [budget, setBudget] = useState<string | null>(org?.budget_band ?? null);
  const [gives, setGives] = useState<Give[]>(org?.gives ?? []);
  const [agreed, setAgreed] = useState(!!org);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);

  const pickRole = (next: Role) => {
    setRole(next);
    if (!ORG_KINDS[next].some((k) => k.value === kind)) setKind(null);
  };

  const upload = async (which: 'logo' | 'banner') => {
    setUploading(which);
    setErrors({});
    try {
      const url = await pickAndUploadImage(session!.user.id, which);
      if (url) (which === 'logo' ? setLogoUrl : setBannerUrl)(url);
    } catch (e) {
      setErrors({ image: errorMessage(e) });
    }
    setUploading(null);
  };

  const save = async () => {
    const next: typeof errors = {};
    if (!role) next.role = 'Pick one.';
    if (!kind) next.kind = 'Pick one.';
    if (!name.trim()) next.name = 'Add your organization name.';
    if (!/^[a-z0-9-]{3,40}$/.test(handle)) next.handle = '3–40 characters: lowercase letters, numbers, dashes.';
    // The database records the time the page was created as terms_accepted_at.
    if (!agreed) next.terms = 'Agree to the Terms and Community guidelines to create your page.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const fields = {
      kind,
      name: name.trim(),
      tagline: tagline.trim() || null,
      location: location.trim() || null,
      website: website.trim() || null,
      about: about.trim() || null,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      categories,
      regions,
      audience_types: role === 'organizer' ? audiences : [],
      attendance_band: role === 'organizer' ? attendance : null,
      budget_band: role === 'sponsor' ? budget : null,
      gives: role === 'sponsor' ? gives : [],
    };
    setBusy(true);
    const { error } = org
      ? await supabase.from('organizations').update(fields).eq('id', org.id)
      : await supabase.from('organizations').insert({ ...fields, id: session!.user.id, role, handle });
    setBusy(false);
    if (error?.code === '23505') return setErrors({ handle: 'That page address is taken. Try another.' });
    if (error) return setErrors({ form: errorMessage(error) });
    // An account only counts as signed up once its organization page exists, so all three fire here.
    if (!org) for (const event of ['signup_completed', 'role_selected', 'profile_completed'] as const) track(event, { role, kind });
    await refreshOrg();
    onSaved();
  };

  return (
    <>
      {!org && (
        <ChoiceChips label="We are" options={ROLES} value={role} onChange={(v) => pickRole(v as Role)} error={errors.role} />
      )}
      {role && (
        <ChoiceChips
          label="Type of organization"
          options={ORG_KINDS[role]}
          value={kind}
          onChange={(v) => setKind(v as OrgKind)}
          error={errors.kind}
        />
      )}
      <TextField
        label="Organization name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (!handleEdited) setHandle(slugify(text));
        }}
        autoComplete="organization"
        maxLength={120}
        error={errors.name}
      />
      {org ? (
        <ThemedText type="small" themeColor="textSecondary">
          Page address: mapleapp.tech/org/{org.handle}
        </ThemedText>
      ) : (
        <TextField
          label="Page address (mapleapp.tech/org/…)"
          value={handle}
          onChangeText={(text) => {
            setHandleEdited(true);
            setHandle(text.toLowerCase());
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={40}
          error={errors.handle}
        />
      )}

      <View style={styles.logoRow}>
        <OrgLogo name={name || 'Logo'} url={logoUrl} size={72} />
        <View style={styles.imageActions}>
          <Button
            title={uploading === 'logo' ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
            variant="secondary"
            onPress={() => upload('logo')}
            disabled={!!uploading}
          />
          {logoUrl && <TextAction label="Remove logo" onPress={() => setLogoUrl(null)} />}
        </View>
      </View>
      {org && (
        <View style={styles.bannerBlock}>
          <OrgBanner url={bannerUrl} height={96} />
          <View style={styles.imageActions}>
            <Button
              title={uploading === 'banner' ? 'Uploading…' : bannerUrl ? 'Change banner' : 'Upload banner'}
              variant="secondary"
              onPress={() => upload('banner')}
              disabled={!!uploading}
            />
            {bannerUrl && <TextAction label="Remove banner" onPress={() => setBannerUrl(null)} />}
          </View>
        </View>
      )}
      <ThemedText type="small" themeColor={errors.image ? 'danger' : 'textSecondary'} role={errors.image ? 'alert' : undefined}>
        {errors.image ?? 'PNG, JPG, or WebP, up to 2 MB. Logos are square; banners are 4:1.'}
      </ThemedText>

      <TextField
        label="Tagline"
        placeholder={role === 'sponsor' ? 'Developer tools for every team' : 'Boston’s biggest student hackathon'}
        value={tagline}
        onChangeText={setTagline}
        maxLength={120}
      />
      <TextField label="City" value={location} onChangeText={setLocation} maxLength={80} />
      <TextField label="Website" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" maxLength={200} />
      {org && (
        <TextField label="About" value={about} onChangeText={setAbout} multiline maxLength={2000} style={{ minHeight: 120 }} />
      )}
      <MultiChips
        label={role === 'sponsor' ? 'Events you sponsor' : 'Events you run'}
        options={CATEGORIES}
        value={categories}
        onChange={setCategories}
      />
      <MultiChips label="Regions" options={REGIONS} value={regions} onChange={setRegions} />
      {role === 'organizer' && (
        <>
          <ChoiceChips label="Typical attendance" options={ATTENDANCE_BANDS} value={attendance} onChange={setAttendance} />
          <MultiChips label="Your audience" options={AUDIENCES} value={audiences} onChange={setAudiences} />
        </>
      )}
      {role === 'sponsor' && (
        <>
          <ChoiceChips label="Budget per event" options={BUDGET_BANDS} value={budget} onChange={setBudget} />
          <MultiChips label="What you give" options={GIVES} value={gives} onChange={setGives} />
        </>
      )}
      {!org && (
        <Checkbox
          checked={agreed}
          onChange={setAgreed}
          label="I agree to the Terms and Community guidelines"
          error={errors.terms}>
          <ThemedText type="small">
            I agree to Maple’s{' '}
            <Link href="/legal/terms" style={{ color: theme.link }}>
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/legal/community" style={{ color: theme.link }}>
              Community guidelines
            </Link>
            , and I can act for this organization.
          </ThemedText>
        </Checkbox>
      )}
      {errors.form && (
        <ThemedText role="alert" themeColor="danger">
          {errors.form}
        </ThemedText>
      )}
      <Button title={busy ? 'Saving…' : org ? 'Save changes' : 'Create our page'} onPress={save} disabled={busy || !!uploading} />
    </>
  );
}

function TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable role="button" onPress={onPress} hitSlop={8}>
      <ThemedText type="smallStrong" themeColor="danger">
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  bannerBlock: { gap: Spacing.two },
  imageActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.three },
});
