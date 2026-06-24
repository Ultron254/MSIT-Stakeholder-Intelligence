import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Pencil, Target as TargetIcon, CalendarDays, AlertCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useAppStore, useCurrentUser } from '../lib/store';
import { useStakeholdersWithScores } from '../lib/store';
import { QuadrantBadge, SISBadge } from '../components/ui/Badges';
import Portrait from '../components/ui/Portrait';
import { QUADRANT_COLORS, QUADRANT_LABELS } from '../lib/types';
import type { Quadrant, EngagementPlan } from '../lib/types';
import { NOW } from '../lib/constants';

const QUADRANT_ORDER: Quadrant[] = ['strategic_ally', 'power_gap', 'hidden_champion', 'monitor_exit'];

// Countdown cue for an engagement plan's end date. Turns red as the deadline
// approaches (or passes), amber within a month, green when there's runway.
function planCountdown(endDate: string | null | undefined): { label: string; color: string; bg: string; urgent: boolean } | null {
  if (!endDate) return null;
  const days = differenceInDays(parseISO(endDate), NOW);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: '#DC2626', bg: 'rgba(220,38,38,0.1)', urgent: true };
  if (days === 0) return { label: 'Due today', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', urgent: true };
  if (days <= 7) return { label: `${days}d left`, color: '#DC2626', bg: 'rgba(220,38,38,0.1)', urgent: true };
  if (days <= 30) return { label: `${days}d left`, color: '#B45309', bg: 'rgba(217,119,6,0.1)', urgent: false };
  return { label: `${days}d left`, color: '#1F7A5C', bg: 'rgba(45,166,126,0.1)', urgent: false };
}

export default function EngagementPlans() {
  const all = useStakeholdersWithScores();
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const currentCampaignId = useAppStore(s => s.currentCampaignId);
  const plans = useAppStore(s => s.plans);
  const me = useCurrentUser();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EngagementPlan | null>(null);

  const canEdit = me?.role === 'analyst' || me?.role === 'lead' || me?.role === 'partner' || me?.role === 'admin';

  const columns: { quadrant: Quadrant; label: string }[] = [
    { quadrant: 'strategic_ally', label: 'Strategic Allies' },
    { quadrant: 'power_gap', label: 'Power Gaps' },
    { quadrant: 'hidden_champion', label: 'Hidden Champions' },
    { quadrant: 'monitor_exit', label: 'Monitor / Exit' },
  ];

  const getStakeholder = (id: string) => all.find(s => s.id === id);

  const plansByQuadrant = useMemo(() => {
    const result: Record<Quadrant, EngagementPlan[]> = {
      strategic_ally: [], power_gap: [], hidden_champion: [], monitor_exit: [],
    };
    const visibleIds = new Set(all.map(s => s.id));
    const q = search.trim().toLowerCase();
    plans
      .filter(p => p.objective_id === currentCampaignId && visibleIds.has(p.stakeholder_id))
      .filter(p => {
        if (!q) return true;
        const st = getStakeholder(p.stakeholder_id);
        return st?.full_name.toLowerCase().includes(q)
          || st?.organization.toLowerCase().includes(q)
          || p.approach.toLowerCase().includes(q);
      })
      .forEach(p => { result[p.current_quadrant as Quadrant]?.push(p); });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampaignId, all, plans, search]);

  const totalShown = QUADRANT_ORDER.reduce((n, q) => n + plansByQuadrant[q].length, 0);

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Engagement Plans</h1>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            30/60/90 day strategic plans organized by quadrant{canEdit ? ' — click Edit on any card to update the plan' : ''}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search stakeholder, org or approach…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-9 py-2 text-body-sm outline-none"
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      {search && (
        <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>{totalShown} plan{totalShown === 1 ? '' : 's'} match "{search}"</div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" style={{ minHeight: 600 }}>
        {columns.map(col => {
          const colPlans = plansByQuadrant[col.quadrant] ?? [];
          const qColor = QUADRANT_COLORS[col.quadrant];
          return (
            <div key={col.quadrant} className="flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-t-lg" style={{ background: qColor.bg, borderBottom: `2px solid ${qColor.border}` }}>
                <span className="text-heading-sm" style={{ color: qColor.text }}>{col.label}</span>
                <span className="font-mono text-xs" style={{ color: qColor.text }}>{colPlans.length}</span>
              </div>

              <div className="flex-1 space-y-2 p-2 rounded-b-lg overflow-y-auto" style={{ background: 'var(--bg-secondary)', maxHeight: 700 }}>
                {colPlans.length === 0 && (
                  <div className="text-body-sm text-center py-6" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No plans here.</div>
                )}
                {colPlans.map(plan => {
                  const stakeholder = getStakeholder(plan.stakeholder_id);
                  if (!stakeholder) return null;
                  return (
                    <div
                      key={plan.id}
                      className="rounded-lg p-3 transition-all"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    >
                      <button onClick={() => setSelectedStakeholder(plan.stakeholder_id)} className="w-full text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <Portrait name={stakeholder.full_name} gender={stakeholder.gender} portraitUrl={stakeholder.portrait_url} size={28} />
                          <span className="text-heading-sm truncate flex-1" style={{ color: 'var(--text-primary)' }}>{stakeholder.full_name}</span>
                          {stakeholder.latestSnapshot && <SISBadge score={stakeholder.latestSnapshot.sis_score} size="sm" />}
                        </div>
                        <div className="text-body-sm mb-2 truncate" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{stakeholder.organization}</div>
                        <div className="text-body-sm line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{plan.approach}</div>
                      </button>
                      {plan.target_quadrant && plan.target_quadrant !== plan.current_quadrant && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-label" style={{ fontSize: '0.5625rem' }}>Target</span>
                          <QuadrantBadge quadrant={plan.target_quadrant} size="sm" />
                        </div>
                      )}
                      {(() => {
                        const cd = planCountdown(plan.end_date);
                        if (!cd) return null;
                        return (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: cd.bg, color: cd.color, fontSize: '0.625rem', fontWeight: 700 }}>
                              {cd.urgent ? <AlertCircle size={11} /> : <CalendarDays size={11} />}
                              {cd.label}
                            </span>
                            {plan.end_date && (
                              <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
                                ends {new Date(plan.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span className="text-xs font-medium capitalize px-1.5 py-0.5 rounded" style={{ color: plan.status === 'active' ? 'var(--status-success)' : 'var(--text-muted)', background: plan.status === 'active' ? 'var(--quadrant-ally-bg)' : 'var(--bg-inset)' }}>{plan.status}</span>
                        {canEdit && (
                          <button onClick={() => setEditing(plan)} className="flex items-center gap-1 rounded-md px-2 py-1" style={{ color: 'var(--accent-primary)', fontSize: '0.6875rem', fontWeight: 600 }}>
                            <Pencil size={11} /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editing && <EditPlanModal plan={editing} stakeholderName={getStakeholder(editing.stakeholder_id)?.full_name ?? 'Stakeholder'} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditPlanModal({ plan, stakeholderName, onClose }: { plan: EngagementPlan; stakeholderName: string; onClose: () => void }) {
  const updatePlan = useAppStore(s => s.updatePlan);
  const addToast = useAppStore(s => s.addToast);
  const [approach, setApproach] = useState(plan.approach);
  const [target, setTarget] = useState<Quadrant | ''>(plan.target_quadrant ?? '');
  const [p30, setP30] = useState(plan.plan_30_day);
  const [p60, setP60] = useState(plan.plan_60_day);
  const [p90, setP90] = useState(plan.plan_90_day);
  const [status, setStatus] = useState<EngagementPlan['status']>(plan.status);
  const [startDate, setStartDate] = useState(plan.start_date ?? '');
  const [endDate, setEndDate] = useState(plan.end_date ?? '');

  const datesInvalid = !!startDate && !!endDate && endDate < startDate;

  const save = () => {
    if (datesInvalid) { addToast('End date must be after the start date', 'error'); return; }
    updatePlan(plan.id, {
      approach: approach.trim(), target_quadrant: target || null,
      plan_30_day: p30.trim(), plan_60_day: p60.trim(), plan_90_day: p90.trim(), status,
      start_date: startDate || null, end_date: endDate || null,
    });
    addToast('Engagement plan updated', 'success');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" style={{ background: 'rgba(15,30,41,0.45)' }} onClick={onClose} />
      <div className="modal-content relative w-full rounded-2xl overflow-hidden flex flex-col" style={{ maxWidth: 640, maxHeight: '90vh', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--brand-primary-rgb),0.12)', color: 'var(--brand-primary)' }}><TargetIcon size={16} /></div>
            <div>
              <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>Edit engagement plan</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{stakeholderName}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-4">
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Strategic approach</label>
            <textarea value={approach} onChange={(e) => setApproach(e.target.value)} rows={2} className="msit-input" style={{ resize: 'none' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Target quadrant</label>
              <select value={target} onChange={(e) => setTarget(e.target.value as Quadrant | '')} className="msit-input">
                <option value="">No target</option>
                {QUADRANT_ORDER.map(q => <option key={q} value={q}>{QUADRANT_LABELS[q]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as EngagementPlan['status'])} className="msit-input">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="msit-input" />
            </div>
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>End date</label>
              <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className="msit-input"
                style={datesInvalid ? { borderColor: 'var(--status-danger)' } : undefined} />
            </div>
            {datesInvalid && (
              <div className="col-span-2 flex items-center gap-1.5" style={{ color: 'var(--status-danger)', fontSize: '0.6875rem' }}>
                <AlertCircle size={12} /> End date must be on or after the start date.
              </div>
            )}
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>30-day plan</label>
            <textarea value={p30} onChange={(e) => setP30(e.target.value)} rows={2} className="msit-input" style={{ resize: 'none' }} />
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>60-day plan</label>
            <textarea value={p60} onChange={(e) => setP60(e.target.value)} rows={2} className="msit-input" style={{ resize: 'none' }} />
          </div>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>90-day plan</label>
            <textarea value={p90} onChange={(e) => setP90(e.target.value)} rows={2} className="msit-input" style={{ resize: 'none' }} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="rounded-lg" style={{ padding: '9px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={datesInvalid} className="rounded-lg btn-press" style={{ padding: '9px 18px', background: datesInvalid ? 'var(--bg-inset)' : 'var(--gradient-brand)', color: datesInvalid ? 'var(--text-muted)' : 'white', fontSize: '0.8125rem', fontWeight: 600 }}>Save plan</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
