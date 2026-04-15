import { useMemo } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  AlertTriangle, TrendingUp, ArrowRight,
  FileText, MessageSquare, Shield, CheckCircle,
} from 'lucide-react';
import { useAppStore, objectives, watchlistSignals, activityFeed } from '../lib/store';
import { Card, QuadrantBadge, SISBadge, SeverityBadge } from '../components/ui/Badges';
import { QUADRANT_COLORS, QUADRANT_LABELS } from '../lib/types';
import type { Quadrant } from '../lib/types';
import { formatRelativeDate, formatDate, formatSIS, daysUntil } from '../lib/formatters';

export default function Dashboard() {
  const all = useAppStore(s => s.getStakeholdersWithScores());
  const setPage = useAppStore(s => s.setPage);
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);

  const objective = objectives[0];
  const daysLeft = daysUntil(objective.target_date);

  // Portfolio stats
  const stats = useMemo(() => {
    const scored = all.filter(s => s.latestSnapshot);
    const avgSIS = scored.length > 0 ? scored.reduce((sum, s) => sum + (s.latestSnapshot?.sis_score ?? 0), 0) / scored.length : 0;
    const quadrantCounts: Record<Quadrant, number> = { strategic_ally: 0, power_gap: 0, hidden_champion: 0, monitor_exit: 0 };
    scored.forEach(s => { if (s.latestSnapshot) quadrantCounts[s.latestSnapshot.quadrant]++; });
    const alerts = watchlistSignals.filter(w => !w.is_resolved);
    const totalFlags = all.reduce((sum, s) => sum + s.redFlags.length, 0);
    return { total: all.length, avgSIS, quadrantCounts, activeAlerts: alerts.length, totalFlags };
  }, [all]);

  // Quadrant distribution data
  const quadrantData = useMemo(() => {
    const order: Quadrant[] = ['strategic_ally', 'power_gap', 'hidden_champion', 'monitor_exit'];
    return order.map(q => ({
      name: QUADRANT_LABELS[q],
      quadrant: q,
      count: stats.quadrantCounts[q],
      color: QUADRANT_COLORS[q].dot,
      bgColor: QUADRANT_COLORS[q].bg,
    }));
  }, [stats]);

  // Top priority stakeholders (strategic allies + power gaps by SIS desc)
  const priorityStakeholders = useMemo(() => {
    return all
      .filter(s => s.latestSnapshot && ['strategic_ally', 'power_gap'].includes(s.latestSnapshot.quadrant))
      .sort((a, b) => (b.latestSnapshot?.sis_score ?? 0) - (a.latestSnapshot?.sis_score ?? 0))
      .slice(0, 6);
  }, [all]);

  // Priority actions
  const priorityActions = useMemo(() => {
    const actions: Array<{ type: string; label: string; stakeholder: string; stakeholderId: string; time: string; severity: 'critical'|'high'|'medium' }> = [];
    watchlistSignals.filter(w => !w.is_resolved).forEach(w => {
      const s = all.find(st => st.id === w.stakeholder_id);
      actions.push({
        type: w.signal_type,
        label: w.description.slice(0, 100),
        stakeholder: s?.full_name ?? 'Portfolio',
        stakeholderId: w.stakeholder_id,
        time: formatRelativeDate(w.triggered_at),
        severity: w.severity === 'critical' ? 'critical' : w.severity === 'high' ? 'high' : 'medium',
      });
    });
    return actions.slice(0, 6);
  }, [all]);

  // SIS trend (simulated monthly data)
  const sisTrend = useMemo(() => {
    const months = ['Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'];
    const base = stats.avgSIS;
    return months.map((m, i) => ({
      month: m,
      sis: Math.round((base - 8 + i * 1.6) * 10) / 10,
    }));
  }, [stats.avgSIS]);

  // Activity icons
  const activityIcon = (type: string) => {
    switch (type) {
      case 'score_update': return <TrendingUp size={14} />;
      case 'engagement_logged': return <MessageSquare size={14} />;
      case 'approval': return <CheckCircle size={14} />;
      case 'watchlist_alert': return <AlertTriangle size={14} />;
      case 'plan_created': return <FileText size={14} />;
      case 'evidence_added': return <Shield size={14} />;
      default: return <FileText size={14} />;
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Campaign Strip */}
      <div
        className="flex items-center gap-6 px-5 py-3 rounded-xl text-body-sm flex-wrap"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{objective.name}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>{objective.policy_domain}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>Target: {formatDate(objective.target_date)}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: daysLeft < 90 ? 'var(--status-warning)' : 'var(--text-secondary)', fontWeight: 500 }}>
          {daysLeft} days remaining
        </span>
      </div>

      {/* Portfolio Metrics — asymmetric layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Large metric: Portfolio SIS */}
        <Card className="lg:col-span-5">
          <div className="text-label mb-2">Portfolio Intelligence Score</div>
          <div className="flex items-end gap-3">
            <span className="text-metric" style={{ color: 'var(--text-primary)' }}>
              {formatSIS(stats.avgSIS)}
            </span>
            <span className="text-body-sm mb-1 flex items-center gap-1" style={{ color: 'var(--status-success)' }}>
              <TrendingUp size={14} />+2.4 vs last month
            </span>
          </div>
          <div className="text-body-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Weighted average across {stats.total} active stakeholders
          </div>
        </Card>

        {/* Smaller metrics */}
        <Card className="lg:col-span-2">
          <div className="text-label mb-2">Stakeholders</div>
          <div className="text-metric-sm" style={{ color: 'var(--text-primary)' }}>{stats.total}</div>
          <div className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>7 sectors</div>
        </Card>
        <Card className="lg:col-span-3">
          <div className="text-label mb-2">Quadrant Distribution</div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mt-2 mb-2" style={{ background: 'var(--bg-inset)' }}>
            {quadrantData.map(q => (
              <div
                key={q.quadrant}
                style={{
                  width: `${(q.count / stats.total) * 100}%`,
                  background: q.color,
                  minWidth: q.count > 0 ? 4 : 0,
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {quadrantData.map(q => (
              <span key={q.quadrant} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: q.color }} />
                {q.count}
              </span>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="text-label mb-2">Active Alerts</div>
          <div className="text-metric-sm" style={{ color: stats.activeAlerts > 0 ? 'var(--status-danger)' : 'var(--text-primary)' }}>
            {stats.activeAlerts}
          </div>
          <div className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stats.totalFlags} red flags</div>
        </Card>
      </div>

      {/* Quadrant Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Quadrant Overview</h2>
          <button
            onClick={() => setPage('quadrant-map')}
            className="text-body-sm flex items-center gap-1 transition-colors"
            style={{ color: 'var(--accent-primary)' }}
          >
            View Map <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {quadrantData.map(q => {
            const qStakeholders = all
              .filter(s => s.latestSnapshot?.quadrant === q.quadrant)
              .sort((a, b) => (b.latestSnapshot?.sis_score ?? 0) - (a.latestSnapshot?.sis_score ?? 0))
              .slice(0, 3);
            const avgSIS = qStakeholders.length > 0
              ? qStakeholders.reduce((sum, s) => sum + (s.latestSnapshot?.sis_score ?? 0), 0) / all.filter(s => s.latestSnapshot?.quadrant === q.quadrant).length
              : 0;
            return (
              <div
                key={q.quadrant}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderLeftWidth: 3,
                  borderLeftColor: q.color,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{q.name}</span>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.count}</span>
                </div>
                <div className="text-body-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  Avg SIS: {avgSIS.toFixed(1)}
                </div>
                <div className="space-y-1.5">
                  {qStakeholders.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStakeholder(s.id)}
                      className="w-full flex items-center justify-between text-left rounded-md px-2 py-1 transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span className="text-body-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.full_name}</span>
                      <SISBadge score={s.latestSnapshot?.sis_score ?? 0} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Priority Actions + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Priority Actions */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Priority Actions</h2>
              <button
                onClick={() => setPage('watchlist')}
                className="text-body-sm flex items-center gap-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {priorityActions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => a.stakeholderId && setSelectedStakeholder(a.stakeholderId)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <SeverityBadge severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm" style={{ color: 'var(--text-primary)' }}>{a.label}</div>
                    <div className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.time}</div>
                  </div>
                </button>
              ))}
              {priorityActions.length === 0 && (
                <div className="text-body-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  No priority actions pending
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <Card>
            <h2 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
            <div className="space-y-0">
              {activityFeed.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {activityIcon(a.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>{a.description}</div>
                    <div className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{formatRelativeDate(a.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* SIS Trend + Top Stakeholders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SIS Trend */}
        <Card>
          <h2 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Portfolio SIS Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sisTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-dark)', border: 'none', borderRadius: 8,
                  color: 'var(--text-inverse)', fontSize: '0.8125rem', padding: '8px 12px',
                }}
              />
              <Line type="monotone" dataKey="sis" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent-primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Stakeholders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Top Priority Stakeholders</h2>
            <button onClick={() => setPage('stakeholders')} className="text-body-sm flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-0">
            {priorityStakeholders.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStakeholder(s.id)}
                className="w-full flex items-center gap-3 py-2.5 border-b text-left transition-colors"
                style={{ borderColor: 'var(--border-subtle)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{s.full_name}</div>
                  <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.organization}</div>
                </div>
                <SISBadge score={s.latestSnapshot?.sis_score ?? 0} size="sm" />
                {s.latestSnapshot && <QuadrantBadge quadrant={s.latestSnapshot.quadrant} size="sm" />}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
