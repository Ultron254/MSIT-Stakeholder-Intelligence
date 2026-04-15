import { useMemo } from 'react';
import { useAppStore, engagementPlans } from '../lib/store';
import { useStakeholdersWithScores } from '../lib/store';
import { QuadrantBadge, SISBadge } from '../components/ui/Badges';
import { QUADRANT_COLORS } from '../lib/types';
import type { Quadrant } from '../lib/types';

export default function EngagementPlans() {
  const all = useStakeholdersWithScores();
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);

  const columns: { quadrant: Quadrant; label: string }[] = [
    { quadrant: 'strategic_ally', label: 'Strategic Allies' },
    { quadrant: 'power_gap', label: 'Power Gaps' },
    { quadrant: 'hidden_champion', label: 'Hidden Champions' },
    { quadrant: 'monitor_exit', label: 'Monitor / Exit' },
  ];

  const plansByQuadrant = useMemo(() => {
    const result: Record<Quadrant, typeof engagementPlans> = {
      strategic_ally: [], power_gap: [], hidden_champion: [], monitor_exit: [],
    };
    engagementPlans.forEach(p => {
      result[p.current_quadrant as Quadrant]?.push(p);
    });
    return result;
  }, []);

  const getStakeholder = (id: string) => all.find(s => s.id === id);

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Engagement Plans</h1>
        <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          30/60/90 day strategic plans organized by quadrant
        </p>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" style={{ minHeight: 600 }}>
        {columns.map(col => {
          const plans = plansByQuadrant[col.quadrant] ?? [];
          const qColor = QUADRANT_COLORS[col.quadrant];
          return (
            <div key={col.quadrant} className="flex flex-col">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-t-lg"
                style={{ background: qColor.bg, borderBottom: `2px solid ${qColor.border}` }}
              >
                <span className="text-heading-sm" style={{ color: qColor.text }}>{col.label}</span>
                <span className="font-mono text-xs" style={{ color: qColor.text }}>{plans.length}</span>
              </div>

              {/* Cards */}
              <div
                className="flex-1 space-y-2 p-2 rounded-b-lg overflow-y-auto"
                style={{ background: 'var(--bg-secondary)', maxHeight: 700 }}
              >
                {plans.map(plan => {
                  const stakeholder = getStakeholder(plan.stakeholder_id);
                  if (!stakeholder) return null;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedStakeholder(plan.stakeholder_id)}
                      className="rounded-lg p-3 cursor-pointer transition-all"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-strong)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-heading-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {stakeholder.full_name}
                        </span>
                        {stakeholder.latestSnapshot && (
                          <SISBadge score={stakeholder.latestSnapshot.sis_score} size="sm" />
                        )}
                      </div>
                      <div className="text-body-sm mb-2 truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                        {stakeholder.organization}
                      </div>
                      <div className="text-body-sm line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {plan.approach}
                      </div>
                      {plan.target_quadrant && plan.target_quadrant !== plan.current_quadrant && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-label" style={{ fontSize: '0.5625rem' }}>Target</span>
                          <QuadrantBadge quadrant={plan.target_quadrant} size="sm" />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span
                          className="text-xs font-medium capitalize px-1.5 py-0.5 rounded"
                          style={{
                            color: plan.status === 'active' ? 'var(--status-success)' : 'var(--text-muted)',
                            background: plan.status === 'active' ? 'var(--quadrant-ally-bg)' : 'var(--bg-inset)',
                          }}
                        >
                          {plan.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
