import { create } from 'zustand';
import type { Quadrant, Sector, Confidence, ScoreSnapshot } from './types';
import {
  stakeholders, scoreSnapshots, engagementRecords, evidenceRecords,
  engagementPlans, watchlistSignals, activityFeed, users,
  scoringWeights, objectives, countries, stakeholderObjectives, componentScores,
  getLatestSnapshot,
} from './data';
import { detectRedFlags } from './scoring-engine';
import type { StakeholderWithScore } from './types';

export type Page = 'dashboard' | 'stakeholders' | 'stakeholder-detail' | 'quadrant-map' | 'engagements' | 'engagement-plans' | 'watchlist' | 'scoring-config' | 'users';

interface Filters {
  search: string;
  quadrants: Quadrant[];
  sectors: Sector[];
  layers: (1|2|3)[];
  confidence: Confidence[];
  sortBy: 'sis_desc' | 'sis_asc' | 'name_asc' | 'last_updated';
}

interface AppState {
  // Navigation
  currentPage: Page;
  selectedStakeholderId: string | null;
  sidebarCollapsed: boolean;

  // Filters
  filters: Filters;

  // Score update panel
  scoreUpdateOpen: boolean;
  scoreUpdateStakeholderId: string | null;

  // Toast
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;

  // Search
  searchOpen: boolean;

  // Actions
  setPage: (page: Page) => void;
  setSelectedStakeholder: (id: string | null) => void;
  toggleSidebar: () => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  openScoreUpdate: (stakeholderId: string) => void;
  closeScoreUpdate: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  toggleSearch: () => void;

  // Data accessors
  getStakeholdersWithScores: () => StakeholderWithScore[];
  getFilteredStakeholders: () => StakeholderWithScore[];

  // Score snapshots (mutable for new submissions)
  snapshots: ScoreSnapshot[];
  addSnapshot: (snapshot: ScoreSnapshot) => void;
}

const defaultFilters: Filters = {
  search: '',
  quadrants: [],
  sectors: [],
  layers: [],
  confidence: [],
  sortBy: 'sis_desc',
};

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'dashboard',
  selectedStakeholderId: null,
  sidebarCollapsed: false,
  filters: { ...defaultFilters },
  scoreUpdateOpen: false,
  scoreUpdateStakeholderId: null,
  toasts: [],
  searchOpen: false,
  snapshots: [...scoreSnapshots],

  setPage: (page) => set({ currentPage: page, selectedStakeholderId: null }),
  setSelectedStakeholder: (id) => set({ selectedStakeholderId: id, currentPage: 'stakeholder-detail' }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setFilter: (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
  openScoreUpdate: (stakeholderId) => set({ scoreUpdateOpen: true, scoreUpdateStakeholderId: stakeholderId }),
  closeScoreUpdate: () => set({ scoreUpdateOpen: false, scoreUpdateStakeholderId: null }),
  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}`;
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  toggleSearch: () => set(s => ({ searchOpen: !s.searchOpen })),

  addSnapshot: (snapshot) => set(s => ({ snapshots: [...s.snapshots, snapshot] })),

  getStakeholdersWithScores: () => {
    const snaps = get().snapshots;
    return stakeholders.map(s => {
      const stakeholderSnaps = snaps
        .filter(snap => snap.stakeholder_id === s.id)
        .sort((a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime());
      const latest = stakeholderSnaps[0] ?? null;
      const stakeEngagements = engagementRecords.filter(e => e.stakeholder_id === s.id);
      const lastEngDate = stakeEngagements.length > 0
        ? stakeEngagements.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : null;
      const flags = detectRedFlags(s, latest, engagementRecords);
      return {
        ...s,
        latestSnapshot: latest,
        engagementCount: stakeEngagements.length,
        lastEngagementDate: lastEngDate,
        redFlags: flags,
      };
    });
  },

  getFilteredStakeholders: () => {
    const all = get().getStakeholdersWithScores();
    const f = get().filters;

    let filtered = all;

    if (f.search) {
      const q = f.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.organization.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
      );
    }

    if (f.quadrants.length > 0) {
      filtered = filtered.filter(s => s.latestSnapshot && f.quadrants.includes(s.latestSnapshot.quadrant));
    }

    if (f.sectors.length > 0) {
      filtered = filtered.filter(s => f.sectors.includes(s.sector));
    }

    if (f.layers.length > 0) {
      filtered = filtered.filter(s => f.layers.includes(s.proximity_layer));
    }

    if (f.confidence.length > 0) {
      filtered = filtered.filter(s => s.latestSnapshot && f.confidence.includes(s.latestSnapshot.overall_confidence));
    }

    // Sort
    switch (f.sortBy) {
      case 'sis_desc':
        filtered.sort((a, b) => (b.latestSnapshot?.sis_score ?? 0) - (a.latestSnapshot?.sis_score ?? 0));
        break;
      case 'sis_asc':
        filtered.sort((a, b) => (a.latestSnapshot?.sis_score ?? 0) - (b.latestSnapshot?.sis_score ?? 0));
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case 'last_updated':
        filtered.sort((a, b) => {
          const da = a.latestSnapshot?.scored_at ?? '0';
          const db = b.latestSnapshot?.scored_at ?? '0';
          return db.localeCompare(da);
        });
        break;
    }

    return filtered;
  },
}));

// Re-export data for direct use in components
export {
  stakeholders, scoreSnapshots, engagementRecords, evidenceRecords,
  engagementPlans, watchlistSignals, activityFeed, users,
  scoringWeights, objectives, countries, stakeholderObjectives, componentScores,
  getLatestSnapshot,
};
