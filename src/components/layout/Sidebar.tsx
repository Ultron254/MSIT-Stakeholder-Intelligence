import React from 'react';
import {
  LayoutDashboard, Users, UserPlus, Target, MessageSquare, ClipboardList,
  AlertTriangle, Settings, Radio, UserCog, Megaphone, CheckSquare,
  Activity, Briefcase, Handshake, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAppStore, useCurrentRole, type Page } from '../../lib/store';
import type { UserRole } from '../../lib/types';
import Tooltip from '../ui/Tooltip';
import CampaignSwitcher from '../CampaignSwitcher';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL: UserRole[] = ['analyst', 'lead', 'partner', 'viewer', 'admin'];
const MGMT: UserRole[] = ['lead', 'partner', 'admin'];
const PARTNER: UserRole[] = ['partner', 'admin'];

const navGroups: NavGroup[] = [
  {
    label: 'Intelligence',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
      { id: 'stakeholders', label: 'Stakeholders', icon: Users, roles: ALL },
      { id: 'add-stakeholder', label: 'Add Stakeholder', icon: UserPlus, roles: ['analyst', 'lead', 'partner', 'admin'] },
      { id: 'quadrant-map', label: 'Quadrant Map', icon: Target, roles: ALL },
      { id: 'campaigns', label: 'Campaigns', icon: Megaphone, roles: ALL },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'engagements', label: 'Engagements', icon: MessageSquare, roles: ALL },
      { id: 'engagement-plans', label: 'Engagement Plans', icon: ClipboardList, roles: ALL },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { id: 'watchlist', label: 'Watchlist', icon: AlertTriangle, roles: ALL },
      { id: 'data-streams', label: 'Data Streams', icon: Radio, roles: ALL },
    ],
  },
  {
    label: 'Oversight',
    items: [
      { id: 'approvals', label: 'Approvals', icon: CheckSquare, roles: MGMT },
      { id: 'team-activity', label: 'Team Activity', icon: Activity, roles: MGMT },
      { id: 'clients', label: 'Clients', icon: Briefcase, roles: MGMT },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'scoring-config', label: 'Scoring Config', icon: Settings, roles: MGMT },
      { id: 'users', label: 'Users & Access', icon: UserCog, roles: MGMT },
      { id: 'partners', label: 'Partners', icon: Handshake, roles: PARTNER },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar } = useAppStore();
  const role = useCurrentRole() ?? 'viewer';

  const visibleGroups = navGroups
    .map(g => ({ ...g, items: g.items.filter(i => i.roles.includes(role)) }))
    .filter(g => g.items.length > 0);

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col transition-all duration-250 ease-in-out z-40"
      style={{
        width: sidebarCollapsed ? 64 : 260,
        background: 'linear-gradient(180deg, #0F1E29 0%, #1A2D3A 100%)',
        borderRight: '1px solid rgba(45, 166, 126, 0.15)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #2DA67E 0%, transparent 60%)' }}
      />

      {/* Logo row with collapse toggle at top-right */}
      <div
        className="relative flex items-center h-20 shrink-0 px-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {sidebarCollapsed ? (
          <Tooltip content="Expand menu" side="right">
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,166,126,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <PanelLeftOpen size={18} />
            </button>
          </Tooltip>
        ) : (
          <>
            <div className="rounded-lg px-3 py-2 flex items-center" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
              <img
                src="/momentum-logo.png"
                alt="Momentum Africa Partners"
                className="h-7 w-auto object-contain block"
                style={{ maxWidth: 150 }}
              />
            </div>
            <Tooltip content="Collapse menu" side="right">
              <button
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                <PanelLeftClose size={18} />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto py-4 px-2">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-5">
            {!sidebarCollapsed && (
              <div
                className="px-3 mb-2"
                style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}
              >
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = currentPage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className="w-full flex items-center gap-3 rounded-lg transition-all duration-200 group relative mb-0.5"
                  style={{
                    height: 40,
                    padding: '0 12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    background: isActive ? 'rgba(45, 166, 126, 0.15)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    border: isActive ? '1px solid rgba(45, 166, 126, 0.35)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#FFFFFF'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                      style={{ background: '#2DA67E', boxShadow: '0 0 8px rgba(45,166,126,0.6)' }}
                    />
                  )}
                  <Icon size={18} style={{ color: isActive ? '#2DA67E' : 'inherit', transition: 'color 0.2s' }} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {sidebarCollapsed && (
                    <div
                      className="absolute left-full ml-2 px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50"
                      style={{ background: '#0F1E29', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', border: '1px solid rgba(45, 166, 126, 0.25)' }}
                    >
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Campaign switcher pinned to the bottom */}
      <div className="relative shrink-0 pb-3">
        <CampaignSwitcher variant="sidebar" collapsed={sidebarCollapsed} />
      </div>
    </aside>
  );
}
