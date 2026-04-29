import { Search, Bell, X } from 'lucide-react';
import { useAppStore, watchlistSignals } from '../../lib/store';
import { useStakeholdersWithScores } from '../../lib/store';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { Quadrant } from '../../lib/types';
import { QUADRANT_COLORS, QUADRANT_LABELS } from '../../lib/types';
import { formatSIS } from '../../lib/formatters';
import UserMenu from './UserMenu';
import Tooltip from '../ui/Tooltip';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Intelligence Dashboard',
  stakeholders: 'Stakeholders',
  'stakeholder-detail': 'Stakeholder Profile',
  'quadrant-map': 'Quadrant Map',
  engagements: 'Engagements',
  'engagement-plans': 'Engagement Plans',
  watchlist: 'Watchlist',
  'scoring-config': 'Scoring Configuration',
  users: 'Users & Access',
};

export default function Header() {
  const { currentPage, searchOpen, toggleSearch, setSelectedStakeholder } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const activeAlerts = watchlistSignals.filter(s => !s.is_resolved).length;

  const allWithScores = useStakeholdersWithScores();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allWithScores
      .filter(s => s.full_name.toLowerCase().includes(q) || s.organization.toLowerCase().includes(q) || s.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, allWithScores]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchQuery('');
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, toggleSearch]);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 border-b"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
    >
      <div className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>
        {PAGE_TITLES[currentPage] ?? ''}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Tooltip content="Search stakeholders" shortcut="⌘K" side="bottom" disabled={searchOpen}>
          <button
            onClick={toggleSearch}
            aria-label="Search"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors duration-150"
            style={{
              background: searchOpen ? 'var(--bg-inset)' : 'transparent',
              color: 'var(--text-secondary)',
              border: searchOpen ? '1px solid var(--border-default)' : '1px solid transparent',
            }}
            onMouseEnter={(e) => { if (!searchOpen) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { if (!searchOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <Search size={16} />
            {!searchOpen && (
              <>
                <span className="text-body-sm hidden md:inline">Search</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', fontSize: '0.625rem', fontFamily: 'var(--font-body)' }}>⌘K</kbd>
              </>
            )}
          </button>
          </Tooltip>
          {searchOpen && (
            <div
              className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
              style={{
                width: 400,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stakeholders..."
                  className="flex-1 bg-transparent outline-none text-body-sm"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button onClick={() => { setSearchQuery(''); toggleSearch(); }}>
                  <X size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-1">
                  {searchResults.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStakeholder(s.id); setSearchQuery(''); toggleSearch(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-heading-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.full_name}</div>
                        <div className="text-body-sm truncate" style={{ color: 'var(--text-muted)' }}>{s.organization}</div>
                      </div>
                      {s.latestSnapshot && (
                        <div className="flex items-center gap-2">
                          <span className="text-metric-sm" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {formatSIS(s.latestSnapshot.sis_score)}
                          </span>
                          <QuadrantBadgeSmall quadrant={s.latestSnapshot.quadrant} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <div className="px-4 py-6 text-center text-body-sm" style={{ color: 'var(--text-muted)' }}>
                  No stakeholders found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <Tooltip content={activeAlerts > 0 ? `${activeAlerts} unresolved alert${activeAlerts > 1 ? 's' : ''}` : 'No active alerts'} side="bottom">
        <button
          aria-label="Watchlist alerts"
          className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          onClick={() => useAppStore.getState().setPage('watchlist')}
        >
          <Bell size={18} />
          {activeAlerts > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: 'var(--status-danger)', color: 'white', fontSize: '0.625rem', fontWeight: 700 }}
            >
              {activeAlerts}
            </span>
          )}
        </button>
        </Tooltip>

        {/* User */}
        <UserMenu />
      </div>
    </header>
  );
}

function QuadrantBadgeSmall({ quadrant }: { quadrant: Quadrant }) {
  const colors = QUADRANT_COLORS[quadrant];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded"
      style={{
        background: colors.bg,
        color: colors.text,
        fontSize: '0.6875rem',
        fontWeight: 500,
      }}
    >
      {QUADRANT_LABELS[quadrant].split('/')[0]}
    </span>
  );
}
