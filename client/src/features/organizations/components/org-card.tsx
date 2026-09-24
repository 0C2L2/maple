import { Link } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ORG_KIND_LABELS, ROLE_LABELS, type OrgKind, type Role } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

export type OrgSummary = {
  id: string;
  handle: string;
  name: string;
  tagline: string | null;
  role?: Role;
  kind?: OrgKind;
  location?: string | null;
  logo_url: string | null;
};

// Columns to select from `organizations` for a card (the same fields search_organizations returns).
export const ORG_SUMMARY_COLUMNS = 'id, handle, name, tagline, role, kind, location, logo_url';

/** "Sponsor · Company · Boston" */
export const orgMeta = (org: Partial<OrgSummary>) =>
  [org.role && ROLE_LABELS[org.role], org.kind && ORG_KIND_LABELS[org.kind], org.location].filter(Boolean).join(' · ');

// One organization in a list. `action` (for example a Follow button) sits outside the link.
export function OrgCard({ org, onPress, action }: { org: OrgSummary; onPress?: () => void; action?: ReactNode }) {
  return (
    <Card style={styles.row}>
      <Link href={`/org/${org.handle}`} asChild onPress={onPress}>
        <Pressable style={styles.link}>
          <OrgLogo name={org.name} url={org.logo_url} size={48} />
          <View style={styles.text}>
            <ThemedText type="bodyStrong">{org.name}</ThemedText>
            {org.tagline && (
              <ThemedText type="small" numberOfLines={2}>
                {org.tagline}
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              {orgMeta(org)}
            </ThemedText>
          </View>
        </Pressable>
      </Link>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  link: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  text: { flex: 1, gap: Spacing.half },
});
