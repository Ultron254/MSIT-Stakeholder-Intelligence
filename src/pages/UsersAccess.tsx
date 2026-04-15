import { users } from '../lib/store';
import { Card } from '../components/ui/Badges';
import { Shield, Eye, Edit3, Settings } from 'lucide-react';

export default function UsersAccess() {
  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Settings size={14} />;
      case 'country_lead': case 'approver': return <Shield size={14} />;
      case 'analyst': return <Edit3 size={14} />;
      default: return <Eye size={14} />;
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return { bg: '#FEE2E2', color: '#991B1B' };
      case 'country_lead': return { bg: '#E0E7FF', color: '#3730A3' };
      case 'approver': return { bg: '#FDF6E3', color: '#9A7611' };
      case 'analyst': return { bg: 'var(--quadrant-ally-bg)', color: 'var(--quadrant-ally-text)' };
      default: return { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Users & Access</h1>
        <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Manage team members and role-based access control
        </p>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['analyst', 'country_lead', 'approver', 'viewer', 'admin'].map(role => {
          const count = users.filter(u => u.role === role).length;
          const rc = roleColor(role);
          return (
            <Card key={role} className="!p-4">
              <div className="text-label mb-1">{role.replace('_', ' ')}</div>
              <div className="flex items-center gap-2">
                <span className="text-metric-sm" style={{ color: 'var(--text-primary)' }}>{count}</span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize"
                  style={{ background: rc.bg, color: rc.color }}
                >
                  {roleIcon(role)} {role.replace('_', ' ')}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Users table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th className="text-label text-left px-4 py-3">User</th>
              <th className="text-label text-left px-4 py-3">Email</th>
              <th className="text-label text-left px-4 py-3">Role</th>
              <th className="text-label text-left px-4 py-3">Country Access</th>
              <th className="text-label text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => {
              const rc = roleColor(user.role);
              return (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: i % 2 === 1 ? 'var(--bg-primary)' : 'transparent',
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)' }}
                      >
                        {user.display_name.split(' ').map(w => w[0]).join('')}
                      </div>
                      <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{user.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize"
                      style={{ background: rc.bg, color: rc.color }}
                    >
                      {roleIcon(user.role)} {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    {user.country_access.includes('c-001') ? 'Kenya' : 'All'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: user.is_active ? 'var(--status-success)' : 'var(--text-muted)' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
