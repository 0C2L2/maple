import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { reasonLabel } from '@/features/safety/report-reasons';
import { useIsStaff } from '@/features/safety/use-is-staff';
import { formatDate, timeAgo } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Checkbox } from '@/ui/checkbox';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TabStrip } from '@/ui/tab-strip';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

type Tab = 'reports' | 'orgs' | 'posts' | 'broadcast' | 'log';
const TABS = [
  { value: 'reports' as const, label: 'Reports' },
  { value: 'orgs' as const, label: 'Organizations' },
  { value: 'posts' as const, label: 'Posts' },
  { value: 'broadcast' as const, label: 'Broadcast' },
  { value: 'log' as const, label: 'Log' },
];

const ACTION_LABELS: Record<string, string> = {
  suspend: 'Suspended',
  unsuspend: 'Restored organization',
  delete_org: 'Deleted organization',
  remove_post: 'Took down post',
  restore_post: 'Restored post',
  delete_post: 'Deleted post',
  remove_review: 'Removed review',
  dismiss_report: 'Dismissed report',
  broadcast: 'Messaged',
};

const AUDIENCES = [
  { value: 'all', label: 'All organizations' },
  { value: 'organizers', label: 'Organizers' },
  { value: 'sponsors', label: 'Sponsors' },
  { value: 'selected', label: 'Choose organizations' },
];

/**
 * /admin: Maple staff (public.staff) moderate the marketplace. Reports; suspend, restore, or delete organizations
 * (suspending also bans the login); take down, restore, or delete posts; and the log of every action.
 * The database checks staff on every call.
 */
export default function AdminScreen() {
  const { isStaff, checking } = useIsStaff();
  const [tab, setTab] = useState<Tab>('reports');
  if (checking) return <Loading />;
  if (!isStaff)
    return (
      <Screen title="Admin">
        <Notice title="Staff only" body="This page is for Maple staff." action={{ title: 'Find posts', href: '/find' }} />
      </Screen>
    );
  return (
    <Screen title="Admin" width="page">
      <ThemedText type="title" level={1}>
        Maple admin
      </ThemedText>
      <Card style={styles.tabs}>
        <TabStrip tabs={TABS} value={tab} onChange={setTab} />
      </Card>
      {tab === 'reports' && <ReportsTab />}
      {tab === 'orgs' && <OrganizationsTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'broadcast' && <BroadcastTab />}
      {tab === 'log' && <LogTab />}
    </Screen>
  );
}

/** Runs an admin RPC, then refreshes every admin list. Destructive actions take a second press. */
function useAdminAction() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<string>();
  const [error, setError] = useState<string>();
  const run = async (key: string, fn: string, args: Record<string, unknown>, confirm = false) => {
    if (confirm && confirming !== key) return setConfirming(key);
    setConfirming(undefined);
    const { error } = await supabase.rpc(fn, args);
    setError(error ? errorMessage(error) : undefined);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };
  return { run, confirming, error };
}

function ErrorLine({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <ThemedText role="alert" themeColor="danger">
      {error}
    </ThemedText>
  );
}

type OpenReport = {
  id: string;
  target_type: 'post' | 'organization' | 'review';
  reason: string;
  details: string;
  created_at: string;
  reporter_name: string;
  target_text: string | null;
  target_link: string | null;
};

function ReportsTab() {
  const { run, confirming, error } = useAdminAction();
  const { data: reports, isPending } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('open_reports');
      if (error) throw error;
      return data as OpenReport[];
    },
  });
  return (
    <>
      <ThemedText themeColor="textSecondary">
        Open reports, oldest first. Remove takes a post down, suspends an organization, or deletes a review.
      </ThemedText>
      <ErrorLine error={error} />
      {isPending ? (
        <Loading />
      ) : !reports?.length ? (
        <Notice title="No open reports" />
      ) : (
        reports.map((report) => (
          <Card key={report.id}>
            <ThemedText type="caption" themeColor="link">
              {report.target_type.toUpperCase()} · {reasonLabel(report.reason)}
            </ThemedText>
            <ThemedText type="subheading">{report.target_text ?? '(already deleted)'}</ThemedText>
            {report.details ? <ThemedText>{report.details}</ThemedText> : null}
            <ThemedText type="small" themeColor="textSecondary">
              Reported by {report.reporter_name} · {timeAgo(report.created_at)}
            </ThemedText>
            <View style={styles.actions}>
              {report.target_link && (
                <Button title="Open" variant="secondary" onPress={() => router.push(report.target_link as Href)} />
              )}
              <Button
                title={
                  confirming === `r${report.id}`
                    ? 'Press again to confirm'
                    : report.target_type === 'organization'
                      ? 'Suspend organization'
                      : report.target_type === 'post'
                        ? 'Take post down'
                        : 'Delete review'
                }
                onPress={() => run(`r${report.id}`, 'resolve_report', { report: report.id, remove: true }, true)}
              />
              <Button
                title="Dismiss"
                variant="secondary"
                onPress={() => run(`d${report.id}`, 'resolve_report', { report: report.id, remove: false })}
              />
            </View>
          </Card>
        ))
      )}
    </>
  );
}

type AdminOrg = {
  id: string;
  handle: string;
  name: string;
  role: string;
  email: string | null;
  created_at: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  posts: number;
  is_staff: boolean;
};

function OrganizationsTab() {
  const { run, confirming, error } = useAdminAction();
  const [q, setQ] = useState('');
  const [reason, setReason] = useState('');
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'orgs', q],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_organizations', { q });
      if (error) throw error;
      return data as AdminOrg[];
    },
  });
  return (
    <>
      <TextField label="Search by name, page address, or email" value={q} onChangeText={setQ} autoCapitalize="none" />
      <TextField
        label="Reason (needed to suspend; organizations see it)"
        placeholder="Spam, scam, fake organization…"
        value={reason}
        onChangeText={setReason}
        maxLength={300}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Suspending hides the page and its posts, blocks new posts and messages, bans the login, and signs it out. You
        can restore it. Delete removes the organization and everything it created, for good.
      </ThemedText>
      <ErrorLine error={error} />
      {isPending ? (
        <Loading />
      ) : (
        data?.map((org) => (
          <Card key={org.id}>
            <Link href={`/org/${org.handle}`}>
              <ThemedText type="subheading">{org.name}</ThemedText>
            </Link>
            <ThemedText type="small" themeColor="textSecondary">
              {[org.role, org.email, `${org.posts} ${org.posts === 1 ? 'post' : 'posts'}`, `joined ${formatDate(org.created_at.slice(0, 10))}`]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
            {org.suspended_at && (
              <ThemedText type="smallStrong" themeColor="danger">
                SUSPENDED {formatDate(org.suspended_at.slice(0, 10))} · {org.suspended_reason}
              </ThemedText>
            )}
            {org.is_staff ? (
              <ThemedText type="small" themeColor="link">
                Maple staff
              </ThemedText>
            ) : (
              <View style={styles.actions}>
                {org.suspended_at ? (
                  <Button
                    title="Restore"
                    variant="secondary"
                    onPress={() => run(`u${org.id}`, 'admin_set_suspended', { org: org.id, suspend: false })}
                  />
                ) : (
                  <Button
                    title={confirming === `s${org.id}` ? 'Press again to suspend' : 'Suspend'}
                    onPress={() => run(`s${org.id}`, 'admin_set_suspended', { org: org.id, suspend: true, reason }, true)}
                  />
                )}
                <Button
                  title={confirming === `x${org.id}` ? 'Press again to delete for good' : 'Delete'}
                  variant="secondary"
                  onPress={() =>
                    run(`x${org.id}`, 'admin_delete', { target_type: 'organization', target: org.id, reason }, true)
                  }
                />
              </View>
            )}
          </Card>
        ))
      )}
    </>
  );
}

type AdminPost = {
  id: string;
  title: string;
  kind: string;
  status: string;
  owner_name: string;
  owner_handle: string;
  created_at: string;
  removed_at: string | null;
  removed_reason: string | null;
};

function PostsTab() {
  const { run, confirming, error } = useAdminAction();
  const [q, setQ] = useState('');
  const [reason, setReason] = useState('');
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'posts', q],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_posts', { q });
      if (error) throw error;
      return data as AdminPost[];
    },
  });
  return (
    <>
      <TextField label="Search by title or organization" value={q} onChangeText={setQ} />
      <TextField
        label="Reason (needed to take a post down; the owner sees it)"
        placeholder="Misleading, spam, breaks the guidelines…"
        value={reason}
        onChangeText={setReason}
        maxLength={300}
      />
      <ErrorLine error={error} />
      {isPending ? (
        <Loading />
      ) : (
        data?.map((post) => (
          <Card key={post.id}>
            <Link href={`/posts/${post.id}`}>
              <ThemedText type="subheading">{post.title}</ThemedText>
            </Link>
            <ThemedText type="small" themeColor="textSecondary">
              {post.kind} post · {post.status} · {post.owner_name} · {formatDate(post.created_at.slice(0, 10))}
            </ThemedText>
            {post.removed_at && (
              <ThemedText type="smallStrong" themeColor="danger">
                TAKEN DOWN {formatDate(post.removed_at.slice(0, 10))} · {post.removed_reason}
              </ThemedText>
            )}
            <View style={styles.actions}>
              {post.removed_at ? (
                <Button
                  title="Restore"
                  variant="secondary"
                  onPress={() => run(`u${post.id}`, 'admin_set_post_removed', { post: post.id, remove: false })}
                />
              ) : (
                <Button
                  title={confirming === `t${post.id}` ? 'Press again to take down' : 'Take down'}
                  onPress={() => run(`t${post.id}`, 'admin_set_post_removed', { post: post.id, remove: true, reason }, true)}
                />
              )}
              <Button
                title={confirming === `x${post.id}` ? 'Press again to delete for good' : 'Delete'}
                variant="secondary"
                onPress={() => run(`x${post.id}`, 'admin_delete', { target_type: 'post', target: post.id, reason }, true)}
              />
            </View>
          </Card>
        ))
      )}
    </>
  );
}

// A direct message from the staff member's organization to everyone, one side of the market, or chosen
// organizations (admin_broadcast). Replies come back as normal conversations.
function BroadcastTab() {
  const queryClient = useQueryClient();
  const [audience, setAudience] = useState('all');
  const [q, setQ] = useState('');
  const [chosen, setChosen] = useState<Record<string, string>>({}); // organization id → name
  const [body, setBody] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>();
  const [error, setError] = useState<string>();
  const { data: orgs } = useQuery({
    queryKey: ['admin', 'orgs', q],
    enabled: audience === 'selected',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_organizations', { q });
      if (error) throw error;
      return data as AdminOrg[];
    },
  });
  const ids = Object.keys(chosen);
  const target =
    audience === 'selected'
      ? `${ids.length} chosen ${ids.length === 1 ? 'organization' : 'organizations'}`
      : (AUDIENCES.find((a) => a.value === audience)?.label.toLowerCase() ?? '');

  const choose = (org: AdminOrg, on: boolean) =>
    setChosen((current) => {
      const next = { ...current };
      if (on) next[org.id] = org.name;
      else delete next[org.id];
      return next;
    });

  const send = async () => {
    setResult(undefined);
    if (!body.trim()) return setError('Write a message.');
    if (audience === 'selected' && !ids.length) return setError('Choose at least one organization.');
    setError(undefined);
    // Sending reaches many inboxes at once, so it takes a second press.
    if (!confirming) return setConfirming(true);
    setConfirming(false);
    setBusy(true);
    const { data, error } = await supabase.rpc('admin_broadcast', {
      audience,
      orgs: audience === 'selected' ? ids : null,
      body: body.trim(),
    });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    setResult(`Sent to ${data} ${data === 1 ? 'organization' : 'organizations'}. It's in their Messages.`);
    setBody('');
    setChosen({});
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({ queryKey: ['threads'] });
  };

  return (
    <>
      <ThemedText themeColor="textSecondary">
        Send a direct message from your Maple organization. Each organization gets it in Messages with a notification,
        and replies come back to you. Suspended organizations are skipped.
      </ThemedText>
      <ChoiceChips
        label="Send to"
        options={AUDIENCES}
        value={audience}
        onChange={(value) => {
          setAudience(value);
          setConfirming(false);
        }}
      />
      {audience === 'selected' && (
        <>
          <TextField label="Search organizations" value={q} onChangeText={setQ} autoCapitalize="none" />
          {ids.length > 0 && <ThemedText type="small">Chosen: {Object.values(chosen).join(', ')}</ThemedText>}
          {orgs
            ?.filter((org) => !org.is_staff)
            .map((org) => (
              <Checkbox key={org.id} checked={!!chosen[org.id]} label={org.name} onChange={(on) => choose(org, on)}>
                <ThemedText>
                  {org.name}
                  <ThemedText type="small" themeColor="textSecondary">
                    {` · ${org.role}${org.suspended_at ? ' · suspended, skipped' : ''}`}
                  </ThemedText>
                </ThemedText>
              </Checkbox>
            ))}
        </>
      )}
      <TextField label="Message" value={body} onChangeText={setBody} multiline maxLength={4000} style={{ minHeight: 140 }} />
      <ErrorLine error={error} />
      {result && (
        <ThemedText role="status" themeColor="link">
          {result}
        </ThemedText>
      )}
      <Button
        title={busy ? 'Sending…' : confirming ? `Press again to send to ${target}` : `Send to ${target}`}
        onPress={send}
        disabled={busy}
      />
    </>
  );
}

type LogRow = {
  id: number;
  staff_name: string;
  action: string;
  target_label: string | null;
  reason: string | null;
  created_at: string;
};

function LogTab() {
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'log'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_log');
      if (error) throw error;
      return data as LogRow[];
    },
  });
  if (isPending) return <Loading />;
  if (!data?.length) return <Notice title="No admin actions yet" />;
  return (
    <Card>
      {data.map((row) => (
        <View key={row.id} style={styles.logRow}>
          <ThemedText type="smallStrong">
            {ACTION_LABELS[row.action] ?? row.action}
            {row.target_label ? `: ${row.target_label}` : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {row.staff_name} · {timeAgo(row.created_at)}
            {row.reason ? ` · ${row.reason}` : ''}
          </ThemedText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: { padding: 0, gap: 0, overflow: 'hidden' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  logRow: { gap: Spacing.half, paddingVertical: Spacing.one },
});
