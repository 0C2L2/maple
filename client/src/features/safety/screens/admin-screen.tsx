import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { contactTopicLabel } from '@/constants/site';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { pickAndUploadImage } from '@/features/organizations/upload-image';
import { reasonLabel } from '@/features/safety/report-reasons';
import { useIsStaff } from '@/features/safety/use-is-staff';
import { formatDate, formatMoney, timeAgo } from '@/lib/format';
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

type Tab = 'reports' | 'inbox' | 'orgs' | 'posts' | 'finance' | 'logos' | 'banner' | 'broadcast' | 'log';
const TABS = [
  { value: 'reports' as const, label: 'Reports' },
  { value: 'inbox' as const, label: 'Inbox' },
  { value: 'orgs' as const, label: 'Organizations' },
  { value: 'posts' as const, label: 'Posts' },
  { value: 'finance' as const, label: 'Finance' },
  { value: 'logos' as const, label: 'Logos' },
  { value: 'banner' as const, label: 'Banner' },
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
  set_pilot: 'Made a pilot event (0% fee)',
  unset_pilot: 'Ended pilot (normal fee)',
  add_logo: 'Added a logo to the home strip',
  hide_logo: 'Hid a logo from the home strip',
  show_logo: 'Showed a logo in the home strip',
  delete_logo: 'Deleted a logo from the home strip',
  add_announcement: 'Added an announcement',
  hide_announcement: 'Hid an announcement',
  show_announcement: 'Showed an announcement',
  delete_announcement: 'Deleted an announcement',
  edit_announcement: 'Edited an announcement',
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
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(TABS.find((t) => t.value === params.tab)?.value ?? 'reports');
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
      {tab === 'inbox' && <InboxTab />}
      {tab === 'orgs' && <OrganizationsTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'broadcast' && <BroadcastTab />}
      {tab === 'finance' && <FinanceTab />}
      {tab === 'logos' && <LogosTab />}
      {tab === 'banner' && <BannerTab />}
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

type ContactMessage = {
  id: string;
  topic: string;
  name: string;
  email: string;
  message: string;
  org_handle: string | null;
  created_at: string;
};

// Messages from the /contact form. We reply from our own mail app, then mark them done.
function InboxTab() {
  const { run, error } = useAdminAction();
  const { data: messages, isPending } = useQuery({
    queryKey: ['admin', 'inbox'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_contact_messages');
      if (error) throw error;
      return data as ContactMessage[];
    },
  });
  return (
    <>
      <ThemedText themeColor="textSecondary">
        Messages from the contact form, oldest first. Reply by email, then mark them done.
      </ThemedText>
      <ErrorLine error={error} />
      {isPending ? (
        <Loading />
      ) : !messages?.length ? (
        <Notice title="Inbox is empty" />
      ) : (
        messages.map((m) => (
          <Card key={m.id}>
            <ThemedText type="caption" themeColor="link">
              {contactTopicLabel(m.topic).toUpperCase()} · {timeAgo(m.created_at)}
            </ThemedText>
            <ThemedText type="subheading">{m.name}</ThemedText>
            <View style={styles.actions}>
              <ThemedText type="small" themeColor="textSecondary">
                {m.email}
              </ThemedText>
              {m.org_handle && (
                <Link href={`/org/${m.org_handle}`}>
                  <ThemedText type="small" themeColor="link">
                    @{m.org_handle}
                  </ThemedText>
                </Link>
              )}
            </View>
            <ThemedText>{m.message}</ThemedText>
            <View style={styles.actions}>
              <Button
                title="Reply by email"
                onPress={() =>
                  Linking.openURL(
                    `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${contactTopicLabel(m.topic)} (Maple)`)}`,
                  )
                }
              />
              <Button
                title="Mark done"
                variant="secondary"
                onPress={() => run(`c${m.id}`, 'admin_close_contact_message', { msg: m.id })}
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
  pilot: boolean;
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
            {post.pilot && (
              <ThemedText type="smallStrong" themeColor="link">
                PILOT EVENT · 0% fee on its deals
              </ThemedText>
            )}
            <View style={styles.actions}>
              {post.kind === 'event' && (
                <Button
                  title={post.pilot ? 'End pilot' : 'Make pilot (0% fee)'}
                  variant="secondary"
                  onPress={() => run(`p${post.id}`, 'admin_set_pilot', { post: post.id, pilot: !post.pilot })}
                />
              )}
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

type Finance = {
  by_currency: {
    currency: string;
    cash_deals: number;
    gmv: number;
    pilot_gmv: number;
    fees_at_launch: number;
    fees_at_full: number;
  }[];
  deals: number;
  in_kind_only: number;
  no_value: number;
  pitches: number;
  pitches_answered: number;
};

// Won and Completed deals and what they would pay once payments launch (D-029), plus whether organizers'
// proposals to sponsors get answers (the spam-control check). Nothing is charged yet.
function FinanceTab() {
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'finance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_finance');
      if (error) throw error;
      return data as Finance;
    },
  });
  if (isPending) return <Loading />;
  if (!data) return <Notice title="No numbers yet" />;
  const answered = data.pitches ? Math.round((data.pitches_answered / data.pitches) * 100) : 0;
  return (
    <>
      <ThemedText themeColor="textSecondary">
        Won and completed deals, and what they would pay once payments launch. Nothing is charged yet.
      </ThemedText>
      {data.by_currency.map((c) => (
        <Card key={c.currency}>
          <ThemedText type="subheading">Cash deals in {c.currency}</ThemedText>
          <Stat label="Deals with cash" value={String(c.cash_deals)} />
          <Stat label="Deal value (GMV)" value={formatMoney(c.gmv, c.currency)} />
          <Stat label="From pilot events (0% fee)" value={formatMoney(c.pilot_gmv, c.currency)} />
          <Stat label="Fees at the launch rate (5%)" value={formatMoney(c.fees_at_launch, c.currency)} />
          <Stat label="Fees at the full rate (8%)" value={formatMoney(c.fees_at_full, c.currency)} />
        </Card>
      ))}
      <Card>
        <ThemedText type="subheading">All deals</ThemedText>
        <Stat label="Won or completed" value={String(data.deals)} />
        <Stat label="In-kind only (no fee)" value={String(data.in_kind_only)} />
        <Stat label="No value recorded" value={String(data.no_value)} />
      </Card>
      <Card>
        <ThemedText type="subheading">Organizers’ proposals to sponsors</ThemedText>
        <Stat label="Sent" value={String(data.pitches)} />
        <Stat label="Answered within 14 days" value={`${data.pitches_answered} (${answered}%)`} />
      </Card>
    </>
  );
}

type StripLogo = {
  id: string;
  org_handle: string | null;
  name: string;
  logo_url: string | null;
  link: string | null;
  hidden: boolean;
  member: boolean;
};

// The home page's logo strip, in order. Members with a logo join at the end on their own; staff add partners,
// reorder, and hide. Members can only be hidden (they'd come back), partners can also be deleted.
function LogosTab() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const { run, confirming, error } = useAdminAction();
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'logos'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_strip_logos');
      if (error) throw error;
      return data as StripLogo[];
    },
  });

  const upload = async () => {
    try {
      const url = await pickAndUploadImage(session!.user.id, 'logo');
      if (url) setLogo(url);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : errorMessage(e));
    }
  };

  const add = async () => {
    if (!name.trim()) return setFormError('Enter the organization’s name.');
    if (!logo) return setFormError('Upload its logo.');
    setBusy(true);
    const { error } = await supabase.rpc('admin_add_logo', { name, logo_url: logo, link: link.trim() || null });
    setBusy(false);
    if (error) return setFormError(errorMessage(error));
    setFormError(undefined);
    setName('');
    setLink('');
    setLogo(null);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({ queryKey: ['strip-logos'] });
  };

  return (
    <>
      <ThemedText themeColor="textSecondary">
        The logos in the home page’s “Organizations on Maple” strip, in this order. Members with a logo join at the
        end on their own. Add a company that isn’t on Maple only with its permission.
      </ThemedText>
      <Card>
        <ThemedText type="subheading">Add a company or organization</ThemedText>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={120} />
        <TextField
          label="Link (optional)"
          placeholder="Its website, or /org/handle for a Maple page"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          maxLength={300}
        />
        <View style={styles.actions}>
          {logo && <OrgLogo name={name || 'New logo'} url={logo} size={56} />}
          <Button title={logo ? 'Change logo' : 'Upload logo'} variant="secondary" onPress={upload} />
        </View>
        <ErrorLine error={formError} />
        <Button title={busy ? 'Adding…' : 'Add to the strip'} onPress={add} disabled={busy} />
      </Card>
      <ErrorLine error={error} />
      {isPending ? (
        <Loading />
      ) : !data?.length ? (
        <Notice title="No logos yet" />
      ) : (
        data.map((item, i) => (
          <Card key={item.id}>
            <View style={styles.logoRow}>
              <OrgLogo name={item.name} url={item.logo_url} size={44} />
              <View style={styles.logoText}>
                <ThemedText type="bodyStrong">
                  {i + 1}. {item.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.member ? `Maple member · @${item.org_handle}` : `Added partner${item.link ? ` · ${item.link}` : ''}`}
                  {item.hidden ? ' · HIDDEN' : ''}
                </ThemedText>
              </View>
            </View>
            <View style={styles.actions}>
              <Button title="↑" variant="secondary" onPress={() => run(`u${item.id}`, 'admin_move_logo', { logo: item.id, step: -1 })} />
              <Button title="↓" variant="secondary" onPress={() => run(`d${item.id}`, 'admin_move_logo', { logo: item.id, step: 1 })} />
              <Button
                title={item.hidden ? 'Show' : 'Hide'}
                variant="secondary"
                onPress={() => run(`h${item.id}`, 'admin_set_logo_hidden', { logo: item.id, hide: !item.hidden })}
              />
              {!item.member && (
                <Button
                  title={confirming === `x${item.id}` ? 'Press again to delete' : 'Delete'}
                  variant="secondary"
                  onPress={() => run(`x${item.id}`, 'admin_delete_logo', { logo: item.id }, true)}
                />
              )}
            </View>
          </Card>
        ))
      )}
    </>
  );
}

type Announcement = {
  id: string;
  badge: string | null;
  message: string;
  link_label: string | null;
  link_url: string | null;
  hidden: boolean;
};

// The announcement bar above the home page hero. Visible announcements rotate in this order.
function BannerTab() {
  const queryClient = useQueryClient();
  const { run, confirming, error } = useAdminAction();
  const [badge, setBadge] = useState('NEW');
  const [message, setMessage] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string>();
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_announcements');
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Adds a new announcement, or saves the one being edited.
  const save = async () => {
    setBusy(true);
    const fields = {
      badge: badge.trim() || null,
      message,
      link_label: linkLabel.trim() || null,
      link_url: linkUrl.trim() || null,
    };
    const { error } = editing
      ? await supabase.rpc('admin_update_announcement', { item: editing, ...fields })
      : await supabase.rpc('admin_add_announcement', fields);
    setBusy(false);
    if (error) return setFormError(errorMessage(error));
    fill();
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  };

  // Loads an announcement into the form to edit it, or with no argument empties the form for a new one.
  const fill = (a?: Announcement) => {
    setEditing(a?.id);
    setBadge(a ? (a.badge ?? '') : 'NEW');
    setMessage(a?.message ?? '');
    setLinkLabel(a?.link_label ?? '');
    setLinkUrl(a?.link_url ?? '');
    setFormError(undefined);
  };

  const form = (
    <>
      <ThemedText type="subheading">{editing ? 'Edit announcement' : 'Add an announcement'}</ThemedText>
      <TextField
        label="Badge (optional)"
        placeholder="NEW, EVENT, HIRING"
        value={badge}
        onChangeText={setBadge}
        maxLength={12}
        autoCapitalize="characters"
      />
      <TextField label={`Message (${message.length}/90)`} value={message} onChangeText={setMessage} maxLength={90} />
      <TextField
        label="Link text (optional)"
        placeholder="See the event"
        value={linkLabel}
        onChangeText={setLinkLabel}
        maxLength={40}
      />
      <TextField
        label="Link (optional)"
        placeholder="https://… or /posts/…"
        value={linkUrl}
        onChangeText={setLinkUrl}
        autoCapitalize="none"
        maxLength={300}
      />
      <ErrorLine error={formError} />
      <View style={styles.actions}>
        <Button
          title={busy ? 'Saving…' : editing ? 'Save changes' : 'Add announcement'}
          onPress={save}
          disabled={busy}
        />
        {editing ? <Button title="Cancel" variant="secondary" onPress={() => fill()} /> : null}
      </View>
    </>
  );

  return (
    <>
      <ThemedText themeColor="textSecondary">
        The bar above the home page hero. Visible announcements take turns every few seconds, in this order. Hide them
        all and the bar disappears.
      </ThemedText>
      {editing ? null : <Card>{form}</Card>}
      <ErrorLine error={error} />
      {isPending ? (
        <Loading />
      ) : !data?.length ? (
        <Notice title="No announcements" body="The bar is hidden until you add one." />
      ) : (
        data.map((a, i) =>
          editing === a.id ? (
            <Card key={a.id}>{form}</Card>
          ) : (
            <Card key={a.id}>
              <ThemedText type="bodyStrong">
                {i + 1}. {a.badge ? `${a.badge} · ` : ''}
                {a.message}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {a.link_url ? `${a.link_label} → ${a.link_url}` : 'No link'}
                {a.hidden ? ' · HIDDEN' : ''}
              </ThemedText>
              <View style={styles.actions}>
                <Button title="Edit" variant="secondary" onPress={() => fill(a)} />
                <Button
                  title="↑"
                  variant="secondary"
                  onPress={() => run(`u${a.id}`, 'admin_move_announcement', { item: a.id, step: -1 })}
                />
                <Button
                  title="↓"
                  variant="secondary"
                  onPress={() => run(`d${a.id}`, 'admin_move_announcement', { item: a.id, step: 1 })}
                />
                <Button
                  title={a.hidden ? 'Show' : 'Hide'}
                  variant="secondary"
                  onPress={() => run(`h${a.id}`, 'admin_set_announcement_hidden', { item: a.id, hide: !a.hidden })}
                />
                <Button
                  title={confirming === `x${a.id}` ? 'Press again to delete' : 'Delete'}
                  variant="secondary"
                  onPress={() => run(`x${a.id}`, 'admin_delete_announcement', { item: a.id }, true)}
                />
              </View>
            </Card>
          ),
        )
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="bodyStrong">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { padding: 0, gap: 0, overflow: 'hidden' },
  stat: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  logoText: { flex: 1, gap: Spacing.half },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  logRow: { gap: Spacing.half, paddingVertical: Spacing.one },
});
