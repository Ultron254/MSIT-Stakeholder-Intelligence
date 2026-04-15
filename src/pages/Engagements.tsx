import { useMemo, useState } from 'react';
import { MessageSquare, Phone, Mail, Calendar, Users } from 'lucide-react';
import { useAppStore, engagementRecords, stakeholders } from '../lib/store';
import { NOW } from '../lib/constants';
import { Card, EngagementTypeBadge, OutcomeBadge, EmptyState } from '../components/ui/Badges';
import { formatDate } from '../lib/formatters';

type FilterType = '' | 'meeting' | 'phone_call' | 'email' | 'event' | 'social' | 'third_party_intro' | 'formal_submission';
type FilterOutcome = '' | 'positive' | 'neutral' | 'negative' | 'pending';

export default function Engagements() {
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const [typeFilter, setTypeFilter] = useState<FilterType>('');
  const [outcomeFilter, setOutcomeFilter] = useState<FilterOutcome>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = [...engagementRecords];
    if (typeFilter) result = result.filter(e => e.engagement_type === typeFilter);
    if (outcomeFilter) result = result.filter(e => e.outcome === outcomeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => {
        const s = stakeholders.find(st => st.id === e.stakeholder_id);
        return s?.full_name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
      });
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [typeFilter, outcomeFilter, searchQuery]);

  const stats = useMemo(() => {
    const thisMonth = engagementRecords.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === NOW.getMonth() && d.getFullYear() === NOW.getFullYear();
    });
    const pendingFollowups = engagementRecords.filter(e => e.follow_up_required && e.follow_up_date);
    const positiveRate = engagementRecords.length > 0
      ? Math.round((engagementRecords.filter(e => e.outcome === 'positive').length / engagementRecords.length) * 100)
      : 0;
    return {
      total: engagementRecords.length,
      thisMonth: thisMonth.length,
      pendingFollowups: pendingFollowups.length,
      positiveRate,
    };
  }, []);

  const getStakeholderName = (id: string) => stakeholders.find(s => s.id === id)?.full_name ?? 'Unknown';
  const getStakeholderOrg = (id: string) => stakeholders.find(s => s.id === id)?.organization ?? '';

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
      <div>
        <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Engagements</h1>
        <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Track and manage all stakeholder interactions
        </p>
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
              {filtered.map((e, i) => (
                <tr
                  key={e.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 1 ? 'var(--bg-primary)' : 'transparent' }}
                  onClick={() => setSelectedStakeholder(e.stakeholder_id)}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = i % 2 === 1 ? 'var(--bg-primary)' : 'transparent'; }}
                >
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(e.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{getStakeholderName(e.stakeholder_id)}</div>
                    <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{getStakeholderOrg(e.stakeholder_id)}</div>
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
    </div>
  );
}
