import { useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { QuadrantBadge, SISBadge, ConfidenceBadge, SectorBadge, LayerIndicator, Card } from '../components/ui/Badges';
import { QUADRANT_LABELS, SECTOR_LABELS } from '../lib/types';
import type { Quadrant, Sector } from '../lib/types';
import { formatRelativeDate } from '../lib/formatters';

const ITEMS_PER_PAGE = 25;

export default function Stakeholders() {
  const { filters, setFilter, clearFilters, setSelectedStakeholder } = useAppStore();
  const filtered = useAppStore(s => s.getFilteredStakeholders());
  const totalCount = useAppStore(s => s.getStakeholdersWithScores().length);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const quadrantOptions: Quadrant[] = ['strategic_ally', 'power_gap', 'hidden_champion', 'monitor_exit'];
  const sectorOptions: Sector[] = ['politics', 'civil_service', 'business', 'media', 'civil_society', 'international', 'judiciary', 'academia'];
  const layerOptions: (1|2|3)[] = [1, 2, 3];

  const hasActiveFilters = filters.search || filters.quadrants.length > 0 || filters.sectors.length > 0 || filters.layers.length > 0;

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Stakeholders</h1>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} of {totalCount} stakeholders
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search name, org, title..."
              value={filters.search}
              onChange={(e) => { setFilter('search', e.target.value); setPage(0); }}
              className="w-full rounded-lg pl-9 pr-3 py-2 text-body-sm outline-none transition-all"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Quadrant filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {quadrantOptions.map((q) => {
              const active = filters.quadrants.includes(q);
              return (
                <button
                  key={q}
                  onClick={() => {
                    const next = active ? filters.quadrants.filter(x => x !== q) : [...filters.quadrants, q];
                    setFilter('quadrants', next); setPage(0);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: active ? QUADRANT_LABELS[q] ? `${q === 'strategic_ally' ? 'var(--quadrant-ally-bg)' : q === 'power_gap' ? 'var(--quadrant-power-gap-bg)' : q === 'hidden_champion' ? 'var(--quadrant-hidden-bg)' : 'var(--quadrant-monitor-bg)'}` : 'var(--bg-inset)' : 'var(--bg-inset)',
                    color: active ? `${q === 'strategic_ally' ? 'var(--quadrant-ally-text)' : q === 'power_gap' ? 'var(--quadrant-power-gap-text)' : q === 'hidden_champion' ? 'var(--quadrant-hidden-text)' : 'var(--quadrant-monitor-text)'}` : 'var(--text-secondary)',
                    border: active ? '1px solid transparent' : '1px solid var(--border-default)',
                  }}
                >
                  {QUADRANT_LABELS[q]}
                </button>
              );
            })}
          </div>

          {/* Sector dropdown */}
          <select
            value={filters.sectors.length === 1 ? filters.sectors[0] : ''}
            onChange={(e) => { setFilter('sectors', e.target.value ? [e.target.value as Sector] : []); setPage(0); }}
            className="rounded-lg px-3 py-2 text-body-sm outline-none"
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <option value="">All Sectors</option>
            {sectorOptions.map(s => <option key={s} value={s}>{SECTOR_LABELS[s]}</option>)}
          </select>

          {/* Layer filter */}
          <div className="flex gap-1">
            {layerOptions.map(l => {
              const active = filters.layers.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => {
                    const next = active ? filters.layers.filter(x => x !== l) : [...filters.layers, l];
                    setFilter('layers', next); setPage(0);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: active ? 'var(--accent-primary)' : 'var(--bg-inset)',
                    color: active ? 'white' : 'var(--text-secondary)',
                    border: active ? '1px solid transparent' : '1px solid var(--border-default)',
                  }}
                >
                  L{l}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilter('sortBy', e.target.value as typeof filters.sortBy)}
            className="rounded-lg px-3 py-2 text-body-sm outline-none"
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <option value="sis_desc">SIS High to Low</option>
            <option value="sis_asc">SIS Low to High</option>
            <option value="name_asc">Name A-Z</option>
            <option value="last_updated">Last Updated</option>
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { clearFilters(); setPage(0); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ color: 'var(--status-danger)' }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th className="text-label text-left px-4 py-3" style={{ width: '25%' }}>Stakeholder</th>
                <th className="text-label text-left px-4 py-3" style={{ width: '15%' }}>Title</th>
                <th className="text-label text-left px-4 py-3" style={{ width: '8%' }}>Sector</th>
                <th className="text-label text-center px-4 py-3" style={{ width: '6%' }}>Layer</th>
                <th className="text-label text-right px-4 py-3" style={{ width: '8%' }}>SIS</th>
                <th className="text-label text-left px-4 py-3" style={{ width: '14%' }}>Quadrant</th>
                <th className="text-label text-center px-4 py-3" style={{ width: '5%' }}>Conf.</th>
                <th className="text-label text-right px-4 py-3" style={{ width: '10%' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s, i) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedStakeholder(s.id)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: i % 2 === 1 ? 'var(--bg-primary)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? 'var(--bg-primary)' : 'transparent'; }}
                >
                  <td className="px-4 py-3">
                    <div className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{s.full_name}</div>
                    <div className="text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.organization}</div>
                  </td>
                  <td className="px-4 py-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>{s.title}</td>
                  <td className="px-4 py-3"><SectorBadge sector={s.sector} /></td>
                  <td className="px-4 py-3 text-center"><LayerIndicator layer={s.proximity_layer} /></td>
                  <td className="px-4 py-3 text-right">
                    {s.latestSnapshot ? <SISBadge score={s.latestSnapshot.sis_score} size="sm" /> : <span style={{ color: 'var(--text-muted)' }}>--</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.latestSnapshot && <QuadrantBadge quadrant={s.latestSnapshot.quadrant} size="sm" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.latestSnapshot && <ConfidenceBadge confidence={s.latestSnapshot.overall_confidence} />}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {s.latestSnapshot ? formatRelativeDate(s.latestSnapshot.scored_at) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
            Showing {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="w-8 h-8 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: page === i ? 'var(--text-primary)' : 'transparent',
                  color: page === i ? 'white' : 'var(--text-secondary)',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
