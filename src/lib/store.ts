import { create } from 'zustand';
import { useMemo } from 'react';
import type {
  Quadrant, Sector, Confidence, ScoreSnapshot, Stakeholder, EngagementRecord,
  WatchlistSignal, User, EvidenceRecord, StakeholderWithScore, Campaign, Client,
  PartnerInvite, UserRole, EngagementPlan, ClientRequest,
} from './types';
import type { ActivityItem } from './data';
import {
  stakeholders, scoreSnapshots, engagementRecords, evidenceRecords,
  engagementPlans, watchlistSignals, activityFeed, users,
  scoringWeights, objectives, countries, stakeholderObjectives, componentScores,
  getLatestSnapshot,
} from './data';
import {
  campaigns as campaignSeed, extraStakeholders, extraSnapshots, extraComponentScores,
  extraPlans, extraEngagements, extraEvidence, extraWatchlist, extraActivity,
} from './campaigns';
import { detectRedFlags } from './scoring-engine';

export type Page =
  | 'dashboard' | 'stakeholders' | 'stakeholder-detail' | 'quadrant-map'
  | 'engagements' | 'engagement-plans' | 'watchlist' | 'scoring-config'
  | 'users' | 'add-stakeholder' | 'data-streams' | 'campaigns'
  | 'approvals' | 'clients' | 'team-activity' | 'partners';

interface Filters {
  search: string;
  quadrants: Quadrant[];
  sectors: Sector[];
  layers: (1|2|3)[];
  confidence: Confidence[];
  sortBy: 'sis_desc' | 'sis_asc' | 'name_asc' | 'last_updated';
}

// Seed clients. One approved client powers the POC client view; one pending
// client gives the partner something to approve.
const seedClients: Client[] = [
  {
    id: 'cl-001', name: 'Grace Kimani', client_type: 'organization', organization: 'Green Future Foundation',
    email: 'grace.kimani@greenfuture.org', campaign_ids: ['o-001', 'o-005'],
    curated_stakeholder_ids: ['s-001', 's-003', 's-005', 's-007', 's-009', 's-013', 's-028', 's-029', 's-032', 'w-001', 'w-002', 'w-004', 'w-009'],
    brief: 'Philanthropic funder seeking aligned champions and convertible legislators across the renewable energy transition and water resource reform.',
    access_level: 'detailed', status: 'approved', created_by: 'u-002', approved_by: 'u-003',
    created_at: '2026-03-20', gender: 'female', portrait_url: null,
  },
  {
    id: 'cl-002', name: 'Halisi Renewables Ltd', client_type: 'organization', organization: 'Halisi Renewables Ltd',
    email: 'partnerships@halisi.co.ke', campaign_ids: ['o-001'],
    curated_stakeholder_ids: ['s-001', 's-004', 's-011', 's-028'],
    brief: 'Private developer evaluating which regulators and legislators to prioritise for project approvals.',
    access_level: 'overview', status: 'pending_approval', created_by: 'u-002', approved_by: null,
    created_at: '2026-04-10', gender: 'male', portrait_url: null,
  },
];

const seedInvites: PartnerInvite[] = [
  { id: 'pi-001', email: 'amara.diallo@momentum.africa', display_name: 'Amara Diallo', invited_by: 'u-003', status: 'sent', sent_at: '2026-04-08' },
];

interface AppState {
  // Auth
  authedUserId: string | null;
  login: (email: string, password: string) => boolean;
  loginAs: (userId: string) => void;
  logout: () => void;

  currentPage: Page;
  selectedStakeholderId: string | null;
  sidebarCollapsed: boolean;

  // Active campaign -- switching this swaps the whole stakeholder landscape.
  campaigns: Campaign[];
  currentCampaignId: string;
  setCampaign: (id: string) => void;
  addCampaign: (campaign: Campaign) => void;

  filters: Filters;

  scoreUpdateOpen: boolean;
  scoreUpdateStakeholderId: string | null;

  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;

  searchOpen: boolean;

  currentUserId: string;
  setCurrentUser: (userId: string) => void;

  aiPanelCollapsed: boolean;
  toggleAIPanel: () => void;

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

  // Append-only: new submissions are pushed here, never overwritten
  snapshots: ScoreSnapshot[];
  addSnapshot: (snapshot: ScoreSnapshot) => void;
  approveSnapshot: (id: string, approverId: string) => void;
  rejectSnapshot: (id: string, reason?: string, evidence?: string) => void;

  // Engagement plans live in state so leads/partners/analysts can edit them.
  plans: EngagementPlan[];
  addPlan: (plan: EngagementPlan) => void;
  updatePlan: (id: string, updates: Partial<EngagementPlan>) => void;

  // Requests raised from the client portal (intros / meetings / briefings).
  clientRequests: ClientRequest[];
  addClientRequest: (request: ClientRequest) => void;
  updateClientRequest: (id: string, updates: Partial<ClientRequest>) => void;

  engagements: EngagementRecord[];
  addEngagement: (record: EngagementRecord) => void;

  watchlist: WatchlistSignal[];
  addWatchlistSignal: (signal: WatchlistSignal) => void;
  resolveWatchlistSignal: (id: string) => void;

  storeUsers: User[];
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;

  evidence: EvidenceRecord[];
  addEvidence: (record: EvidenceRecord) => void;

  storeStakeholders: Stakeholder[];
  addStakeholder: (stakeholder: Stakeholder) => void;
  toggleVipSensitive: (stakeholderId: string, ownerId: string) => void;

  // Clients (curated end-user accounts)
  clients: Client[];
  addClient: (client: Client) => void;
  approveClient: (id: string, approverId: string) => void;
  rejectClient: (id: string) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;

  // Partner invitations
  partnerInvites: PartnerInvite[];
  addPartnerInvite: (invite: PartnerInvite) => void;
  revokePartnerInvite: (id: string) => void;

  engagementDetailId: string | null;
  openEngagementDetail: (id: string) => void;
  closeEngagementDetail: () => void;

  logEngagementOpen: boolean;
  logEngagementStakeholderId: string | null;
  openLogEngagement: (stakeholderId?: string) => void;
  closeLogEngagement: () => void;

  editUserModalOpen: boolean;
  editUserModalId: string | null;
  openEditUser: (userId: string | null) => void;
  closeEditUser: () => void;

  addWatchlistModalOpen: boolean;
  addWatchlistStakeholderId: string | null;
  openAddWatchlist: (stakeholderId: string) => void;
  closeAddWatchlist: () => void;

  activityFeed: ActivityItem[];
  addActivity: (activity: ActivityItem) => void;
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
  authedUserId: null,
  login: (email, password) => {
    const u = get().storeUsers.find(
      x => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password && x.is_active
    );
    if (!u) return false;
    set({ authedUserId: u.id, currentUserId: u.id, currentPage: 'dashboard', selectedStakeholderId: null });
    return true;
  },
  loginAs: (userId) => set({ authedUserId: userId, currentUserId: userId, currentPage: 'dashboard', selectedStakeholderId: null }),
  logout: () => set({ authedUserId: null, currentPage: 'dashboard', selectedStakeholderId: null }),

  currentPage: 'dashboard',
  selectedStakeholderId: null,
  sidebarCollapsed: false,

  campaigns: [...campaignSeed],
  currentCampaignId: 'o-001',
  setCampaign: (id) => set({ currentCampaignId: id, selectedStakeholderId: null, filters: { ...defaultFilters } }),
  addCampaign: (campaign) => set(s => ({ campaigns: [...s.campaigns, campaign] })),

  filters: { ...defaultFilters },
  scoreUpdateOpen: false,
  scoreUpdateStakeholderId: null,
  toasts: [],
  searchOpen: false,
  currentUserId: 'u-001',
  snapshots: [...scoreSnapshots, ...extraSnapshots],

  engagements: [...engagementRecords, ...extraEngagements],
  watchlist: [...watchlistSignals, ...extraWatchlist],
  storeUsers: [...users],
  evidence: [...evidenceRecords, ...extraEvidence],
  storeStakeholders: [...stakeholders, ...extraStakeholders],
  activityFeed: [...activityFeed, ...extraActivity],

  plans: [...engagementPlans, ...extraPlans],
  addPlan: (plan) => set(s => ({ plans: [...s.plans, plan] })),
  updatePlan: (id, updates) => set(s => ({
    plans: s.plans.map(p => p.id === id ? { ...p, ...updates } : p),
  })),

  clientRequests: [],
  addClientRequest: (request) => set(s => ({ clientRequests: [request, ...s.clientRequests] })),
  updateClientRequest: (id, updates) => set(s => ({
    clientRequests: s.clientRequests.map(r => r.id === id ? { ...r, ...updates } : r),
  })),

  clients: [...seedClients],
  addClient: (client) => set(s => ({ clients: [...s.clients, client] })),
  approveClient: (id, approverId) => set(s => ({
    clients: s.clients.map(c => c.id === id ? { ...c, status: 'approved', approved_by: approverId } : c),
  })),
  rejectClient: (id) => set(s => ({
    clients: s.clients.map(c => c.id === id ? { ...c, status: 'rejected' } : c),
  })),
  updateClient: (id, updates) => set(s => ({
    clients: s.clients.map(c => c.id === id ? { ...c, ...updates } : c),
  })),

  partnerInvites: [...seedInvites],
  addPartnerInvite: (invite) => set(s => ({ partnerInvites: [...s.partnerInvites, invite] })),
  revokePartnerInvite: (id) => set(s => ({
    partnerInvites: s.partnerInvites.map(p => p.id === id ? { ...p, status: 'revoked' } : p),
  })),

  engagementDetailId: null,
  openEngagementDetail: (id) => set({ engagementDetailId: id }),
  closeEngagementDetail: () => set({ engagementDetailId: null }),

  logEngagementOpen: false,
  logEngagementStakeholderId: null,
  openLogEngagement: (stakeholderId) => set({ logEngagementOpen: true, logEngagementStakeholderId: stakeholderId ?? null }),
  closeLogEngagement: () => set({ logEngagementOpen: false, logEngagementStakeholderId: null }),

  editUserModalOpen: false,
  editUserModalId: null,
  openEditUser: (userId) => set({ editUserModalOpen: true, editUserModalId: userId }),
  closeEditUser: () => set({ editUserModalOpen: false, editUserModalId: null }),

  addWatchlistModalOpen: false,
  addWatchlistStakeholderId: null,
  openAddWatchlist: (stakeholderId) => set({ addWatchlistModalOpen: true, addWatchlistStakeholderId: stakeholderId }),
  closeAddWatchlist: () => set({ addWatchlistModalOpen: false, addWatchlistStakeholderId: null }),

  setCurrentUser: (userId) => set({ currentUserId: userId }),

  aiPanelCollapsed: false,
  toggleAIPanel: () => set(s => ({ aiPanelCollapsed: !s.aiPanelCollapsed })),

  setPage: (page) => set({ currentPage: page, selectedStakeholderId: null }),
  setSelectedStakeholder: (id) => {
    // Opening a stakeholder also activates their campaign so the detail page
    // (and its scoped lists) resolve correctly across campaigns.
    const st = id ? get().storeStakeholders.find(s => s.id === id) : null;
    set({
      selectedStakeholderId: id,
      currentPage: 'stakeholder-detail',
      ...(st ? { currentCampaignId: st.campaign_id } : {}),
    });
  },
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
  approveSnapshot: (id, approverId) => set(s => ({
    snapshots: s.snapshots.map(sn => sn.id === id
      ? { ...sn, workflow_status: 'approved', approved_by: approverId, approved_at: new Date().toISOString().slice(0, 10) }
      : sn),
  })),
  rejectSnapshot: (id, reason, evidence) => set(s => ({
    snapshots: s.snapshots.map(sn => sn.id === id
      ? { ...sn, workflow_status: 'rejected', rejection_reason: reason ?? null, rejection_evidence: evidence ?? null }
      : sn),
  })),

  addEngagement: (record) => set(s => ({ engagements: [...s.engagements, record] })),

  addWatchlistSignal: (signal) => set(s => ({ watchlist: [...s.watchlist, signal] })),
  resolveWatchlistSignal: (id) => set(s => ({
    watchlist: s.watchlist.map(w => w.id === id ? { ...w, is_resolved: true, resolved_at: new Date().toISOString().slice(0, 10) } : w),
  })),

  addUser: (user) => set(s => ({ storeUsers: [...s.storeUsers, user] })),
  updateUser: (userId, updates) => set(s => ({
    storeUsers: s.storeUsers.map(u => u.id === userId ? { ...u, ...updates } : u),
  })),

  addEvidence: (record) => set(s => ({ evidence: [...s.evidence, record] })),

  addStakeholder: (stakeholder) => set(s => ({ storeStakeholders: [...s.storeStakeholders, stakeholder] })),
  toggleVipSensitive: (stakeholderId, ownerId) => set(s => ({
    storeStakeholders: s.storeStakeholders.map(st => st.id === stakeholderId
      ? { ...st, vip_owner_id: st.vip_owner_id ? null : ownerId }
      : st),
  })),

  addActivity: (activity) => set(s => ({ activityFeed: [activity, ...s.activityFeed] })),
}));

export {
  scoreSnapshots, engagementPlans,
  scoringWeights, objectives, countries, stakeholderObjectives, componentScores,
  getLatestSnapshot,
};

export { stakeholders, engagementRecords, evidenceRecords, watchlistSignals, users, activityFeed } from './data';

// Campaign-aware combined collections (seed + generated extra campaigns).
export const allEngagementPlans = [...engagementPlans, ...extraPlans];
export const allComponentScores = [...componentScores, ...extraComponentScores];

// Convenience selectors -----------------------------------------------------

export function useCurrentUser(): User | null {
  const authedUserId = useAppStore(s => s.authedUserId);
  const storeUsers = useAppStore(s => s.storeUsers);
  return useMemo(() => storeUsers.find(u => u.id === authedUserId) ?? null, [authedUserId, storeUsers]);
}

export function useCurrentRole(): UserRole | null {
  const user = useCurrentUser();
  return user?.role ?? null;
}

export function useCurrentCampaign(): Campaign | null {
  const campaigns = useAppStore(s => s.campaigns);
  const currentCampaignId = useAppStore(s => s.currentCampaignId);
  return useMemo(() => campaigns.find(c => c.id === currentCampaignId) ?? campaigns[0] ?? null, [campaigns, currentCampaignId]);
}

// Derived-data hooks, memoised on store state so consumers get stable refs.

function computeStakeholdersWithScores(stakeholdersList: Stakeholder[], snaps: ScoreSnapshot[], engagementsList: EngagementRecord[]): StakeholderWithScore[] {
  return stakeholdersList.map(s => {
    const stakeholderSnaps = snaps
      .filter(snap => snap.stakeholder_id === s.id)
      .sort((a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime());
    const latest = stakeholderSnaps[0] ?? null;
    const stakeEngagements = engagementsList.filter(e => e.stakeholder_id === s.id);
    const lastEngDate = stakeEngagements.length > 0
      ? [...stakeEngagements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : null;
    const flags = detectRedFlags(s, latest, engagementsList);
    return {
      ...s,
      latestSnapshot: latest,
      engagementCount: stakeEngagements.length,
      lastEngagementDate: lastEngDate,
      redFlags: flags,
    };
  });
}

// A partner-restricted VIP is visible to its owner and to administrators
// (platform superusers with full oversight); everyone else is excluded.
export function canSeeVip(
  s: { vip_owner_id?: string | null },
  userId: string | null,
  role: UserRole | null,
): boolean {
  return !s.vip_owner_id || s.vip_owner_id === userId || role === 'admin';
}

// The role of whoever is currently acting (the active user id). Kept as a
// stable string selector so memoised hooks don't re-run unnecessarily.
export function useActingRole(): UserRole | null {
  return useAppStore(s => s.storeUsers.find(u => u.id === s.currentUserId)?.role ?? null);
}

// Visibility: scope to the active campaign and hide partner-restricted VIPs
// from everyone except their owner (and admins).
function visibleFor(
  list: Stakeholder[],
  campaignId: string,
  userId: string | null,
  role: UserRole | null,
): Stakeholder[] {
  return list.filter(s => s.campaign_id === campaignId && canSeeVip(s, userId, role));
}

export function useStakeholdersWithScores(): StakeholderWithScore[] {
  const snapshots = useAppStore(s => s.snapshots);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const engagements = useAppStore(s => s.engagements);
  const currentCampaignId = useAppStore(s => s.currentCampaignId);
  const currentUserId = useAppStore(s => s.currentUserId);
  const role = useActingRole();
  return useMemo(() => {
    const visible = visibleFor(storeStakeholders, currentCampaignId, currentUserId, role);
    return computeStakeholdersWithScores(visible, snapshots, engagements);
  }, [storeStakeholders, snapshots, engagements, currentCampaignId, currentUserId, role]);
}

// Cross-campaign view (partners/leads who want the whole org at a glance).
export function useAllStakeholdersWithScores(): StakeholderWithScore[] {
  const snapshots = useAppStore(s => s.snapshots);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const engagements = useAppStore(s => s.engagements);
  const currentUserId = useAppStore(s => s.currentUserId);
  const role = useActingRole();
  return useMemo(() => {
    const visible = storeStakeholders.filter(s => canSeeVip(s, currentUserId, role));
    return computeStakeholdersWithScores(visible, snapshots, engagements);
  }, [storeStakeholders, snapshots, engagements, currentUserId, role]);
}

export function useFilteredStakeholders(): StakeholderWithScore[] {
  const snapshots = useAppStore(s => s.snapshots);
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const engagements = useAppStore(s => s.engagements);
  const filters = useAppStore(s => s.filters);
  const currentCampaignId = useAppStore(s => s.currentCampaignId);
  const currentUserId = useAppStore(s => s.currentUserId);
  const role = useActingRole();

  return useMemo(() => {
    const visible = visibleFor(storeStakeholders, currentCampaignId, currentUserId, role);
    let filtered = computeStakeholdersWithScores(visible, snapshots, engagements);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.organization.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
      );
    }

    if (filters.quadrants.length > 0) {
      filtered = filtered.filter(s => s.latestSnapshot && filters.quadrants.includes(s.latestSnapshot.quadrant));
    }

    if (filters.sectors.length > 0) {
      filtered = filtered.filter(s => filters.sectors.includes(s.sector));
    }

    if (filters.layers.length > 0) {
      filtered = filtered.filter(s => filters.layers.includes(s.proximity_layer));
    }

    if (filters.confidence.length > 0) {
      filtered = filtered.filter(s => s.latestSnapshot && filters.confidence.includes(s.latestSnapshot.overall_confidence));
    }

    switch (filters.sortBy) {
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
  }, [storeStakeholders, snapshots, engagements, filters, currentCampaignId, currentUserId, role]);
}
