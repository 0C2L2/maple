import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FILE_KINDS, type FileKind } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import type { Pair, PostFileInput } from '@/features/posts/mutations';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

type PairProps = {
  label: string;
  hint?: string;
  value: Pair[];
  onChange: (value: Pair[]) => void;
  labelPlaceholder: string;
  valuePlaceholder: string;
  max?: number;
};

// Rows of label + value, like audience ("Developers", "60%") or schedule ("Day 1 · 11:00", "Registration").
export function PairListField({ label, hint, value, onChange, labelPlaceholder, valuePlaceholder, max = 12 }: PairProps) {
  const setRow = (index: number, patch: Partial<Pair>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <View style={styles.field}>
      <ThemedText type="smallStrong">{label}</ThemedText>
      {hint && (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
      {value.map((row, i) => (
        <View key={i} style={styles.pairRow}>
          <View style={styles.pairCell}>
            <TextField label={labelPlaceholder} value={row.label} onChangeText={(text) => setRow(i, { label: text })} maxLength={80} />
          </View>
          <View style={styles.pairCell}>
            <TextField label={valuePlaceholder} value={row.value} onChangeText={(text) => setRow(i, { value: text })} maxLength={200} />
          </View>
          <Pressable
            role="button"
            accessibilityLabel={`Remove ${row.label || 'row'}`}
            onPress={() => onChange(value.filter((_, j) => j !== i))}
            style={styles.remove}>
            <ThemedText type="smallStrong" themeColor="danger">
              Remove
            </ThemedText>
          </Pressable>
        </View>
      ))}
      {value.length < max && (
        <View style={styles.add}>
          <Button title="Add a row" variant="secondary" onPress={() => onChange([...value, { label: '', value: '' }])} />
        </View>
      )}
    </View>
  );
}

const MAX_BYTES = 10 * 1024 * 1024; // same limit as the post-files bucket

// PDFs for the post (sponsorship deck, event plan, media kit), uploaded to post-files/<organization id>/.
// Anyone sees the list on the post; only signed-in organizations can download them.
export function FilesField({ value, onChange }: { value: PostFileInput[]; onChange: (value: PostFileInput[]) => void }) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const pick = async () => {
    setError(undefined);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    setBusy(true);
    try {
      const body = await (await fetch(asset.uri)).arrayBuffer();
      if (body.byteLength > MAX_BYTES) throw new Error('PDFs must be 10 MB or smaller.');
      const slug = asset.name.replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
      const path = `${session!.user.id}/${Date.now()}-${slug || 'document'}.pdf`;
      const { error: uploadError } = await supabase.storage.from('post-files').upload(path, body, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;
      const kind: FileKind = value.some((f) => f.kind === 'deck') ? 'other' : 'deck';
      onChange([...value, { kind, name: asset.name.replace(/\.pdf$/i, '').slice(0, 120), path, size: body.byteLength }]);
    } catch (e) {
      setError(errorMessage(e));
    }
    setBusy(false);
  };

  const setFile = (index: number, patch: Partial<PostFileInput>) =>
    onChange(value.map((file, i) => (i === index ? { ...file, ...patch } : file)));

  return (
    <View style={styles.field}>
      {value.map((file, i) => (
        <Card key={file.path}>
          <TextField label="Name" value={file.name} onChangeText={(name) => setFile(i, { name })} maxLength={120} />
          <ChoiceChips label="Kind" options={FILE_KINDS} value={file.kind} onChange={(kind) => setFile(i, { kind: kind as FileKind })} />
          <ThemedText type="small" themeColor="textSecondary">
            PDF · {file.size < 1048576 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1048576).toFixed(1)} MB`}
          </ThemedText>
          <Pressable role="button" onPress={() => onChange(value.filter((_, j) => j !== i))} style={styles.remove}>
            <ThemedText type="smallStrong" themeColor="danger">
              Remove
            </ThemedText>
          </Pressable>
        </Card>
      ))}
      {value.length < 5 && (
        <View style={styles.add}>
          <Button title={busy ? 'Uploading…' : 'Add a PDF'} variant="secondary" onPress={pick} disabled={busy} />
        </View>
      )}
      <ThemedText type="small" themeColor={error ? 'danger' : 'textSecondary'} role={error ? 'alert' : undefined}>
        {error ?? 'Sponsorship deck, event plan, or media kit. PDF, up to 10 MB each, 5 at most.'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  pairRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: Spacing.two },
  pairCell: { flexGrow: 1, flexBasis: 180 },
  remove: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  add: { alignSelf: 'flex-start' },
});
