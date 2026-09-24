import { useSession } from '@/providers/SessionProvider';
import { Slot, useLocalSearchParams } from 'expo-router';
import { OrganizationProvider } from '@/features/organizations/OrganizationContext';
export default function OrganizationDetailLayout() {
  const { session } = useSession();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <OrganizationProvider key={slug + ':' + (session?.user.id || 'anonymous')} slug={slug}><Slot /></OrganizationProvider>;
}
