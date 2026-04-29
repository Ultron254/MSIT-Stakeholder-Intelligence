import React from 'react';
import {
  LayoutDashboard, Users, Target, MessageSquare, ClipboardList,
  AlertTriangle, Settings, ChevronLeft, ChevronRight, UserCog,
} from 'lucide-react';
import { useAppStore, type Page } from '../../lib/store';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Intelligence',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'stakeholders', label: 'Stakeholders', icon: Users },
      { id: 'quadrant-map', label: 'Quadrant Map', icon: Target },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'engagements', label: 'Engagements', icon: MessageSquare },
      { id: 'engagement-plans', label: 'Engagement Plans', icon: ClipboardList },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { id: 'watchlist', label: 'Watchlist', icon: AlertTriangle },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'scoring-config', label: 'Scoring Config', icon: Settings },
      { id: 'users', label: 'Users & Access', icon: UserCog },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col border-r transition-all duration-250 ease-in-out z-40"
      style={{
        width: sidebarCollapsed ? 64 : 260,
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 h-20 border-b shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {sidebarCollapsed ? (
          <div className="w-9 h-9 flex items-center justify-center mx-auto">
            <img
              src="/momentum-mark.svg"
              alt="Momentum Africa Partners"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <img
            src="/momentum-logo.svg"
            alt="Momentum Africa Partners"
            className="h-12 w-auto"
            style={{ maxWidth: '100%' }}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!sidebarCollapsed && (
              <div className="text-label px-2 mb-1.5" style={{ fontSize: '0.625rem' }}>
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
                  className="w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 group relative"
                  style={{
                    height: 38,
                    padding: sidebarCollapsed ? '0 12px' : '0 10px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    background: isActive ? 'var(--bg-secondary)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)';
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: 'var(--accent-primary)' }}
                    />
                  )}
                  <Icon size={18} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {sidebarCollapsed && (
                    <div
                      className="absolute left-full ml-2 px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50"
                      style={{
                        background: 'var(--bg-dark)',
                        color: 'var(--text-inverse)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        boxShadow: 'var(--shadow-lg)',
                      }}
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

      {/* Campaign Context */}
      {!sidebarCollapsed && (
        <div
          className="mx-3 mb-3 p-3 rounded-lg relative overflow-hidden"
          style={{
            background: 'var(--gradient-brand-dark)',
            fontSize: '0.75rem',
            color: 'white',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle at top right, rgba(0,184,212,0.6), transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <div className="relative">
            <div className="text-label mb-1" style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)' }}>Active Campaign</div>
            <div style={{ color: 'white', fontWeight: 600 }}>
              Renewable Energy Bill 2026
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)' }} className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
              Kenya · Live
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t transition-colors duration-150"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
