import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { useAppStore, watchlistSignals, stakeholders } from '../lib/store';
import { Card, SeverityBadge, EmptyState } from '../components/ui/Badges';
import { formatRelativeDate } from '../lib/formatters';

export default function Watchlist() {
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const addToast = useAppStore(s => s.addToast);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [showResolved, setShowResolved] = useState(false);

  const activeSignals = useMemo(() =>
    watchlistSignals
      .filter(w => !w.is_resolved && !resolvedIds.has(w.id))
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.severity] - order[b.severity] || new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
      }),
    [resolvedIds]
  );

  const resolvedSignals = useMemo(() =>
    watchlistSignals.filter(w => w.is_resolved || resolvedIds.has(w.id)),
    [resolvedIds]
  );

  const stats = useMemo(() => {
    const active = activeSignals;
    return {
      total: active.length,
      critical: active.filter(w => w.severity === 'critical').length,
      high: active.filter(w => w.severity === 'high').length,
      medium: active.filter(w => w.severity === 'medium').length,
      low: active.filter(w => w.severity === 'low').length,
    };
  }, [activeSignals]);

  const getStakeholderName = (id: string) => stakeholders.find(s => s.id === id)?.full_name ?? 'Portfolio-wide';

  const handleResolve = (id: string) => {
    setResolvedIds(prev => new Set([...prev, id]));
    addToast('Signal resolved successfully', 'success');
  };

  const signalIcon = (type: string) => {
    switch (type) {
      case 'quadrant_change': return <Shield size={16} />;
      case 'sis_drop': case 'sis_rise': return <AlertTriangle size={16} />;
      case 'stale_assessment': return <Clock size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Watchlist</h1>
        <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Monitor critical signals and alerts across the stakeholder portfolio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Active Signals', value: stats.total, color: stats.total > 0 ? 'var(--status-danger)' : 'var(--text-primary)' },
          { label: 'Critical', value: stats.critical, color: '#991B1B' },
          { label: 'High', value: stats.high, color: '#92400E' },
          { label: 'Medium', value: stats.medium, color: '#3730A3' },
          { label: 'Low', value: stats.low, color: 'var(--text-secondary)' },
        ].map(s => (
          <Card key={s.label} className="!p-4">
            <div className="text-label mb-1">{s.label}</div>
            <div className="text-metric-sm" style={{ color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Active Signals */}
      <div>
        <h2 className="text-heading-md mb-3" style={{ color: 'var(--text-primary)' }}>Active Signals</h2>
        {activeSignals.length === 0 ? (
          <Card>
            <EmptyState title="All clear" description="No active watchlist signals. The portfolio is stable." />
          </Card>
        ) : (
          <div className="space-y-2">
            {activeSignals.map(signal => (
              <div
                key={signal.id}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderLeftWidth: 3,
                  borderLeftColor: signal.severity === 'critical' ? 'var(--status-danger)' : signal.severity === 'high' ? 'var(--status-warning)' : 'var(--accent-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5" style={{ color: signal.severity === 'critical' ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                    {signalIcon(signal.signal_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityBadge severity={signal.severity} />
                      <span className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {signal.signal_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                        {formatRelativeDate(signal.triggered_at)}
                      </span>
                    </div>
                    <div className="text-body-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                      {signal.description}
                    </div>
                    <button
                      onClick={() => setSelectedStakeholder(signal.stakeholder_id)}
                      className="text-body-sm transition-colors"
                      style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}
                    >
                      View {getStakeholderName(signal.stakeholder_id)}
                    </button>
                  </div>
                  <button
                    onClick={() => handleResolve(signal.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <CheckCircle size={12} /> Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Signals */}
      <div>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="flex items-center gap-2 text-heading-md mb-3 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Resolved Signals ({resolvedSignals.length})
          <span style={{ transform: showResolved ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            &#9662;
          </span>
        </button>
        {showResolved && (
          <div className="space-y-2">
            {resolvedSignals.map(signal => (
              <div
                key={signal.id}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  opacity: 0.7,
                }}
              >
                <div className="flex items-start gap-4">
                  <CheckCircle size={16} style={{ color: 'var(--status-success)', marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={signal.severity} />
                      <span className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                        Resolved {signal.resolved_at ? formatRelativeDate(signal.resolved_at) : 'just now'}
                      </span>
                    </div>
                    <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{signal.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
