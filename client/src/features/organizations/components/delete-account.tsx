import { router } from 'expo-router';
import { useState } from 'react';

import { type Organization } from '@/features/auth/session';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

// Delete the organization and its login. App Store and Google Play require this inside the app.
export function DeleteAccount({ org }: { org: Organization }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!open) return <Button title="Delete our account" variant="secondary" onPress={() => setOpen(true)} />;

  const remove = async () => {
    setBusy(true);
    setError(undefined);
    try {
      // Logos and banners live in org-media/<org id>/; the database can't delete storage files itself.
      const { data: files } = await supabase.storage.from('org-media').list(org.id);
      if (files?.length) await supabase.storage.from('org-media').remove(files.map((f) => `${org.id}/${f.name}`));
      const { error } = await supabase.rpc('delete_account');
      if (error) throw error;
      // The login no longer exists, so only clear the session on this device.
      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Card>
      <ThemedText type="subheading" level={2}>
        Delete our account
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        This permanently deletes {org.name}’s page, posts, proposals, messages, and reviews. It can’t be undone.
      </ThemedText>
      <TextField
        label={`Type ${org.handle} to confirm`}
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
      <Button
        title={busy ? 'Deleting…' : 'Delete permanently'}
        onPress={remove}
        disabled={busy || confirm.trim() !== org.handle}
      />
      <Button title="Cancel" variant="secondary" onPress={() => setOpen(false)} disabled={busy} />
    </Card>
  );
}
