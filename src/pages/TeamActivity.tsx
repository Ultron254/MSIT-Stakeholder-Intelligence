import { useMemo, useState } from 'react';
import {
  TrendingUp, MessageSquare, CheckCircle, AlertTriangle, FileText, Shield,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useAppStore, useCurrentUser } from '../lib/store';
import { Card, EmptyState } from '../components/ui/Badges';
import { ROLE_LABELS, ROLE_COLORS } from '../lib/types';
import { formatRelativeDate } from '../lib/formatters';
import Portrait from '../components/ui/Portrait';

function icon(type: string) {
  switch (type) {
    case 'score_update': return <TrendingUp size={14} />;
    case 'engagement_logged': return <MessageSquare size={14} />;
    case 'approval': return <CheckCircle size={14} />;
    case 'watchlist_alert': return <AlertTriangle size={14} />;
    case 'plan_created': return <FileText size={14} />;
    case 'evidence_added': return <Shield size={14} />;
    default: return <FileText size={14} />;
  }
}
function dotColor(type: string) {
  switch (type) {
    case 'score_update': return 'var(--brand-primary)';
    case 'engagement_logged': return '#2563EB';
    case 'approval': return 'var(--status-success)';
    case 'watchlist_alert': return 'var(--status-warning)';
    case 'evidence_added': return '#7C3AED';
    default: return 'var(--text-muted)';
  }
}

export default function TeamActivity() {
  const activityFeed = useAppStore(s => s.activityFeed);
  const storeUsers = useAppStore(s => s.storeUsers);
  const snapshots = useAppStore(s => s.snapshots);
  const engagements = useAppStore(s => s.engagements);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const me = useCurrentUser();

  const [filterUser, setFilterUser] = useState<string | null>(null);

  const team = useMemo(
    () => storeUsers.filter(u => ['analyst', 'lead', 'partner', 'viewer'].includes(u.role) && (me?.role === 'partner' || me?.role === 'admin' || u.role !== 'partner')),
    [storeUsers, me]
  );

  const stats = useMemo(() => {
    const m: Record<string, { scored: number; engaged: number; pending: number; last: string | null }> = {};
    for (const u of team) {
      const scored = snapshots.filter(s => s.scored_by === u.id).length;
      const engaged = engagements.filter(e => e.logged_by === u.id).length;
      const pending = snapshots.filter(s => s.scored_by === u.id && s.workflow_status === 'submitted').length;
      const acts = activityFeed.filter(a => a.user_id === u.id);
      const last = acts.length ? acts.map(a => a.timestamp).sort().reverse()[0] : null;
      m[u.id] = { scored, engaged, pending, last };
    }
    return m;
  }, [team, snapshots, engagements, activityFeed]);

  const feed = useMemo(
    () => (filterUser ? activityFeed.filter(a => a.user_id === filterUser) : activityFeed).slice(0, 40),
    [activityFeed, filterUser]
  );

  const userName = (id: string) => storeUsers.find(u => u.id === id)?.display_name ?? id;
  const stakeholder = (id: string | null) => id ? storeStakeholders.find(s => s.id === id) : undefined;

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>Team Activity</h1>
        <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Oversight of what the team is doing across all campaigns — scores submitted, engagements logged and items awaiting approval.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(u => {
          const st = stats[u.id];
          const selected = filterUser === u.id;
          return (
            <button
              key={u.id}
              onClick={() => setFilterUser(selected ? null : u.id)}
              className="text-left rounded-xl p-4 transition-all card-hover"
              style={{ background: 'var(--bg-elevated)', border: `1px solid ${selected ? 'var(--brand-primary)' : 'var(--border-default)'}`, boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center gap-3">
                <Portrait name={u.display_name} gender={u.gender} portraitUrl={u.portrait_url} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-heading-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.display_name}</span>
                    {u.id === me?.id && <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>(you)</span>}
                  </div>
                  <span className="inline-block px-1.5 py-0.5 rounded mt-0.5" style={{ background: `${ROLE_COLORS[u.role]}1A`, color: ROLE_COLORS[u.role], fontSize: '0.5625rem', fontWeight: 700 }}>{ROLE_LABELS[u.role]}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Stat label="Scored" value={st.scored} />
                <Stat label="Engaged" value={st.engaged} />
                <Stat label="Pending" value={st.pending} warn={st.pending > 0} />
              </div>
              <div className="mt-2" style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                {st.last ? `Last active ${formatRelativeDate(st.last)}` : 'No recent activity'}
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-md flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ActivityIcon size={18} style={{ color: 'var(--brand-primary)' }} /> Activity Stream
            {filterUser && <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>· {userName(filterUser)}</span>}
          </h2>
          {filterUser && (
            <button onClick={() => setFilterUser(null)} className="text-body-sm" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Clear filter</button>
          )}
        </div>
        {feed.length === 0 ? (
          <EmptyState title="No activity" description="There is no recorded activity for this filter yet." />
        ) : (
          <div className="space-y-0">
            {feed.map(a => {
              const st = stakeholder(a.stakeholder_id);
              return (
                <div key={a.id} className="flex items-start gap-3 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `color-mix(in srgb, ${dotColor(a.type)} 14%, transparent)`, color: dotColor(a.type) }}>
                    {icon(a.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 600 }}>{userName(a.user_id)}</span> · {a.description}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      <span>{formatRelativeDate(a.timestamp)}</span>
                      {st && (
                        <>
                          <span>·</span>
                          <button onClick={() => setSelectedStakeholder(st.id)} className="hover:underline" style={{ color: 'var(--accent-primary)' }}>{st.full_name}</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-secondary)' }}>
      <div className="font-display" style={{ fontSize: '1.125rem', color: warn ? 'var(--status-warning)' : 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div className="text-label mt-1" style={{ fontSize: '0.5rem' }}>{label}</div>
    </div>
  );
}
