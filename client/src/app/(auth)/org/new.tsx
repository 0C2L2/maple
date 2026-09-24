import { RequireProfile } from '@/components/auth/RequireProfile';
import { Link, router } from 'expo-router';
import { AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { OrganizationForm } from '@/features/organizations/OrganizationForm';
import { emptyOrganization } from '@/features/organizations/validation';
import { createOrganization } from '@/features/organizations/data';
export default function NewOrganization() {
  return <RequireProfile><AuthFrame title="Create organization">
    <OrganizationForm initial={emptyOrganization} onSave={async (input) => { const org = await createOrganization(input); router.replace({ pathname: '/org/[slug]', params: { slug: org.slug } }); }} />
    <Link href="/me" asChild><Button label="Back to profile" variant="secondary" /></Link>
  </AuthFrame></RequireProfile>;
}
