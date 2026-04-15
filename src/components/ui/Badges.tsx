import type { Quadrant, Confidence, WorkflowStatus, Sector } from '../../lib/types';
import { QUADRANT_COLORS, QUADRANT_LABELS, SECTOR_LABELS } from '../../lib/types';
import { getSISColor } from '../../lib/scoring-engine';
import { X } from 'lucide-react';
import { useAppStore } from '../../lib/store';

// ---- Quadrant Badge ----
export function QuadrantBadge({ quadrant, size = 'md' }: { quadrant: Quadrant; size?: 'sm' | 'md' }) {
  const colors = QUADRANT_COLORS[quadrant];
  const label = QUADRANT_LABELS[quadrant];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md whitespace-nowrap"
      style={{
        background: colors.bg,
        color: colors.text,
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        fontWeight: 500,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, background: colors.dot }}
      />
      {label}
    </span>
  );
}

// ---- SIS Badge ----
export function SISBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = getSISColor(score);
  const fontSize = size === 'lg' ? '1.5rem' : size === 'md' ? '1rem' : '0.875rem';
  return (
    <span
      className="font-display tabular-nums"
      style={{ color, fontSize, fontWeight: 400, fontFamily: 'var(--font-display)' }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// ---- Confidence Badge ----
export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const styles: Record<Confidence, { bg: string; color: string }> = {
    A: { bg: 'var(--quadrant-ally-bg)', color: 'var(--quadrant-ally-text)' },
    B: { bg: '#FDF6E3', color: '#9A7611' },
    C: { bg: 'var(--quadrant-power-gap-bg)', color: 'var(--quadrant-power-gap-text)' },
  };
  const s = styles[confidence];
  return (
    <span
      className="inline-flex items-center justify-center rounded"
      style={{ background: s.bg, color: s.color, fontSize: '0.6875rem', fontWeight: 600, width: 22, height: 20 }}
    >
      {confidence}
    </span>
  );
}

// ---- Status Badge ----
export function WorkflowBadge({ status }: { status: WorkflowStatus }) {
  const styles: Record<WorkflowStatus, { bg: string; color: string }> = {
    draft: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)' },
    submitted: { bg: '#EFF6FF', color: '#1D4ED8' },
    approved: { bg: 'var(--quadrant-ally-bg)', color: 'var(--quadrant-ally-text)' },
    rejected: { bg: 'var(--quadrant-power-gap-bg)', color: 'var(--quadrant-power-gap-text)' },
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

// ---- Sector Badge ----
export function SectorBadge({ sector }: { sector: Sector }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded whitespace-nowrap"
      style={{
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        fontSize: '0.6875rem',
        fontWeight: 500,
      }}
    >
      {SECTOR_LABELS[sector]}
    </span>
  );
}

// ---- Severity Badge ----
export function SeverityBadge({ severity }: { severity: 'critical' | 'high' | 'medium' | 'low' }) {
  const styles = {
    critical: { bg: '#FEE2E2', color: '#991B1B' },
    high: { bg: '#FEF3C7', color: '#92400E' },
    medium: { bg: '#E0E7FF', color: '#3730A3' },
    low: { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
  };
  const s = styles[severity];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {severity}
    </span>
  );
}

// ---- Layer Indicator ----
export function LayerIndicator({ layer }: { layer: 1 | 2 | 3 }) {
  const labels = { 1: 'Core', 2: 'Inner', 3: 'Outer' };
  const opacities = { 1: 1, 2: 0.6, 3: 0.3 };
  return (
    <span className="inline-flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: 'var(--accent-primary)', opacity: opacities[layer] }}
      />
      {labels[layer]}
    </span>
  );
}

// ---- Engagement Type Badge ----
export function EngagementTypeBadge({ type }: { type: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded whitespace-nowrap"
      style={{
        background: 'var(--bg-inset)',
        color: 'var(--text-secondary)',
        fontSize: '0.6875rem',
        fontWeight: 500,
      }}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

// ---- Outcome Badge ----
export function OutcomeBadge({ outcome }: { outcome: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    positive: { bg: 'var(--quadrant-ally-bg)', color: 'var(--quadrant-ally-text)' },
    neutral: { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
    negative: { bg: 'var(--quadrant-power-gap-bg)', color: 'var(--quadrant-power-gap-text)' },
    pending: { bg: '#FDF6E3', color: '#9A7611' },
  };
  const s = styles[outcome] ?? styles.neutral;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {outcome}
    </span>
  );
}

// ---- Card ----
export function Card({ children, className = '', onClick, hover = false }: {
  children: React.ReactNode; className?: string; onClick?: () => void; hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
        padding: 24,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover || onClick) {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover || onClick) {
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      {children}
    </div>
  );
}

// ---- Toast Container ----
export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast-enter flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{
            background: t.type === 'error' ? '#FEE2E2' : t.type === 'success' ? 'var(--quadrant-ally-bg)' : 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 280,
          }}
        >
          <span className="text-body-sm flex-1" style={{ color: 'var(--text-primary)' }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)}>
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---- Empty State ----
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-heading-md mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</div>
      <div className="text-body-sm" style={{ color: 'var(--text-muted)' }}>{description}</div>
    </div>
  );
}

// ---- Score Bar ----
export function ScoreBar({ value, max = 5, color }: { value: number; max?: number; color?: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-inset)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color || 'var(--accent-primary)' }}
      />
    </div>
  );
}
