import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { pickAndUploadImage } from '@/features/organizations/upload-image';
import { saveResultsReport } from '@/features/posts/mutations';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

type Report = { attendance: number | null; summary: string; delivered: string; photos: string[]; updated_at: string };
const MAX_PHOTOS = 6;

// An event's results report (D-029): the organizer writes it once the event has started, and sponsors with a Won
// deal read it here. The database shows it to nobody else. When payments launch, it releases their payment.
export function ResultsReport({ postId, startsOn, isOwner }: { postId: string; startsOn?: string | null; isOwner: boolean }) {
  const { session } = useSession();
  const [editing, setEditing] = useState(false);
  const { data: report, isPending } = useQuery({
    queryKey: ['results-report', postId],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results_reports')
        .select('attendance, summary, delivered, photos, updated_at')
        .eq('post_id', postId)
        .maybeSingle();
      if (error) throw error;
      return data as Report | null;
    },
  });

  // Dates in the database are UTC calendar dates.
  const started = !startsOn || startsOn <= new Date().toISOString().slice(0, 10);
  if (!session || isPending) return null;
  if (isOwner && started && (editing || !report))
    return <ReportForm postId={postId} report={report ?? null} onDone={() => setEditing(false)} />;
  if (!report) return null;
  return <ReportView report={report} onEdit={isOwner ? () => setEditing(true) : undefined} />;
}

function ReportView({ report, onEdit }: { report: Report; onEdit?: () => void }) {
  return (
    <Card>
      <ThemedText type="subheading" level={2}>
        Results report
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Updated {formatDate(report.updated_at.slice(0, 10))}
        {report.attendance != null ? ` · ${report.attendance.toLocaleString('en-US')} attended` : ''}
      </ThemedText>
      <ThemedText>{report.summary}</ThemedText>
      {report.delivered ? (
        <>
          <ThemedText type="bodyStrong">What sponsors got</ThemedText>
          <ThemedText>{report.delivered}</ThemedText>
        </>
      ) : null}
      <Photos urls={report.photos} />
      {onEdit && <Button title="Edit the report" variant="secondary" onPress={onEdit} />}
    </Card>
  );
}

function ReportForm({ postId, report, onDone }: { postId: string; report: Report | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [attendance, setAttendance] = useState(report?.attendance != null ? String(report.attendance) : '');
  const [summary, setSummary] = useState(report?.summary ?? '');
  const [delivered, setDelivered] = useState(report?.delivered ?? '');
  const [photos, setPhotos] = useState(report?.photos ?? []);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const addPhoto = async () => {
    try {
      const url = await pickAndUploadImage(session!.user.id, 'report');
      if (url) setPhotos((list) => [...list, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : errorMessage(e));
    }
  };

  const save = async () => {
    if (!summary.trim()) return setError('Write a short summary of how the event went.');
    const count = attendance.trim() ? Number(attendance) : null;
    if (count != null && !(Number.isInteger(count) && count >= 0)) return setError('Attendance must be a whole number.');
    setBusy(true);
    setError(undefined);
    try {
      await saveResultsReport(postId, { attendance: count, summary: summary.trim(), delivered: delivered.trim(), photos });
      queryClient.invalidateQueries({ queryKey: ['results-report', postId] });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <Card>
      <ThemedText type="subheading" level={2}>
        Results report
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Tell your sponsors how the event went. Sponsors with a Won deal see this report. When payments launch, it
        releases their payment to you.
      </ThemedText>
      <TextField
        label="Attendance (optional)"
        value={attendance}
        onChangeText={(v) => setAttendance(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
      />
      <TextField
        label="How it went"
        placeholder="Teams, highlights, winners"
        value={summary}
        onChangeText={setSummary}
        multiline
        maxLength={4000}
        style={styles.long}
      />
      <TextField
        label="What each sponsor got (optional)"
        placeholder="Logo on stage, a judging seat, 55 CVs…"
        value={delivered}
        onChangeText={setDelivered}
        multiline
        maxLength={4000}
        style={styles.long}
      />
      <Photos urls={photos} onRemove={(url) => setPhotos((list) => list.filter((u) => u !== url))} />
      {photos.length < MAX_PHOTOS && <Button title="Add a photo" variant="secondary" onPress={addPhoto} />}
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
      <Button title={busy ? 'Saving…' : 'Save the report'} onPress={save} disabled={busy} />
    </Card>
  );
}

function Photos({ urls, onRemove }: { urls: string[]; onRemove?: (url: string) => void }) {
  const theme = useTheme();
  if (!urls.length) return null;
  return (
    <View style={styles.photos}>
      {urls.map((url, i) => (
        <View key={url} style={styles.photo}>
          <Image source={{ uri: url }} accessibilityLabel={`Event photo ${i + 1}`} style={styles.fill} contentFit="cover" />
          {onRemove && (
            <Pressable
              role="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
              onPress={() => onRemove(url)}
              style={[styles.remove, { backgroundColor: theme.background }]}>
              <ThemedText type="smallStrong">×</ThemedText>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  long: { minHeight: 100, textAlignVertical: 'top' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  photo: { flexBasis: '31%', flexGrow: 1, aspectRatio: 4 / 3, borderRadius: 10, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
