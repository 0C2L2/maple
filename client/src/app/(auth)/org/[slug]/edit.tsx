import { Link, router } from 'expo-router';
import { Text } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { OrganizationForm } from '@/features/organizations/OrganizationForm';
import { useOrganization } from '@/features/organizations/OrganizationContext';
import { updateOrganization } from '@/features/organizations/data';
export default function EditOrganization() {
  const { organization: org, membership, loading, error, retry, setOrganization } = useOrganization();
  if (loading) return <AuthFrame title="Loading organization" />;
  if (error) return <AuthFrame title="Unable to load organization"><AuthError message={error} /><Button label="Retry" onPress={retry} /></AuthFrame>;
  if (!org || membership?.role !== 'admin') return <AuthFrame title="Editing unavailable"><Text className="text-light-text dark:text-dark-text">You do not have permission to edit this organization.</Text><Link href="/me">Back to profile</Link></AuthFrame>;
  return <AuthFrame title="Edit organization">
    <OrganizationForm key={org.id} editing verified={org.verified} initial={{ name: org.name, slug: org.slug, type: org.type, domain: org.domain || '', website: org.website || '', about: org.about || '' }}
      onSave={async (input) => { const updated = await updateOrganization(org.id, input); setOrganization(updated); router.replace({ pathname: '/org/[slug]', params: { slug: updated.slug } }); }} />
    <Link href={{ pathname: '/org/[slug]', params: { slug: org.slug } }} asChild><Button label="Cancel" variant="secondary" /></Link>
  </AuthFrame>;
}
