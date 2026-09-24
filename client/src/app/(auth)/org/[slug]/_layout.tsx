import { Slot, useLocalSearchParams } from 'expo-router';
import { OrganizationProvider } from '@/features/organizations/OrganizationContext';
export default function OrganizationDetailLayout() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <OrganizationProvider key={slug} slug={slug}><Slot /></OrganizationProvider>;
}
