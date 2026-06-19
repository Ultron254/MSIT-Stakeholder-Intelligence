import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { StakeholderWithScore } from '../lib/types';
import { getRelated, getInterLinks, RELATION_COLORS, RELATION_LABELS } from '../lib/relationships';
import type { RelationKind } from '../lib/relationships';

const VB_W = 760;
const VB_H = 520;
const CX = VB_W / 2;
const CY = VB_H / 2;

const RING: Record<RelationKind, number> = { colleague: 120, peer: 185, bridge: 240 };

function shortName(full: string) {
  const clean = full.replace(/^(Hon\.|Dr\.|Gen\.|Amb\.|Prof\.|Mr\.|Mrs\.|Ms\.|Eng\.)\s+/i, '');
  const parts = clean.split(' ');
  return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : clean;
}

export default function EgoNetwork({
  focalId,
  all,
  onSelect,
  height = 460,
  showLegend = true,
  nodeScale = 1,
  fontScale = 1,
}: {
  focalId: string;
  all: StakeholderWithScore[];
  onSelect?: (id: string) => void;
  height?: number;
  showLegend?: boolean;
  nodeScale?: number;
  fontScale?: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const focal = all.find(s => s.id === focalId);

  const { related, interLinks, positions } = useMemo(() => {
    const rel = getRelated(focalId, all, 11);
    const links = getInterLinks(rel);
    // Group by ring and spread evenly within each ring.
    const byKind: Record<RelationKind, typeof rel> = { colleague: [], peer: [], bridge: [] };
    rel.forEach(r => byKind[r.kind].push(r));
    const pos = new Map<string, { x: number; y: number }>();
    (['colleague', 'peer', 'bridge'] as RelationKind[]).forEach(kind => {
      const group = byKind[kind];
      const n = group.length;
      group.forEach((r, i) => {
        const offset = kind === 'colleague' ? -Math.PI / 2 : kind === 'peer' ? -Math.PI / 2 + 0.5 : -Math.PI / 2 + 1.0;
        const a = offset + (n === 1 ? 0 : (i / n) * Math.PI * 2);
        pos.set(r.stakeholder.id, {
          x: CX + Math.cos(a) * RING[kind],
          y: CY + Math.sin(a) * RING[kind],
        });
      });
    });
    return { related: rel, interLinks: links, positions: pos };
  }, [focalId, all]);

  if (!focal) {
    return <div className="flex items-center justify-center" style={{ height, color: 'var(--text-muted)' }}>Stakeholder not found.</div>;
  }

  const isLit = (id: string) => {
    if (!hovered) return true;
    if (hovered === id || hovered === focalId) return true;
    // light a node if it shares an edge with the hovered node
    if (hovered === focalId) return true;
    if (id === focalId) return true;
    return interLinks.some(([a, b]) => (a === hovered && b === id) || (b === hovered && a === id));
  };

  return (
    <div className="relative" style={{ width: '100%' }}>
      {showLegend && (
        <div
          className="absolute top-2 right-2 z-10 rounded-xl px-3 py-2"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
        >
          {(['colleague', 'peer', 'bridge'] as RelationKind[]).map(k => (
            <div key={k} className="flex items-center gap-2 py-0.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: RELATION_COLORS[k] }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{RELATION_LABELS[k]}</span>
            </div>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="w-full" style={{ height, display: 'block' }}>
        {/* Ring guides */}
        {[RING.colleague, RING.peer, RING.bridge].map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke="var(--border-subtle)" strokeDasharray="3 5" strokeWidth={1} opacity={0.5} />
        ))}

        {/* Inter-links between related nodes */}
        {interLinks.map(([a, b], i) => {
          const pa = positions.get(a); const pb = positions.get(b);
          if (!pa || !pb) return null;
          const lit = !hovered || hovered === a || hovered === b;
          return (
            <motion.line
              key={`il-${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="2 4"
              initial={{ opacity: 0 }} animate={{ opacity: lit ? 0.35 : 0.05 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.02 }}
            />
          );
        })}

        {/* Focal -> related edges */}
        {related.map((r, i) => {
          const p = positions.get(r.stakeholder.id);
          if (!p) return null;
          const lit = !hovered || hovered === focalId || hovered === r.stakeholder.id;
          return (
            <motion.line
              key={`e-${r.stakeholder.id}`} x1={CX} y1={CY} x2={p.x} y2={p.y}
              stroke={RELATION_COLORS[r.kind]} strokeWidth={1 + r.strength * 1.6}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: lit ? 0.5 : 0.1 }}
              transition={{ pathLength: { duration: 0.6, delay: 0.1 + i * 0.04 }, opacity: { duration: 0.3 } }}
            />
          );
        })}

        {/* Related nodes */}
        {related.map((r, i) => {
          const p = positions.get(r.stakeholder.id);
          if (!p) return null;
          return (
            <Node
              key={r.stakeholder.id}
              x={p.x} y={p.y} r={(r.kind === 'colleague' ? 11 : 9) * nodeScale}
              color={RELATION_COLORS[r.kind]}
              label={shortName(r.stakeholder.full_name)}
              fullLabel={`${r.stakeholder.full_name} · ${RELATION_LABELS[r.kind]}`}
              delay={0.2 + i * 0.05}
              lit={isLit(r.stakeholder.id)}
              fontScale={fontScale}
              onHover={() => setHovered(r.stakeholder.id)}
              onLeave={() => setHovered(null)}
              onClick={onSelect ? () => onSelect(r.stakeholder.id) : undefined}
            />
          );
        })}

        {/* Focal node */}
        <g transform={`translate(${CX} ${CY})`}>
          <motion.circle
            r={20} fill="#0F1E29"
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: [1, 1.9, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
        <Node
          x={CX} y={CY} r={18 * nodeScale} color="#0F1E29"
          label={shortName(focal.full_name)} fullLabel={`${focal.full_name} — focal stakeholder`}
          bold delay={0} lit={isLit(focalId)} fontScale={fontScale}
          onHover={() => setHovered(focalId)} onLeave={() => setHovered(null)}
        />
      </svg>

      <p className="text-body-sm px-1" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
        {focal.full_name} is connected to {related.length} stakeholder{related.length === 1 ? '' : 's'} across colleagues, sector peers and strategic bridges. {onSelect ? 'Click any node to open their profile.' : 'Hover to spotlight a connection.'}
      </p>
    </div>
  );
}

function Node({
  x, y, r, color, label, fullLabel, delay, lit, bold, fontScale = 1, onHover, onLeave, onClick,
}: {
  x: number; y: number; r: number; color: string; label: string; fullLabel: string;
  delay: number; lit: boolean; bold?: boolean; fontScale?: number;
  onHover: () => void; onLeave: () => void; onClick?: () => void;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ cursor: onClick ? 'pointer' : 'default', opacity: lit ? 1 : 0.18, transition: 'opacity 0.25s' }}
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
    >
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16, delay }}>
        <motion.g animate={{ y: bold ? 0 : [0, -3, 0] }} transition={{ duration: 3.4 + (x % 7) * 0.2, repeat: Infinity, ease: 'easeInOut' }} whileHover={{ scale: 1.16 }}>
          <circle r={r + 3} fill={color} opacity={0.16} />
          <circle r={r} fill={color} stroke="white" strokeWidth={bold ? 2.5 : 1.5} />
          <text y={r + 11 * fontScale} textAnchor="middle" style={{ fontSize: (bold ? 9.5 : 8) * fontScale, fontWeight: bold ? 700 : 500, fill: 'var(--text-secondary)', pointerEvents: 'none' }}>
            {label.length > 18 ? `${label.slice(0, 17)}…` : label}
          </text>
          <title>{fullLabel}</title>
        </motion.g>
      </motion.g>
    </g>
  );
}
