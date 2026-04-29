import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, User as UserIcon, Settings, HelpCircle, LogOut,
  Users as UsersIcon, Shield, Mail, Check,
} from 'lucide-react';
import { useAppStore, users } from '../../lib/store';
import { getAvatarUrl } from '../../lib/avatar';

const ROLE_LABEL: Record<string, string> = {
  analyst: 'Analyst',
  country_lead: 'Country Lead',
  approver: 'Approver',
  viewer: 'Viewer',
  admin: 'Administrator',
};

const ROLE_COLOR: Record<string, string> = {
  analyst: '#2DA67E',
  country_lead: '#1A2D3A',
  approver: '#D97706',
  viewer: '#6B7280',
  admin: '#7C3AED',
};

export default function UserMenu() {
  const currentUserId = useAppStore(s => s.currentUserId);
  const setCurrentUser = useAppStore(s => s.setCurrentUser);
  const setPage = useAppStore(s => s.setPage);
  const addToast = useAppStore(s => s.addToast);

  const user = users.find(u => u.id === currentUserId) ?? users[0];
  const [open, setOpen] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSwitch(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setShowSwitch(false); }
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const avatarUrl = getAvatarUrl(user.display_name, user.gender);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-all duration-150"
        style={{
          background: open ? 'var(--bg-secondary)' : 'transparent',
          border: '1px solid',
          borderColor: open ? 'var(--border-default)' : 'transparent',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div
          className="relative w-8 h-8 rounded-full overflow-hidden shrink-0"
          style={{
            background: 'var(--bg-inset)',
            boxShadow: '0 0 0 2px rgba(45,166,126,0.25)',
          }}
        >
          <img
            src={avatarUrl}
            alt={user.display_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* online dot */}
          <span
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full"
            style={{
              background: '#22C55E',
              boxShadow: '0 0 0 1.5px var(--bg-elevated)',
            }}
          />
        </div>
        <div className="hidden lg:flex flex-col items-start leading-tight">
          <span style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
            {user.display_name.split(' ')[0]}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
            {ROLE_LABEL[user.role]}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="user-menu-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
          style={{
            width: 280,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 20px 50px rgba(15,30,41,0.18), 0 4px 12px rgba(15,30,41,0.06)',
            zIndex: 60,
          }}
        >
          {/* Profile header card */}
          <div
            className="relative px-4 pt-4 pb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(45,166,126,0.10) 0%, rgba(26,45,58,0.05) 100%)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="relative w-12 h-12 rounded-full overflow-hidden shrink-0"
                style={{
                  background: 'white',
                  boxShadow: '0 0 0 2px rgba(45,166,126,0.4), 0 4px 12px rgba(15,30,41,0.1)',
                }}
              >
                <img src={avatarUrl} alt={user.display_name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.2 }}>
                  {user.display_name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                  {user.job_title ?? ROLE_LABEL[user.role]}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                    style={{
                      background: `${ROLE_COLOR[user.role]}1A`,
                      color: ROLE_COLOR[user.role],
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Shield size={9} />
                    {ROLE_LABEL[user.role]}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 mt-3 pt-2.5 truncate"
              style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem' }}
            >
              <Mail size={11} />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          {/* Menu items */}
          {!showSwitch ? (
            <div className="py-1.5">
              <MenuItem
                icon={<UserIcon size={15} />}
                label="My Profile"
                hint="View your activity"
                onClick={() => { setOpen(false); addToast('Profile view coming soon', 'info'); }}
              />
              <MenuItem
                icon={<Settings size={15} />}
                label="Preferences"
                hint="Notifications & display"
                onClick={() => { setOpen(false); addToast('Preferences saved', 'success'); }}
              />
              <MenuItem
                icon={<UsersIcon size={15} />}
                label="Switch User"
                hint="Demo: try other roles"
                onClick={() => setShowSwitch(true)}
                showChevron
              />
              <MenuItem
                icon={<Shield size={15} />}
                label="Users & Access"
                hint="Manage team"
                onClick={() => { setOpen(false); setPage('users'); }}
              />
              <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <MenuItem
                icon={<HelpCircle size={15} />}
                label="Help & Support"
                onClick={() => { setOpen(false); addToast('Help center opened', 'info'); }}
              />
              <MenuItem
                icon={<LogOut size={15} />}
                label="Sign Out"
                onClick={() => { setOpen(false); addToast('Signed out successfully', 'success'); }}
                danger
              />
            </div>
          ) : (
            <div className="py-1.5">
              <button
                onClick={() => setShowSwitch(false)}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 transition-colors"
                style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                ‹ Back
              </button>
              <div className="px-3 pb-1" style={{ color: 'var(--text-muted)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Switch to
              </div>
              {users.map(u => {
                const isActive = u.id === currentUserId;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u.id);
                      addToast(`Switched to ${u.display_name}`, 'success');
                      setShowSwitch(false);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                    style={{ background: isActive ? 'rgba(45,166,126,0.08)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden shrink-0"
                      style={{ background: 'var(--bg-inset)', boxShadow: isActive ? '0 0 0 2px #2DA67E' : 'none' }}
                    >
                      <img
                        src={getAvatarUrl(u.display_name, u.gender)}
                        alt={u.display_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>
                        {u.display_name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                        {ROLE_LABEL[u.role]}
                      </div>
                    </div>
                    {isActive && <Check size={14} style={{ color: '#2DA67E' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon, label, hint, onClick, danger, showChevron,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  danger?: boolean;
  showChevron?: boolean;
}) {
  const color = danger ? '#DC2626' : 'var(--text-primary)';
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? 'rgba(220,38,38,0.06)' : 'var(--bg-secondary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span
        className="w-7 h-7 rounded-md flex items-center justify-center"
        style={{
          background: danger ? 'rgba(220,38,38,0.08)' : 'rgba(45,166,126,0.08)',
          color: danger ? '#DC2626' : '#2DA67E',
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div style={{ color, fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.2 }}>{label}</div>
        {hint && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 1 }}>{hint}</div>
        )}
      </div>
      {showChevron && <ChevronDown size={12} style={{ color: 'var(--text-muted)', transform: 'rotate(-90deg)' }} />}
    </button>
  );
}
