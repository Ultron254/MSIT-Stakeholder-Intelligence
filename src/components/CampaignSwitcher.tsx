import { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check, Plus, Circle } from 'lucide-react';
import { useAppStore, useCurrentCampaign, useCurrentRole } from '../lib/store';
import { CAMPAIGN_STATUS_LABELS } from '../lib/types';
import type { Campaign } from '../lib/types';

interface Props {
  variant?: 'sidebar' | 'compact';
  collapsed?: boolean;
}

function statusDot(status: Campaign['status']): string {
  switch (status) {
    case 'active': return '#4ADE80';
    case 'completed': return '#94A3B8';
    case 'archived': return '#64748B';
    case 'draft': return '#FBBF24';
  }
}

export default function CampaignSwitcher({ variant = 'sidebar', collapsed = false }: Props) {
  const campaigns = useAppStore(s => s.campaigns);
  const setCampaign = useAppStore(s => s.setCampaign);
  const setPage = useAppStore(s => s.setPage);
  const role = useCurrentRole();
  const current = useCurrentCampaign();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!current) return null;

  const active = campaigns.filter(c => c.status === 'active' || c.status === 'draft');
  const past = campaigns.filter(c => c.status === 'completed' || c.status === 'archived');
  const canCreate = role === 'lead' || role === 'partner' || role === 'admin';

  const list = (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="text-label" style={{ fontSize: '0.625rem' }}>Switch Focal Point</div>
      </div>
      <div className="max-h-72 overflow-y-auto py-1">
        {active.map(c => (
          <CampaignRow key={c.id} c={c} active={c.id === current.id} onClick={() => { setCampaign(c.id); setOpen(false); }} />
        ))}
        {past.length > 0 && (
          <div className="px-3 pt-2 pb-1 text-label" style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>Past</div>
        )}
        {past.map(c => (
          <CampaignRow key={c.id} c={c} active={c.id === current.id} onClick={() => { setCampaign(c.id); setOpen(false); }} />
        ))}
      </div>
      <button
        onClick={() => { setOpen(false); setPage('campaigns'); }}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
        style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {canCreate ? <><Plus size={14} /> New focal point</> : <>View all focal points</>}
      </button>
    </div>
  );

  // Compact pill (used on dashboard / header).
  if (variant === 'compact') {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-lg transition-colors btn-press"
          style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: current.accent }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>{current.short_name}</span>
          <ChevronsUpDown size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 z-50" style={{ width: 320 }}>
            {list}
          </div>
        )}
      </div>
    );
  }

  // Collapsed sidebar: just an accent dot that opens a popover to the right.
  if (collapsed) {
    return (
      <div className="relative px-2 mb-2" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Switch focal point"
          className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: current.accent, boxShadow: `0 0 8px ${current.accent}` }} />
        </button>
        {open && (
          <div className="absolute left-full bottom-0 ml-2 z-50" style={{ width: 300 }}>
            {list}
          </div>
        )}
      </div>
    );
  }

  // Full sidebar campaign card with upward popover.
  return (
    <div className="relative mx-3 mb-3" ref={ref}>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-full">
          {list}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left rounded-xl overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(45,166,126,0.18) 0%, rgba(45,166,126,0.06) 100%)',
          border: '1px solid rgba(45, 166, 126, 0.25)',
          padding: 12,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-label" style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.55)' }}>Active Focal Point</div>
          <ChevronsUpDown size={13} style={{ color: 'rgba(255,255,255,0.55)' }} />
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: current.accent, boxShadow: `0 0 6px ${current.accent}` }} />
          <span style={{ color: 'white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.2 }} className="truncate">
            {current.short_name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.6875rem' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: statusDot(current.status) }} />
          {current.region} · {CAMPAIGN_STATUS_LABELS[current.status]}
        </div>
      </button>
    </div>
  );
}

function CampaignRow({ c, active, onClick }: { c: Campaign; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
      style={{ background: active ? 'rgba(45,166,126,0.08)' : 'transparent' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.accent }} />
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>{c.short_name}</div>
        <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
          <Circle size={6} style={{ fill: statusDot(c.status), color: statusDot(c.status) }} />
          {CAMPAIGN_STATUS_LABELS[c.status]} · {c.policy_domain}
        </div>
      </div>
      {active && <Check size={14} style={{ color: 'var(--brand-primary)' }} />}
    </button>
  );
}
