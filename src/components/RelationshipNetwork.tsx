import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, RotateCcw, Crosshair, Sparkles } from 'lucide-react';
import type { StakeholderWithScore, Sector } from '../lib/types';

// Sectors become the intelligence "groups" that sit between the principal and
// the individual members, echoing an affiliation-network read of the portfolio.
const GROUP_LABELS: Record<Sector, string> = {
  politics: 'Political Links',
  business: 'Business & Professional Links',
  civil_service: 'Government & Civil Service',
  media: 'Media & Press',
  civil_society: 'Civil Society Network',
  international: 'International & Diplomatic',
  judiciary: 'Judiciary & Legal',
  academia: 'Academia & Research',
};

const COLORS = {
  principal: '#E11D48',
  group: '#2563EB',
  member: '#16A34A',
  edge: 'var(--border-strong)',
};

const VB_W = 1000;
const VB_H = 620;
const CX = VB_W / 2;
const CY = VB_H / 2;

interface LaidOutMember { id: string; name: string; x: number; y: number; sis: number; }
interface LaidOutGroup { key: Sector; label: string; x: number; y: number; members: LaidOutMember[]; }

function lastName(full: string) {
  const parts = full.replace(/^(Hon\.|Dr\.|Gen\.|Amb\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').split(' ');
  return parts[parts.length - 1];
}

export default function RelationshipNetwork({
  stakeholders,
  onSelect,
}: {
  stakeholders: StakeholderWithScore[];
  onSelect: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);

  const { principal, groups } = useMemo(() => {
    const scored = stakeholders.filter(s => s.latestSnapshot);
    if (scored.length === 0) return { principal: null, groups: [] as LaidOutGroup[] };

    // The principal is the single most influential scored stakeholder.
    const principalNode = [...scored].sort(
      (a, b) => (b.latestSnapshot!.sis_score) - (a.latestSnapshot!.sis_score),
    )[0];

    const bySector = new Map<Sector, StakeholderWithScore[]>();
    scored.forEach(s => {
      if (s.id === principalNode.id) return;
      const arr = bySector.get(s.sector) ?? [];
      arr.push(s);
      bySector.set(s.sector, arr);
    });

    const sectors = [...bySector.keys()];
    const G = Math.max(sectors.length, 1);
    const R1 = 178;

    const laidGroups: LaidOutGroup[] = sectors.map((sector, i) => {
      const a = (i / G) * Math.PI * 2 - Math.PI / 2;
      const gx = CX + Math.cos(a) * R1;
      const gy = CY + Math.sin(a) * R1;
      const members = [...(bySector.get(sector) ?? [])].sort(
        (m1, m2) => (m2.latestSnapshot!.sis_score) - (m1.latestSnapshot!.sis_score),
      );
      const m = members.length;
      const spread = Math.min(Math.PI * 0.95, 0.5 + m * 0.17);
      const laidMembers: LaidOutMember[] = members.map((mem, j) => {
        const t = m === 1 ? 0 : (j / (m - 1) - 0.5);
        const ma = a + t * spread;
        const r2 = 86 + (j % 3) * 26;
        return {
          id: mem.id,
          name: mem.full_name,
          x: gx + Math.cos(ma) * r2,
          y: gy + Math.sin(ma) * r2,
          sis: mem.latestSnapshot!.sis_score,
        };
      });
      return { key: sector, label: GROUP_LABELS[sector] ?? sector, x: gx, y: gy, members: laidMembers };
    });

    return { principal: principalNode, groups: laidGroups };
  }, [stakeholders]);

  // Build a neighbour set so hovering a node can spotlight its connections.
  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      if (!map.has(a)) map.set(a, new Set());
      if (!map.has(b)) map.set(b, new Set());
      map.get(a)!.add(b);
      map.get(b)!.add(a);
    };
    if (principal) groups.forEach(g => {
      add('principal', `g-${g.key}`);
      g.members.forEach(mem => add(`g-${g.key}`, mem.id));
    });
    return map;
  }, [principal, groups]);

  const isLit = (id: string) => {
    if (!hovered) return true;
    return hovered === id || neighbours.get(hovered)?.has(id) === true;
  };
  const edgeLit = (a: string, b: string) => {
    if (!hovered) return true;
    return hovered === a || hovered === b;
  };

  const transform = `translate(${CX * (1 - zoom)} ${CY * (1 - zoom)}) scale(${zoom})`;
  const memberCount = groups.reduce((n, g) => n + g.members.length, 0);

  if (!principal) {
    return (
      <div className="flex items-center justify-center" style={{ height: 480, color: 'var(--text-muted)' }}>
        No scored stakeholders to map yet.
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: '100%' }}>
      {/* Toolbar */}
      <div
        className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-xl px-1.5 py-1"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
      >
        <ToolButton label="Zoom in" onClick={() => setZoom(z => Math.min(2, +(z + 0.2).toFixed(2)))}><Plus size={15} /></ToolButton>
        <ToolButton label="Zoom out" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(2)))}><Minus size={15} /></ToolButton>
        <ToolButton label="Reset view" onClick={() => setZoom(1)}><Crosshair size={15} /></ToolButton>
        <div className="w-px h-5 mx-0.5" style={{ background: 'var(--border-default)' }} />
        <ToolButton label="Replay animation" onClick={() => setReplay(r => r + 1)}><RotateCcw size={15} /></ToolButton>
      </div>

      {/* Legend */}
      <div
        className="absolute top-3 right-3 z-10 rounded-xl px-3 py-2.5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={11} style={{ color: 'var(--brand-primary)' }} />
          <span className="text-label" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>Intelligence Legend</span>
        </div>
        {[
          { c: COLORS.principal, l: 'Principal' },
          { c: COLORS.group, l: 'Group' },
          { c: COLORS.member, l: 'Member' },
        ].map(item => (
          <div key={item.l} className="flex items-center gap-2 py-0.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: item.c }} />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{item.l}</span>
          </div>
        ))}
      </div>

      <svg
        key={replay}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: 540, display: 'block', cursor: 'grab' }}
      >
        <g transform={transform}>
          {/* Edges: principal -> groups */}
          {groups.map((g, i) => (
            <motion.line
              key={`pe-${g.key}`}
              x1={CX} y1={CY} x2={g.x} y2={g.y}
              stroke={COLORS.edge}
              strokeWidth={1.4}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: edgeLit('principal', `g-${g.key}`) ? 0.6 : 0.08 }}
              transition={{ pathLength: { duration: 0.7, delay: 0.3 + i * 0.05 }, opacity: { duration: 0.3 } }}
            />
          ))}
          {/* Edges: group -> members */}
          {groups.map((g, i) => g.members.map((mem, j) => (
            <motion.line
              key={`me-${mem.id}`}
              x1={g.x} y1={g.y} x2={mem.x} y2={mem.y}
              stroke={COLORS.edge}
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: edgeLit(`g-${g.key}`, mem.id) ? 0.4 : 0.06 }}
              transition={{ pathLength: { duration: 0.5, delay: 0.6 + i * 0.05 + j * 0.02 }, opacity: { duration: 0.3 } }}
            />
          )))}

          {/* Member nodes */}
          {groups.map((g, i) => g.members.map((mem, j) => (
            <Node
              key={mem.id}
              x={mem.x} y={mem.y} r={8} color={COLORS.member}
              label={lastName(mem.name)} fullLabel={mem.name}
              delay={0.7 + i * 0.05 + j * 0.03}
              lit={isLit(mem.id)}
              onHover={() => setHovered(mem.id)}
              onLeave={() => setHovered(null)}
              onClick={() => onSelect(mem.id)}
            />
          )))}

          {/* Group nodes */}
          {groups.map((g, i) => (
            <Node
              key={`g-${g.key}`}
              x={g.x} y={g.y} r={14} color={COLORS.group}
              label={g.label} fullLabel={`${g.label} · ${g.members.length} member${g.members.length === 1 ? '' : 's'}`}
              bold
              delay={0.3 + i * 0.06}
              lit={isLit(`g-${g.key}`)}
              onHover={() => setHovered(`g-${g.key}`)}
              onLeave={() => setHovered(null)}
            />
          ))}

          {/* Principal node (with pulse) */}
          <g transform={`translate(${CX} ${CY})`}>
            <motion.circle
              r={18}
              fill={COLORS.principal}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: [1, 2.1, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
          <Node
            x={CX} y={CY} r={18} color={COLORS.principal}
            label={lastName(principal.full_name)} fullLabel={`${principal.full_name} — Principal`}
            bold principal
            delay={0}
            lit={isLit('principal')}
            onHover={() => setHovered('principal')}
            onLeave={() => setHovered(null)}
            onClick={() => onSelect(principal.id)}
          />
        </g>
      </svg>

      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          {principal.full_name} mapped across {groups.length} affiliation group{groups.length === 1 ? '' : 's'} and {memberCount} connected stakeholders. Hover to spotlight, click a node to open the profile.
        </p>
      </div>
    </div>
  );
}

function ToolButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Node({
  x, y, r, color, label, fullLabel, delay, lit, bold, principal, onHover, onLeave, onClick,
}: {
  x: number; y: number; r: number; color: string; label: string; fullLabel: string;
  delay: number; lit: boolean; bold?: boolean; principal?: boolean;
  onHover: () => void; onLeave: () => void; onClick?: () => void;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ cursor: onClick ? 'pointer' : 'default', opacity: lit ? 1 : 0.2, transition: 'opacity 0.25s' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay }}
      >
        <motion.g
          animate={{ y: [0, principal ? 0 : -3.5, 0] }}
          transition={{ duration: 3.6 + (x % 7) * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.18 }}
        >
          <circle r={r + 3} fill={color} opacity={0.18} />
          <circle r={r} fill={color} stroke="white" strokeWidth={principal ? 2.5 : 1.5} />
          <text
            y={r + 11}
            textAnchor="middle"
            style={{
              fontSize: bold ? 9 : 7.5,
              fontWeight: bold ? 700 : 500,
              fill: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}
          >
            {label.length > 22 ? `${label.slice(0, 21)}…` : label}
          </text>
          <title>{fullLabel}</title>
        </motion.g>
      </motion.g>
    </g>
  );
}
