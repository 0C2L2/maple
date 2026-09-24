import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { REPORT_REASONS, type ReportTarget } from '@/features/safety/report-reasons';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { ChoiceChips } from '@/ui/choice-chips';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

const TARGETS: Record<ReportTarget, string> = { post: 'post', organization: 'organization', review: 'review' };

/** /report?type=post|organization|review&id=…: tell Maple staff about something that breaks the guidelines. */
export default function ReportScreen() {
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const target = params.type && params.type in TARGETS ? (params.type as ReportTarget) : null;
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/find'));

  if (!target || !params.id)
    return (
      <Screen title="Report">
        <Notice title="Nothing to report" action={{ title: 'Find posts', href: '/find' }} />
      </Screen>
    );
  if (sent)
    return (
      <Screen title="Report sent">
        <Notice
          title="Thanks, we got your report"
          body="Maple staff review every report and remove what breaks the Community guidelines. The organization isn't told who reported it."
        />
        <Button title="Go back" variant="secondary" onPress={back} />
      </Screen>
    );

  const submit = async () => {
    if (!reason) return setError('Pick what’s wrong.');
    setBusy(true);
    setError(undefined);
    const { error } = await supabase
      .from('reports')
      .insert({ target_type: target, target_id: params.id, reason, details: details.trim() });
    setBusy(false);
    // Reporting the same thing twice changes nothing, so it counts as sent.
    if (error && error.code !== '23505') return setError(errorMessage(error));
    setSent(true);
  };

  return (
    <Screen title="Report" width="form">
      <ThemedText type="title" level={1}>
        Report this {TARGETS[target]}
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Reports are private: only Maple staff see them. To stop an organization from contacting you, block it from its
        page.
      </ThemedText>
      <ChoiceChips label="What’s wrong?" options={REPORT_REASONS} value={reason} onChange={setReason} />
      <TextField
        label="Details (optional)"
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={1000}
        style={{ minHeight: 100 }}
      />
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
      <Button title={busy ? 'Sending…' : 'Send report'} onPress={submit} disabled={busy} />
    </Screen>
  );
}
