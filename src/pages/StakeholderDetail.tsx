import { useMemo, useState } from 'react';
import {
  ArrowLeft, Edit3, MessageSquare, AlertTriangle, Shield, Clock,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useAppStore, engagementRecords, evidenceRecords, engagementPlans } from '../lib/store';
import { Card, QuadrantBadge, SISBadge, ConfidenceBadge, SectorBadge, LayerIndicator, ScoreBar, WorkflowBadge, EngagementTypeBadge, OutcomeBadge, EmptyState } from '../components/ui/Badges';
import { QUADRANT_COLORS, COMPONENT_DESCRIPTIONS } from '../lib/types';
import type { Quadrant, Component } from '../lib/types';
import { formatRelativeDate, formatDate, formatSIS, formatAxis, formatLayer } from '../lib/formatters';
import { getSISColor } from '../lib/scoring-engine';

type Tab = 'overview' | 'engagements' | 'evidence' | 'history' | 'plan';

export default function StakeholderDetail() {
  const { selectedStakeholderId, setPage, openScoreUpdate } = useAppStore();
  const all = useAppStore(s => s.getStakeholdersWithScores());
  const snapshots = useAppStore(s => s.snapshots);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const stakeholder = useMemo(() => all.find(s => s.id === selectedStakeholderId), [all, selectedStakeholderId]);

  if (!stakeholder) {
    return (
      <div className="page-enter py-16 text-center">
        <p className="text-body" style={{ color: 'var(--text-muted)' }}>Stakeholder not found</p>
        <button onClick={() => setPage('stakeholders')} className="text-body-sm mt-2" style={{ color: 'var(--accent-primary)' }}>Return to list</button>
      </div>
    );
  }

  const snap = stakeholder.latestSnapshot;
  const stakeSnapshots = snapshots
    .filter(s => s.stakeholder_id === stakeholder.id)
    .sort((a, b) => new Date(a.scored_at).getTime() - new Date(b.scored_at).getTime());
  const stakeEngagements = engagementRecords
    .filter(e => e.stakeholder_id === stakeholder.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const stakeEvidence = evidenceRecords
    .filter(e => e.stakeholder_id === stakeholder.id)
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  const plan = engagementPlans.find(p => p.stakeholder_id === stakeholder.id);
  const qColor = snap ? QUADRANT_COLORS[snap.quadrant] : QUADRANT_COLORS.monitor_exit;

  // Radar data
  const radarData = snap ? [
    { component: 'Influence', value: snap.influence_score, fullMark: 5 },
    { component: 'Relationship', value: snap.relationship_score, fullMark: 5 },
    { component: 'Risk Adj.', value: snap.risk_adjusted, fullMark: 5 },
    { component: 'Sentiment', value: snap.sentiment_score, fullMark: 5 },
    { component: 'Alignment', value: snap.alignment_score, fullMark: 5 },
    { component: 'Impact', value: snap.impact_score, fullMark: 5 },
  ] : [];

  // Score components for breakdown
  const scoreComponents: { key: Component; label: string; value: number; description: string }[] = snap ? [
    { key: 'influence', label: 'Influence', value: snap.influence_score, description: COMPONENT_DESCRIPTIONS.influence },
    { key: 'relationship', label: 'Relationship', value: snap.relationship_score, description: COMPONENT_DESCRIPTIONS.relationship },
    { key: 'risk', label: 'Risk', value: snap.risk_score, description: COMPONENT_DESCRIPTIONS.risk },
    { key: 'sentiment', label: 'Sentiment', value: snap.sentiment_score, description: COMPONENT_DESCRIPTIONS.sentiment },
    { key: 'alignment', label: 'Alignment', value: snap.alignment_score, description: COMPONENT_DESCRIPTIONS.alignment },
    { key: 'impact', label: 'Impact', value: snap.impact_score, description: COMPONENT_DESCRIPTIONS.impact },
  ] : [];

  // SIS history line data
  const historyData = stakeSnapshots.map(s => ({
    date: formatDate(s.scored_at),
    sis: s.sis_score,
  }));

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'engagements', label: 'Engagements', count: stakeEngagements.length },
    { id: 'evidence', label: 'Evidence', count: stakeEvidence.length },
    { id: 'history', label: 'Score History', count: stakeSnapshots.length },
    { id: 'plan', label: 'Engagement Plan' },
  ];

  return (
    <div className="page-enter space-y-5">
      {/* Back button */}
      <button
        onClick={() => setPage('stakeholders')}
        className="flex items-center gap-1.5 text-body-sm transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <ArrowLeft size={16} /> Back to Stakeholders
      </button>

      {/* Profile Header */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1">
          <h1 className="text-display-md" style={{ color: 'var(--text-primary)' }}>{stakeholder.full_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-body" style={{ color: 'var(--text-secondary)' }}>{stakeholder.title}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="text-body" style={{ color: 'var(--text-secondary)' }}>{stakeholder.organization}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <SectorBadge sector={stakeholder.sector} />
            <LayerIndicator layer={stakeholder.proximity_layer} />
            {stakeholder.sensitivity_flag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.6875rem', fontWeight: 500 }}>
                <Shield size={11} /> Sensitive
              </span>
            )}
          </div>
        </div>

        {/* Score display */}
        <div className="flex items-center gap-6">
          {snap && (
            <>
              <div className="text-center">
                <div className="text-label mb-1">SIS Score</div>
                <div className="text-metric" style={{ color: getSISColor(snap.sis_score) }}>{formatSIS(snap.sis_score)}</div>
              </div>
              <div className="text-center">
                <div className="text-label mb-1">Quadrant</div>
                <QuadrantBadge quadrant={snap.quadrant} />
              </div>
              <div className="text-center">
                <div className="text-label mb-1">Confidence</div>
                <ConfidenceBadge confidence={snap.overall_confidence} />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => openScoreUpdate(stakeholder.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--text-primary)', color: 'white' }}
          >
            <Edit3 size={14} /> Update Scores
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
          >
            <MessageSquare size={14} /> Log Engagement
          </button>
        </div>
      </div>

      {snap && (
        <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
          Last assessed {formatRelativeDate(snap.scored_at)} by {snap.scored_by === 'u-001' ? 'Sarah Wanjiku' : 'James Ochieng'}
          {' · '}Power: {formatAxis(snap.power_axis)} · Convertibility: {formatAxis(snap.convertibility_axis)}
        </div>
      )}

      {/* Red Flags */}
      {stakeholder.redFlags.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: '#92400E' }} />
            <span className="text-heading-sm" style={{ color: '#92400E' }}>Red Flags Detected</span>
          </div>
          <div className="space-y-1">
            {stakeholder.redFlags.map((f, i) => (
              <div key={i} className="text-body-sm" style={{ color: '#78350F' }}>{f.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'var(--border-default)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--accent-primary)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="page-enter">
        {activeTab === 'overview' && snap && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Left: Score breakdown */}
            <div className="xl:col-span-3 space-y-6">
              <Card>
                <h3 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Score Breakdown</h3>
                <div className="space-y-4">
                  {scoreComponents.map(sc => (
                    <div key={sc.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{sc.label}</span>
                        <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{sc.value}/5</span>
                      </div>
                      <ScoreBar value={sc.value} color={qColor.dot} />
                      <div className="text-body-sm mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{sc.description}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t flex gap-6" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <span className="text-label">Power Axis</span>
                    <div className="font-mono text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatAxis(snap.power_axis)}</div>
                  </div>
                  <div>
                    <span className="text-label">Convertibility Axis</span>
                    <div className="font-mono text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatAxis(snap.convertibility_axis)}</div>
                  </div>
                  <div>
                    <span className="text-label">Risk Adjusted</span>
                    <div className="font-mono text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{snap.risk_adjusted}/5</div>
                  </div>
                </div>
              </Card>

              {/* SIS History Chart */}
              {historyData.length > 1 && (
                <Card>
                  <h3 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>SIS Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: 8, color: 'var(--text-inverse)', fontSize: '0.8125rem' }}
                      />
                      <Line type="monotone" dataKey="sis" stroke={qColor.dot} strokeWidth={2} dot={{ r: 4, fill: qColor.dot }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Profile Info */}
              <Card>
                <h3 className="text-heading-md mb-4" style={{ color: 'var(--text-primary)' }}>Profile Information</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  {[
                    ['Full Name', stakeholder.full_name],
                    ['Title', stakeholder.title],
                    ['Organization', stakeholder.organization],
                    ['Sector', stakeholder.sector.replace('_', ' ')],
                    ['Proximity Layer', formatLayer(stakeholder.proximity_layer)],
                    ['Sensitivity', stakeholder.sensitivity_flag ? 'Flagged' : 'Standard'],
                    ['Status', stakeholder.status],
                    ['Created', formatDate(stakeholder.created_at)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-label mb-0.5">{label}</div>
                      <div className="text-body-sm capitalize" style={{ color: 'var(--text-primary)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Radar + Plan */}
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <h3 className="text-heading-md mb-2" style={{ color: 'var(--text-primary)' }}>Score Profile</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-default)" />
                    <PolarAngleAxis dataKey="component" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke={qColor.dot}
                      fill={qColor.dot}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {plan && (
                <Card>
                  <h3 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Engagement Plan</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-label mb-1">Approach</div>
                      <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{plan.approach}</div>
                    </div>
                    {plan.target_quadrant && (
                      <div className="flex items-center gap-2">
                        <div className="text-label">Target</div>
                        <QuadrantBadge quadrant={plan.target_quadrant} size="sm" />
                      </div>
                    )}
                    <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--bg-secondary)' }}>
                      <div>
                        <div className="text-label mb-0.5">30-Day</div>
                        <div className="text-body-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{plan.plan_30_day}</div>
                      </div>
                      <div>
                        <div className="text-label mb-0.5">60-Day</div>
                        <div className="text-body-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{plan.plan_60_day}</div>
                      </div>
                      <div>
                        <div className="text-label mb-0.5">90-Day</div>
                        <div className="text-body-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{plan.plan_90_day}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Related stakeholders */}
              <Card>
                <h3 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Related Stakeholders</h3>
                <div className="space-y-1.5">
                  {all
                    .filter(s => s.id !== stakeholder.id && (s.sector === stakeholder.sector || s.organization === stakeholder.organization))
                    .slice(0, 5)
                    .map(s => (
                      <button
                        key={s.id}
                        onClick={() => useAppStore.getState().setSelectedStakeholder(s.id)}
                        className="w-full flex items-center justify-between py-1.5 px-2 rounded-md text-left transition-colors"
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="min-w-0">
                          <div className="text-body-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.full_name}</div>
                          <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{s.organization}</div>
                        </div>
                        {s.latestSnapshot && <SISBadge score={s.latestSnapshot.sis_score} size="sm" />}
                      </button>
                    ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'engagements' && (
          <Card>
            {stakeEngagements.length === 0 ? (
              <EmptyState title="No engagements recorded" description="Log an engagement to start tracking interactions with this stakeholder." />
            ) : (
              <div className="space-y-0">
                {stakeEngagements.map(e => (
                  <div key={e.id} className="flex items-start gap-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="text-body-sm whitespace-nowrap font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: 80 }}>
                      {formatDate(e.date)}
                    </div>
                    <EngagementTypeBadge type={e.engagement_type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-body-sm" style={{ color: 'var(--text-primary)' }}>{e.description}</div>
                      {e.follow_up_required && e.follow_up_date && (
                        <div className="text-body-sm mt-1 flex items-center gap-1" style={{ color: 'var(--status-warning)', fontSize: '0.75rem' }}>
                          <Clock size={12} /> Follow-up: {formatDate(e.follow_up_date)}
                        </div>
                      )}
                    </div>
                    <OutcomeBadge outcome={e.outcome} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'evidence' && (
          <Card>
            {stakeEvidence.length === 0 ? (
              <EmptyState title="No evidence recorded" description="Add evidence records to support scoring decisions for this stakeholder." />
            ) : (
              <div className="space-y-0">
                {stakeEvidence.map(e => (
                  <div key={e.id} className="flex items-start gap-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="text-body-sm whitespace-nowrap font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: 80 }}>
                      {formatDate(e.recorded_at)}
                    </div>
                    <EngagementTypeBadge type={e.evidence_type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{e.title}</div>
                      <div className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{e.description}</div>
                    </div>
                    <ConfidenceBadge confidence={e.confidence_contribution} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th className="text-label text-left px-4 py-2.5">Version</th>
                    <th className="text-label text-left px-4 py-2.5">Date</th>
                    <th className="text-label text-right px-4 py-2.5">SIS</th>
                    <th className="text-label text-left px-4 py-2.5">Quadrant</th>
                    <th className="text-label text-center px-4 py-2.5">I</th>
                    <th className="text-label text-center px-4 py-2.5">R</th>
                    <th className="text-label text-center px-4 py-2.5">K</th>
                    <th className="text-label text-center px-4 py-2.5">S</th>
                    <th className="text-label text-center px-4 py-2.5">A</th>
                    <th className="text-label text-center px-4 py-2.5">M</th>
                    <th className="text-label text-center px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stakeSnapshots.slice().reverse().map((s, i) => (
                    <tr key={s.id} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="px-4 py-2.5 text-body-sm font-mono" style={{ color: 'var(--text-secondary)' }}>v{stakeSnapshots.length - i}</td>
                      <td className="px-4 py-2.5 text-body-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(s.scored_at)}</td>
                      <td className="px-4 py-2.5 text-right"><SISBadge score={s.sis_score} size="sm" /></td>
                      <td className="px-4 py-2.5"><QuadrantBadge quadrant={s.quadrant} size="sm" /></td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{s.influence_score}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{s.relationship_score}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{s.risk_score}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{s.sentiment_score}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{s.alignment_score}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{s.impact_score}</td>
                      <td className="px-4 py-2.5 text-center"><WorkflowBadge status={s.workflow_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'plan' && (
          <div>
            {plan ? (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-label mb-1">Current Quadrant</div>
                    <QuadrantBadge quadrant={plan.current_quadrant as Quadrant} />
                  </div>
                  {plan.target_quadrant && (
                    <div>
                      <div className="text-label mb-1">Target Quadrant</div>
                      <QuadrantBadge quadrant={plan.target_quadrant} />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <div className="text-label mb-1">Strategic Approach</div>
                    <div className="text-body" style={{ color: 'var(--text-secondary)' }}>{plan.approach}</div>
                  </div>
                  <div>
                    <div className="text-label mb-1">30-Day Plan</div>
                    <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{plan.plan_30_day}</div>
                  </div>
                  <div>
                    <div className="text-label mb-1">60-Day Plan</div>
                    <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{plan.plan_60_day}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-label mb-1">90-Day Plan</div>
                    <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{plan.plan_90_day}</div>
                  </div>
                  <div>
                    <div className="text-label mb-1">Status</div>
                    <span className="text-body-sm capitalize" style={{ color: plan.status === 'active' ? 'var(--status-success)' : 'var(--text-muted)' }}>{plan.status}</span>
                  </div>
                </div>
              </Card>
            ) : (
              <EmptyState title="No engagement plan" description="Create a 30/60/90 day plan for this stakeholder." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
