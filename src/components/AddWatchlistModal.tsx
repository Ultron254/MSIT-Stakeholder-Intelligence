import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import Portrait from './ui/Portrait';
import { format } from 'date-fns';
import { NOW } from '../lib/constants';
import type { WatchlistSignal } from '../lib/types';

const SIGNAL_TYPES: WatchlistSignal['signal_type'][] = [
  'quadrant_change', 'sis_drop', 'sis_rise', 'stale_assessment', 'confidence_downgrade', 'engagement_overdue', 'red_flag_triggered'
];
const SEVERITIES: WatchlistSignal['severity'][] = ['critical', 'high', 'medium', 'low'];

export default function AddWatchlistModal() {
  const addWatchlistModalOpen = useAppStore(s => s.addWatchlistModalOpen);
  const addWatchlistStakeholderId = useAppStore(s => s.addWatchlistStakeholderId);
  const closeAddWatchlist = useAppStore(s => s.closeAddWatchlist);
  const addWatchlistSignal = useAppStore(s => s.addWatchlistSignal);
  const addToast = useAppStore(s => s.addToast);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);

  const [signalType, setSignalType] = useState<WatchlistSignal['signal_type']>('red_flag_triggered');
  const [severity, setSeverity] = useState<WatchlistSignal['severity']>('medium');
  const [description, setDescription] = useState('');

  if (!addWatchlistModalOpen || !addWatchlistStakeholderId) return null;

  const stakeholder = storeStakeholders.find(s => s.id === addWatchlistStakeholderId);

  const handleSubmit = () => {
    if (!description.trim()) {
      addToast('Please provide a description', 'error');
      return;
    }
    const signal: WatchlistSignal = {
      id: `ws-new-${Date.now()}`,
      stakeholder_id: addWatchlistStakeholderId,
      signal_type: signalType,
      severity,
      description: description.trim(),
      is_resolved: false,
      triggered_at: format(NOW, 'yyyy-MM-dd'),
      resolved_at: null,
    };
    addWatchlistSignal(signal);
    addToast('Watchlist signal created', 'success');
    closeAddWatchlist();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 modal-backdrop" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={closeAddWatchlist} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeAddWatchlist}>
        <div
          className="modal-content w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: 'var(--status-warning)' }} />
              <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Add to Watchlist</h2>
            </div>
            <button onClick={closeAddWatchlist} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {stakeholder && (
              <div className="flex items-center gap-2.5">
                <Portrait name={stakeholder.full_name} gender={stakeholder.gender} portraitUrl={stakeholder.portrait_url} size={32} />
                <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                  Creating signal for <strong style={{ color: 'var(--text-primary)' }}>{stakeholder.full_name}</strong>
                </div>
              </div>
            )}
            <div>
              <label className="text-label mb-1.5 block">Signal Type</label>
              <select value={signalType} onChange={e => setSignalType(e.target.value as WatchlistSignal['signal_type'])}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                {SIGNAL_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label mb-1.5 block">Severity</label>
              <div className="flex gap-2">
                {SEVERITIES.map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                    style={{
                      background: severity === s
                        ? s === 'critical' ? '#FEE2E2' : s === 'high' ? '#FEF3C7' : s === 'medium' ? '#E0E7FF' : 'var(--bg-secondary)'
                        : 'var(--bg-inset)',
                      color: severity === s
                        ? s === 'critical' ? '#991B1B' : s === 'high' ? '#92400E' : s === 'medium' ? '#3730A3' : 'var(--text-secondary)'
                        : 'var(--text-secondary)',
                      border: severity === s ? '1px solid transparent' : '1px solid var(--border-default)',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-label mb-1.5 block">Description <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe the signal..."
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none resize-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <button onClick={closeAddWatchlist}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            >Cancel</button>
            <button onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--text-primary)', color: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
            >Create Signal</button>
          </div>
        </div>
      </div>
    </>
  );
}
