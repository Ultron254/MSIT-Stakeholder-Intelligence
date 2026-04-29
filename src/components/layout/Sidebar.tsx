import React from 'react';
import {
  LayoutDashboard, Users, Target, MessageSquare, ClipboardList,
  AlertTriangle, Settings, ChevronLeft, ChevronRight, UserCog,
} from 'lucide-react';
import { useAppStore, type Page } from '../../lib/store';
import Tooltip from '../ui/Tooltip';

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
      className="fixed left-0 top-0 h-screen flex flex-col transition-all duration-250 ease-in-out z-40"
      style={{
        width: sidebarCollapsed ? 64 : 260,
        background: 'linear-gradient(180deg, #0F1E29 0%, #1A2D3A 100%)',
        borderRight: '1px solid rgba(45, 166, 126, 0.15)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, #2DA67E 0%, transparent 60%)',
        }}
      />

      {/* Logo */}
      <div
        className="relative flex items-center px-4 h-20 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
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
            src="/momentum-logo-light.svg"
            alt="Momentum Africa Partners"
            className="h-12 w-auto"
            style={{ maxWidth: '100%' }}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto py-4 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            {!sidebarCollapsed && (
              <div
                className="px-3 mb-2"
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                }}
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
                    padding: sidebarCollapsed ? '0 12px' : '0 12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    background: isActive ? 'rgba(45, 166, 126, 0.15)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    border: isActive ? '1px solid rgba(45, 166, 126, 0.35)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                    }
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                      style={{
                        background: '#2DA67E',
                        boxShadow: '0 0 8px rgba(45,166,126,0.6)',
                      }}
                    />
                  )}
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? '#2DA67E' : 'inherit',
                      transition: 'color 0.2s',
                    }}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {sidebarCollapsed && (
                    <div
                      className="absolute left-full ml-2 px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50"
                      style={{
                        background: '#0F1E29',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(45, 166, 126, 0.25)',
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
          className="relative mx-3 mb-3 p-3 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(45,166,126,0.18) 0%, rgba(45,166,126,0.08) 100%)',
            fontSize: '0.75rem',
            color: 'white',
            border: '1px solid rgba(45, 166, 126, 0.25)',
          }}
        >
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at top right, rgba(45,166,126,0.3), transparent 60%)',
            }}
          />
          <div className="relative">
            <div
              style={{
                fontSize: '0.5625rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 4,
              }}
            >
              Active Campaign
            </div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.8125rem' }}>
              Renewable Energy Bill 2026
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)' }} className="mt-1 flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#4ADE80',
                  boxShadow: '0 0 6px #4ADE80',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }}
              />
              Kenya · Live
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <Tooltip content={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
      <button
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="relative flex items-center justify-center h-10 transition-colors duration-150"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.5)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        }}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      </Tooltip>
    </aside>
  );
}
