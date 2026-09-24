import { OrganizationCalls } from '@/features/calls/Screens';
import { OrganizationEvents } from '@/features/events/OrganizationEvents';
import { useSession } from '@/providers/SessionProvider';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { Text } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { textStyle } from '@/features/profiles/ProfileFields';
import { useOrganization } from '@/features/organizations/OrganizationContext';
import { orgTypes, safeWebsite } from '@/features/organizations/validation';
export default function OrganizationPage() {
  const { profile, session } = useSession();
  const { organization: org, membership, loading, error, retry } = useOrganization();
  if (loading) return <AuthFrame title="Loading organization"><Text className={textStyle}>One moment…</Text></AuthFrame>;
  if (error) return <AuthFrame title="Unable to load organization"><AuthError message={error} /><Button label="Retry" onPress={retry} /></AuthFrame>;
  if (!org) return <AuthFrame title="Organization not found"><Link href="/me">Back to profile</Link></AuthFrame>;
  const website = safeWebsite(org.website);
  return <AuthFrame title={org.name}>
    <Head><title>{org.name} · Maple</title></Head>
    <Text accessibilityLabel="Organization initials" className="text-2xl font-semibold text-light-text dark:text-dark-text">{org.name.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join('')}</Text>
    <Text className={textStyle}>{orgTypes[org.type]}</Text>
    {org.verified ? <Text className={textStyle}>Verified</Text> : null}
    {org.domain ? <Text className={textStyle}>Domain: {org.domain}</Text> : null}
    {website ? <Link href={website as `https://${string}`} target="_blank" rel="noopener noreferrer" accessibilityLabel="Visit organization website (external link)" className="text-base underline text-light-text dark:text-dark-text">{website}</Link> : null}
    <Text accessibilityRole="header" className="text-lg font-semibold text-light-text dark:text-dark-text">About</Text>
    <Text className={textStyle}>{org.about || 'No description added yet.'}</Text>
    {membership ? <Text className={textStyle}>Your membership: {membership.role === 'admin' ? 'Admin' : 'Member'}</Text> : null}
    {membership?.role === 'admin' ? <Link href={{ pathname: '/org/[slug]/edit', params: { slug: org.slug } }} asChild><Button label="Edit organization" /></Link> : null}
    <OrganizationEvents key={org.id + (session?.user.id || "anonymous")} orgId={org.id} canManage={profile?.role === "organizer" && membership?.role === "admin"} />
    <OrganizationCalls key={"calls:" + org.id + (session?.user.id || "anonymous")} /><Link href="/me" asChild><Button label="Back to profile" variant="secondary" /></Link>
  </AuthFrame>;
}
