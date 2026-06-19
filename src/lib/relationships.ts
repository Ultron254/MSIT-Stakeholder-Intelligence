// Relationship derivation for stakeholder ego-networks.
//
// We do not store an explicit edge list in the POC data, so connections are
// derived deterministically from the stakeholder attributes that imply a real
// relationship: shared organisation (colleagues), shared sector (peers), and a
// few high-leverage cross-sector ties (strategic bridges). The output is stable
// for a given portfolio so the network renders the same way every time.

import type { StakeholderWithScore, Sector } from './types';

export type RelationKind = 'colleague' | 'peer' | 'bridge';

export interface RelatedStakeholder {
  stakeholder: StakeholderWithScore;
  kind: RelationKind;
  // 1 (strongest) … 0 (weakest) — drives edge weight & ordering.
  strength: number;
  label: string;
}

export const RELATION_LABELS: Record<RelationKind, string> = {
  colleague: 'Same organisation',
  peer: 'Same sector',
  bridge: 'Strategic bridge',
};

export const RELATION_COLORS: Record<RelationKind, string> = {
  colleague: '#2563EB',
  peer: '#2DA67E',
  bridge: '#D97706',
};

function sectorLabel(sector: Sector): string {
  return sector.replace(/_/g, ' ');
}

// Simple deterministic hash so "bridge" picks are stable per stakeholder.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function getRelated(
  focalId: string,
  all: StakeholderWithScore[],
  limit = 10,
): RelatedStakeholder[] {
  const focal = all.find(s => s.id === focalId);
  if (!focal) return [];

  const others = all.filter(s => s.id !== focalId);

  const colleagues: RelatedStakeholder[] = others
    .filter(s => s.organization && s.organization === focal.organization)
    .map(s => ({ stakeholder: s, kind: 'colleague' as const, strength: 0.95, label: focal.organization }));

  const colleagueIds = new Set(colleagues.map(c => c.stakeholder.id));

  const peers: RelatedStakeholder[] = others
    .filter(s => !colleagueIds.has(s.id) && s.sector === focal.sector)
    .sort((a, b) => (b.latestSnapshot?.sis_score ?? 0) - (a.latestSnapshot?.sis_score ?? 0))
    .slice(0, 6)
    .map(s => ({ stakeholder: s, kind: 'peer' as const, strength: 0.6, label: sectorLabel(focal.sector) }));

  const peerIds = new Set(peers.map(p => p.stakeholder.id));

  // Strategic bridges: a couple of influential people in *other* sectors, chosen
  // deterministically so the same stakeholder always bridges to the same nodes.
  const candidates = others
    .filter(s => !colleagueIds.has(s.id) && !peerIds.has(s.id) && s.latestSnapshot)
    .sort((a, b) => (b.latestSnapshot?.sis_score ?? 0) - (a.latestSnapshot?.sis_score ?? 0))
    .slice(0, 12);
  const bridgeCount = Math.min(3, candidates.length);
  const start = hash(focalId) % Math.max(1, candidates.length);
  const bridges: RelatedStakeholder[] = [];
  for (let i = 0; i < bridgeCount; i++) {
    const s = candidates[(start + i * 3) % candidates.length];
    if (s && !bridges.some(b => b.stakeholder.id === s.id)) {
      bridges.push({ stakeholder: s, kind: 'bridge', strength: 0.4, label: 'Cross-sector influence' });
    }
  }

  return [...colleagues, ...peers, ...bridges]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit);
}

// Secondary links *between* related nodes (so the graph is interconnected, not
// just a star). Two related nodes are linked when they share an org or sector.
export function getInterLinks(related: RelatedStakeholder[]): Array<[string, string]> {
  const links: Array<[string, string]> = [];
  for (let i = 0; i < related.length; i++) {
    for (let j = i + 1; j < related.length; j++) {
      const a = related[i].stakeholder;
      const b = related[j].stakeholder;
      if (a.organization === b.organization || a.sector === b.sector) {
        links.push([a.id, b.id]);
      }
    }
  }
  return links;
}
