import { useMemo, useState } from 'react';
import {
  MessageSquare, Phone, Mail, Calendar, Users, ListChecks, LayoutList,
  Sparkles, ArrowRight, Clock, Search,
} from 'lucide-react';
import { useAppStore, useActingRole, useStakeholdersWithScores } from '../lib/store';
import { NOW } from '../lib/constants';
import { differenceInDays, parseISO } from 'date-fns';
import { Card, EngagementTypeBadge, OutcomeBadge, EmptyState, QuadrantBadge } from '../components/ui/Badges';
import Portrait from '../components/ui/Portrait';
import { formatDate } from '../lib/formatters';
import type { Quadrant } from '../lib/types';

type EngType = 'meeting' | 'phone_call' | 'email' | 'event' | 'social' | 'third_party_intro' | 'formal_submission';
type FilterType = '' | EngType;
type FilterOutcome = '' | 'positive' | 'neutral' | 'negative' | 'pending';
type ViewMode = 'activity' | 'stakeholder';

interface Suggestion {
  type: EngType;
  label: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export default function Engagements() {
  const allEngagements = useAppStore(s => s.engagements);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const scoredStakeholders = useStakeholdersWithScores();
  const currentCampaignId = useAppStore(s => s.currentCampaignId);
  const currentUserId = useAppStore(s => s.currentUserId);
  const openEngagementDetail = useAppStore(s => s.openEngagementDetail);
  const openLogEngagement = useAppStore(s => s.openLogEngagement);
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const role = useActingRole();
  const [view, setView] = useState<ViewMode>('activity');
  const [typeFilter, setTypeFilter] = useState<FilterType>('');
  const [outcomeFilter, setOutcomeFilter] = useState<FilterOutcome>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [planSearch, setPlanSearch] = useState('');

  // Scope to the active campaign and hide engagements tied to partner-restricted
  // VIP stakeholders the current user does not own (admins see all).
  const engagements = useMemo(() => {
    const visibleIds = new Set(
      storeStakeholders
        .filter(s => s.campaign_id === currentCampaignId && (!s.vip_owner_id || s.vip_owner_id === currentUserId || role === 'admin'))
        .map(s => s.id)
    );
    return allEngagements.filter(e => visibleIds.has(e.stakeholder_id));
  }, [allEngagements, storeStakeholders, currentCampaignId, currentUserId, role]);

  const filtered = useMemo(() => {
    let result = [...engagements];
    if (typeFilter) result = result.filter(e => e.engagement_type === typeFilter);
    if (outcomeFilter) result = result.filter(e => e.outcome === outcomeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => {
        const s = storeStakeholders.find(st => st.id === e.stakeholder_id);
        return s?.full_name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
      });
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [typeFilter, outcomeFilter, searchQuery, engagements, storeStakeholders]);

  const stats = useMemo(() => {
    const thisMonth = engagements.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === NOW.getMonth() && d.getFullYear() === NOW.getFullYear();
    });
    const pendingFollowups = engagements.filter(e => e.follow_up_required && e.follow_up_date);
    const positiveRate = engagements.length > 0
      ? Math.round((engagements.filter(e => e.outcome === 'positive').length / engagements.length) * 100)
      : 0;
    return {
      total: engagements.length,
      thisMonth: thisMonth.length,
      pendingFollowups: pendingFollowups.length,
      positiveRate,
    };
  }, [engagements]);

  // Per-stakeholder rollup with derived "possible next engagements".
  const byStakeholder = useMemo(() => {
    const visible = scoredStakeholders.filter(s =>
      s.campaign_id === currentCampaignId && (!s.vip_owner_id || s.vip_owner_id === currentUserId || role === 'admin')
    );
    const rows = visible.map(s => {
      const engs = allEngagements
        .filter(e => e.stakeholder_id === s.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const channels = new Set<EngType>(engs.map(e => e.engagement_type));
      const lastDate = engs[0]?.date ?? null;
      const daysSinceLast = lastDate ? differenceInDays(NOW, parseISO(lastDate)) : null;
      const quadrant = (s.latestSnapshot?.quadrant ?? 'monitor_exit') as Quadrant;
      const suggestions = buildSuggestions(quadrant, daysSinceLast, channels);
      return { stakeholder: s, count: engs.length, lastDate, daysSinceLast, suggestions };
    });
    const q = planSearch.trim().toLowerCase();
    const matched = q
      ? rows.filter(r => r.stakeholder.full_name.toLowerCase().includes(q) || r.stakeholder.organization.toLowerCase().includes(q))
      : rows;
    // Surface the stakeholders most in need of action first.
    return matched.sort((a, b) => {
      const aw = a.suggestions.some(s => s.priority === 'high') ? 1 : 0;
      const bw = b.suggestions.some(s => s.priority === 'high') ? 1 : 0;
      if (aw !== bw) return bw - aw;
      return (b.daysSinceLast ?? 9999) - (a.daysSinceLast ?? 9999);
    });
  }, [scoredStakeholders, allEngagements, currentCampaignId, currentUserId, role, planSearch]);

  const getStakeholderName = (id: string) => storeStakeholders.find(s => s.id === id)?.full_name ?? 'Unknown';
  const getStakeholderOrg = (id: string) => storeStakeholders.find(s => s.id === id)?.organization ?? '';

  const typeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users size={14} />;
      case 'phone_call': return <Phone size={14} />;
      case 'email': return <Mail size={14} />;
      case 'event': return <Calendar size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Engagements</h1>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Track and manage all stakeholder interactions
          </p>
        </div>
        <button
          onClick={() => openLogEngagement()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--text-primary)', color: 'white' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
        >
          <MessageSquare size={14} /> Log Engagement
        </button>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
        {([
          { id: 'activity', label: 'Activity log', icon: LayoutList },
          { id: 'stakeholder', label: 'By stakeholder', icon: ListChecks },
        ] as { id: ViewMode; label: string; icon: typeof LayoutList }[]).map(t => {
          const on = view === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setView(t.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all"
              style={{ background: on ? 'var(--gradient-brand)' : 'transparent', color: on ? 'white' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Engagements', value: stats.total },
          { label: 'This Month', value: stats.thisMonth },
          { label: 'Pending Follow-ups', value: stats.pendingFollowups },
          { label: 'Positive Outcome Rate', value: `${stats.positiveRate}%` },
        ].map(s => (
          <Card key={s.label} className="!p-4">
            <div className="text-label mb-1">{s.label}</div>
            <div className="text-metric-sm" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {view === 'activity' && (<>
      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Search engagements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg pl-3 pr-3 py-2 text-body-sm outline-none"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="rounded-lg px-3 py-2 text-body-sm outline-none"
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <option value="">All Types</option>
            <option value="meeting">Meeting</option>
            <option value="phone_call">Phone Call</option>
            <option value="email">Email</option>
            <option value="event">Event</option>
            <option value="formal_submission">Formal Submission</option>
          </select>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as FilterOutcome)}
            className="rounded-lg px-3 py-2 text-body-sm outline-none"
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <option value="">All Outcomes</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </Card>

      {/* Engagement Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 800 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th className="text-label text-left px-4 py-3">Date</th>
                <th className="text-label text-left px-4 py-3">Stakeholder</th>
                <th className="text-label text-left px-4 py-3">Type</th>
                <th className="text-label text-left px-4 py-3">Description</th>
                <th className="text-label text-left px-4 py-3">Outcome</th>
                <th className="text-label text-left px-4 py-3">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="transition-colors cursor-pointer stagger-item row-hover"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onClick={() => openEngagementDetail(e.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(e.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {(() => { const st = storeStakeholders.find(s => s.id === e.stakeholder_id); return st ? <Portrait name={st.full_name} gender={st.gender} portraitUrl={st.portrait_url} size={28} /> : null; })()}
                      <div>
                        <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{getStakeholderName(e.stakeholder_id)}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{getStakeholderOrg(e.stakeholder_id)}</span>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); setSelectedStakeholder(e.stakeholder_id); }}
                            className="text-body-sm transition-colors"
                            style={{ color: 'var(--accent-primary)', fontSize: '0.6875rem' }}
                          >View</button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      {typeIcon(e.engagement_type)}
                      <EngagementTypeBadge type={e.engagement_type} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {e.description}
                  </td>
                  <td className="px-4 py-3"><OutcomeBadge outcome={e.outcome} /></td>
                  <td className="px-4 py-3 text-body-sm" style={{ color: e.follow_up_required ? 'var(--status-warning)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {e.follow_up_required && e.follow_up_date ? formatDate(e.follow_up_date) : '--'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No engagements found" description="Adjust filters or log a new engagement." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>)}

      {/* By-stakeholder view: possible next engagements per contact */}
      {view === 'stakeholder' && (
        <>
          <Card className="!p-4">
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search stakeholders by name or organisation..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                className="w-full rounded-lg pl-9 pr-3 py-2 text-body-sm outline-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {byStakeholder.map(({ stakeholder: s, count, daysSinceLast, suggestions }) => (
              <Card key={s.id} className="!p-4 stagger-item">
                <div className="flex items-start gap-3">
                  <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => setSelectedStakeholder(s.id)} className="text-heading-sm text-left truncate" style={{ color: 'var(--text-primary)' }}>
                        {s.full_name}
                      </button>
                      {s.latestSnapshot && <QuadrantBadge quadrant={s.latestSnapshot.quadrant} size="sm" />}
                    </div>
                    <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{s.title} · {s.organization}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-body-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem' }}>
                        <MessageSquare size={11} /> {count} logged
                      </span>
                      <span className="flex items-center gap-1 text-body-sm" style={{ color: daysSinceLast !== null && daysSinceLast > 45 ? 'var(--status-warning)' : 'var(--text-secondary)', fontSize: '0.6875rem' }}>
                        <Clock size={11} /> {daysSinceLast === null ? 'No contact yet' : `${daysSinceLast}d since last`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} style={{ color: 'var(--brand-primary)' }} />
                    <span className="text-label" style={{ fontSize: '0.5625rem' }}>Possible next engagements</span>
                  </div>
                  <div className="space-y-1.5">
                    {suggestions.map((sg, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'var(--bg-secondary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sg.priority === 'high' ? 'var(--status-danger)' : sg.priority === 'medium' ? 'var(--status-warning)' : 'var(--brand-primary)' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-body-sm" style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{sg.label}</div>
                          <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{sg.rationale}</div>
                        </div>
                        <button
                          onClick={() => openLogEngagement(s.id)}
                          className="flex items-center gap-1 rounded-md btn-press shrink-0"
                          style={{ padding: '5px 10px', background: 'rgba(45,166,126,0.1)', color: 'var(--brand-primary)', fontSize: '0.625rem', fontWeight: 700 }}
                        >
                          Log <ArrowRight size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
            {byStakeholder.length === 0 && (
              <div className="lg:col-span-2">
                <EmptyState title="No stakeholders found" description="Adjust your search to see suggested engagements." />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const ENG_LABELS: Record<EngType, string> = {
  meeting: 'meeting', phone_call: 'call', email: 'email', event: 'event',
  social: 'social touchpoint', third_party_intro: 'third-party introduction', formal_submission: 'formal submission',
};

// Derive sensible next engagements from quadrant, recency and channels already used.
function buildSuggestions(quadrant: Quadrant, daysSinceLast: number | null, channels: Set<EngType>): Suggestion[] {
  const out: Suggestion[] = [];

  if (daysSinceLast === null) {
    out.push({ type: 'meeting', label: 'Schedule an introductory meeting', rationale: 'No engagement logged yet — open the relationship.', priority: 'high' });
  } else if (daysSinceLast > 60) {
    out.push({ type: 'phone_call', label: 'Re-establish contact', rationale: `No touchpoint in ${daysSinceLast} days — relationship is going cold.`, priority: 'high' });
  } else if (daysSinceLast > 30) {
    out.push({ type: 'email', label: 'Send a check-in note', rationale: `Last contact ${daysSinceLast} days ago — keep momentum warm.`, priority: 'medium' });
  }

  switch (quadrant) {
    case 'strategic_ally':
      out.push({ type: 'meeting', label: 'Invite to a private briefing', rationale: 'High-value ally — deepen the partnership and co-create.', priority: 'medium' });
      out.push({ type: 'formal_submission', label: 'Co-author a position note', rationale: 'Leverage their influence with a joint formal input.', priority: 'low' });
      break;
    case 'power_gap':
      out.push({ type: 'meeting', label: 'Request an exploratory meeting', rationale: 'Influential but unconvinced — priority conversion target.', priority: 'high' });
      out.push({ type: 'email', label: 'Share an evidence brief', rationale: 'Address concerns with tailored evidence to shift stance.', priority: 'medium' });
      break;
    case 'hidden_champion':
      out.push({ type: 'event', label: 'Amplify their voice at an event', rationale: 'Supportive — give them a bigger platform.', priority: 'medium' });
      out.push({ type: 'third_party_intro', label: 'Connect them with allies', rationale: 'Broker introductions to grow their influence.', priority: 'low' });
      break;
    case 'monitor_exit':
      out.push({ type: 'email', label: 'Light-touch monitoring email', rationale: 'Low priority — maintain minimal presence.', priority: 'low' });
      break;
  }

  // Encourage diversifying channels if only one has been used.
  if (channels.size === 1) {
    const used = [...channels][0];
    const alt: EngType = used === 'email' ? 'meeting' : 'email';
    out.push({ type: alt, label: `Try a ${ENG_LABELS[alt]} instead`, rationale: `Only ${ENG_LABELS[used]}s so far — vary the channel for impact.`, priority: 'low' });
  }

  // De-duplicate by label and cap the list.
  const seen = new Set<string>();
  return out.filter(s => (seen.has(s.label) ? false : (seen.add(s.label), true))).slice(0, 4);
}
