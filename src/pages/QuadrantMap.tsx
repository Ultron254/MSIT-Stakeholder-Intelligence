import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea } from 'recharts';
import { useAppStore } from '../lib/store';
import { useStakeholdersWithScores } from '../lib/store';
import { Card, QuadrantBadge, SISBadge } from '../components/ui/Badges';
import Portrait from '../components/ui/Portrait';
import { QUADRANT_COLORS, QUADRANT_LABELS } from '../lib/types';
import type { Quadrant } from '../lib/types';
import { formatSIS, formatAxis } from '../lib/formatters';
import RelationshipNetwork from '../components/RelationshipNetwork';
import { Grid2x2, Share2 } from 'lucide-react';

export default function QuadrantMap() {
  const all = useStakeholdersWithScores();
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [view, setView] = useState<'matrix' | 'network'>('matrix');

  const scatterData = useMemo(() => {
    return all
      .filter(s => s.latestSnapshot)
      .map(s => ({
        id: s.id,
        name: s.full_name,
        organization: s.organization,
        x: s.latestSnapshot!.power_axis,
        y: s.latestSnapshot!.convertibility_axis,
        sis: s.latestSnapshot!.sis_score,
        quadrant: s.latestSnapshot!.quadrant,
        size: Math.max(40, s.latestSnapshot!.sis_score * 1.2),
      }))
      .filter(s => !activeQuadrant || s.quadrant === activeQuadrant);
  }, [all, activeQuadrant]);

  const quadrantStats = useMemo(() => {
    const order: Quadrant[] = ['strategic_ally', 'power_gap', 'hidden_champion', 'monitor_exit'];
    return order.map(q => {
      const members = all.filter(s => s.latestSnapshot?.quadrant === q);
      const avgSIS = members.length > 0
        ? members.reduce((sum, s) => sum + (s.latestSnapshot?.sis_score ?? 0), 0) / members.length
        : 0;
      return {
        quadrant: q,
        count: members.length,
        avgSIS,
        top3: members
          .sort((a, b) => (b.latestSnapshot?.sis_score ?? 0) - (a.latestSnapshot?.sis_score ?? 0))
          .slice(0, 3),
      };
    });
  }, [all]);

  // Quadrant changers (from historical snapshots)
  const snapshots = useAppStore(s => s.snapshots);
  const migrations = useMemo(() => {
    const result: Array<{ name: string; from: Quadrant; to: Quadrant; stakeholderId: string }> = [];
    const grouped: Record<string, typeof snapshots> = {};
    snapshots.forEach(s => {
      if (!grouped[s.stakeholder_id]) grouped[s.stakeholder_id] = [];
      grouped[s.stakeholder_id].push(s);
    });
    Object.entries(grouped).forEach(([sid, snaps]) => {
      if (snaps.length < 2) return;
      const sorted = [...snaps].sort((a, b) => new Date(a.scored_at).getTime() - new Date(b.scored_at).getTime());
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (first.quadrant !== last.quadrant) {
        const stakeholder = all.find(s => s.id === sid);
        if (stakeholder) {
          result.push({ name: stakeholder.full_name, from: first.quadrant, to: last.quadrant, stakeholderId: sid });
        }
      }
    });
    return result;
  }, [all, snapshots]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof scatterData[0] }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: 'var(--bg-dark)', color: 'var(--text-inverse)', fontSize: '0.8125rem', boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ fontWeight: 600 }}>{d.name}</div>
        <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>{d.organization}</div>
        <div className="flex gap-3 mt-1" style={{ fontSize: '0.75rem' }}>
          <span>SIS: {formatSIS(d.sis)}</span>
          <span>Power: {formatAxis(d.x)}</span>
          <span>Conv: {formatAxis(d.y)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Quadrant Map</h1>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {view === 'matrix'
              ? 'Interactive stakeholder positioning across power and convertibility axes'
              : 'Relationship intelligence: how the principal connects across affiliation groups'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {view === 'matrix' && (
            <label className="flex items-center gap-2 text-body-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded"
              />
              Show labels
            </label>
          )}
          {/* View toggle: matrix vs relationship network */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)' }}>
            <button
              onClick={() => setView('matrix')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{ background: view === 'matrix' ? 'var(--bg-elevated)' : 'transparent', color: view === 'matrix' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: view === 'matrix' ? 'var(--shadow-sm)' : 'none' }}
            >
              <Grid2x2 size={14} /> Matrix
            </button>
            <button
              onClick={() => setView('network')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{ background: view === 'network' ? 'var(--bg-elevated)' : 'transparent', color: view === 'network' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: view === 'network' ? 'var(--shadow-sm)' : 'none' }}
            >
              <Share2 size={14} /> Network
            </button>
          </div>
        </div>
      </div>

      {/* Quadrant filter chips (matrix only) */}
      <div className="flex gap-2 flex-wrap" style={{ display: view === 'matrix' ? 'flex' : 'none' }}>
        <button
          onClick={() => setActiveQuadrant(null)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: !activeQuadrant ? 'var(--text-primary)' : 'var(--bg-inset)',
            color: !activeQuadrant ? 'white' : 'var(--text-secondary)',
            border: '1px solid transparent',
          }}
        >
          All Quadrants
        </button>
        {(['strategic_ally', 'power_gap', 'hidden_champion', 'monitor_exit'] as Quadrant[]).map(q => (
          <button
            key={q}
            onClick={() => setActiveQuadrant(activeQuadrant === q ? null : q)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeQuadrant === q ? QUADRANT_COLORS[q].bg : 'var(--bg-inset)',
              color: activeQuadrant === q ? QUADRANT_COLORS[q].text : 'var(--text-secondary)',
              border: activeQuadrant === q ? `1px solid ${QUADRANT_COLORS[q].border}` : '1px solid var(--border-default)',
            }}
          >
            {QUADRANT_LABELS[q]}
          </button>
        ))}
      </div>

      {/* Relationship network view */}
      {view === 'network' && (
        <Card className="!p-3 overflow-hidden">
          <RelationshipNetwork stakeholders={all} onSelect={setSelectedStakeholder} />
        </Card>
      )}

      {/* Main Chart */}
      {view === 'matrix' && (
      <Card className="!p-6">
        <div style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={480}>
            <ScatterChart margin={{ top: 30, right: 30, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                type="number" dataKey="x" name="Power" domain={[1, 5]}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-default)' }}
                tickLine={false} label={{ value: 'Power Axis', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: 'var(--text-secondary)' } }}
              />
              <YAxis
                type="number" dataKey="y" name="Convertibility" domain={[1, 5]}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-default)' }}
                tickLine={false} label={{ value: 'Convertibility', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 12, fill: 'var(--text-secondary)' } }}
              />
              <ReferenceArea x1={1} x2={4} y1={4} y2={5} fill={QUADRANT_COLORS.power_gap.bg} fillOpacity={0.15} label={{ value: 'Power Gaps', position: 'insideTopLeft', style: { fontSize: 10, fill: QUADRANT_COLORS.power_gap.text, fontWeight: 600, opacity: 0.6 } }} />
              <ReferenceArea x1={4} x2={5} y1={4} y2={5} fill={QUADRANT_COLORS.strategic_ally.bg} fillOpacity={0.15} label={{ value: 'Strategic Allies', position: 'insideTopRight', style: { fontSize: 10, fill: QUADRANT_COLORS.strategic_ally.text, fontWeight: 600, opacity: 0.6 } }} />
              <ReferenceArea x1={1} x2={4} y1={1} y2={4} fill={QUADRANT_COLORS.monitor_exit.bg} fillOpacity={0.08} label={{ value: 'Monitor / Exit', position: 'insideBottomLeft', style: { fontSize: 10, fill: QUADRANT_COLORS.monitor_exit.text, fontWeight: 600, opacity: 0.6 } }} />
              <ReferenceArea x1={4} x2={5} y1={1} y2={4} fill={QUADRANT_COLORS.hidden_champion.bg} fillOpacity={0.15} label={{ value: 'Hidden Champions', position: 'insideBottomRight', style: { fontSize: 10, fill: QUADRANT_COLORS.hidden_champion.text, fontWeight: 600, opacity: 0.6 } }} />
              <ReferenceLine x={4} stroke="var(--border-strong)" strokeDasharray="6 4" />
              <ReferenceLine y={4} stroke="var(--border-strong)" strokeDasharray="6 4" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={scatterData}>
                {scatterData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={QUADRANT_COLORS[entry.quadrant].dot}
                    fillOpacity={0.7}
                    stroke={QUADRANT_COLORS[entry.quadrant].dot}
                    strokeWidth={1}
                    cursor="pointer"
                    onClick={() => setSelectedStakeholder(entry.id)}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Floating labels */}
          {showLabels && (
            <div className="absolute inset-0 pointer-events-none" style={{ left: 72, right: 30, top: 30, bottom: 56 }}>
              {scatterData.map(d => {
                const xPct = ((d.x - 1) / 4) * 100;
                const yPct = ((5 - d.y) / 4) * 100;
                return (
                  <div
                    key={d.id}
                    className="absolute whitespace-nowrap"
                    style={{
                      left: `${xPct}%`, top: `${yPct}%`,
                      transform: 'translate(-50%, -150%)',
                      fontSize: '0.5625rem', color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 3,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {d.name.split(' ').slice(-1)[0]}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
      )}

      {/* Quadrant Summary Cards + Migration Tracker */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quadrantStats.map(qs => (
              <div
                key={qs.quadrant}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderLeftWidth: 3, borderLeftColor: QUADRANT_COLORS[qs.quadrant].dot,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{QUADRANT_LABELS[qs.quadrant]}</span>
                  <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>{qs.count}</span>
                </div>
                <div className="text-body-sm mb-3" style={{ color: 'var(--text-muted)' }}>Avg SIS: {qs.avgSIS.toFixed(1)}</div>
                <div className="space-y-1">
                  {qs.top3.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStakeholder(s.id)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={24} />
                      <span className="text-body-sm truncate flex-1" style={{ color: 'var(--text-primary)' }}>{s.full_name}</span>
                      <SISBadge score={s.latestSnapshot?.sis_score ?? 0} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Migration Tracker */}
        <Card>
          <h3 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Quadrant Migrations</h3>
          {migrations.length === 0 ? (
            <div className="text-body-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No recent migrations</div>
          ) : (
            <div className="space-y-3">
              {migrations.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedStakeholder(m.stakeholderId)}
                  className="w-full text-left p-2 rounded-lg transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {(() => { const st = all.find(s => s.id === m.stakeholderId); return st ? <Portrait name={st.full_name} gender={st.gender} portraitUrl={st.portrait_url} size={24} /> : null; })()}
                    <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <QuadrantBadge quadrant={m.from} size="sm" />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>&rarr;</span>
                    <QuadrantBadge quadrant={m.to} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
