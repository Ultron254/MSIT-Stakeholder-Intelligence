import { useState, useEffect } from 'react';
import { X, UserCog } from 'lucide-react';
import { useAppStore } from '../lib/store';
import type { User } from '../lib/types';

const ROLES: User['role'][] = ['analyst', 'country_lead', 'approver', 'viewer', 'admin'];

export default function EditUserModal() {
  const editUserModalOpen = useAppStore(s => s.editUserModalOpen);
  const editUserModalId = useAppStore(s => s.editUserModalId);
  const closeEditUser = useAppStore(s => s.closeEditUser);
  const storeUsers = useAppStore(s => s.storeUsers);
  const updateUser = useAppStore(s => s.updateUser);
  const addUser = useAppStore(s => s.addUser);
  const addToast = useAppStore(s => s.addToast);

  const existingUser = editUserModalId ? storeUsers.find(u => u.id === editUserModalId) : null;
  const isCreate = !editUserModalId;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<User['role']>('viewer');
  const [isActive, setIsActive] = useState(true);
  const [countryAccess, setCountryAccess] = useState<string[]>(['c-001']);

  useEffect(() => {
    if (existingUser) {
      setDisplayName(existingUser.display_name);
      setEmail(existingUser.email);
      setJobTitle(existingUser.job_title ?? '');
      setRole(existingUser.role);
      setIsActive(existingUser.is_active);
      setCountryAccess(existingUser.country_access);
    } else {
      setDisplayName('');
      setEmail('');
      setJobTitle('');
      setRole('viewer');
      setIsActive(true);
      setCountryAccess(['c-001']);
    }
  }, [existingUser, editUserModalOpen]);

  if (!editUserModalOpen) return null;

  const handleSubmit = () => {
    if (!displayName.trim() || !email.trim()) {
      addToast('Please fill in name and email', 'error');
      return;
    }

    if (isCreate) {
      const newUser: User = {
        id: `u-new-${Date.now()}`,
        email: email.trim(),
        display_name: displayName.trim(),
        role,
        country_access: countryAccess,
        is_active: isActive,
        job_title: jobTitle.trim() || undefined,
      };
      addUser(newUser);
      addToast('User created successfully', 'success');
    } else if (editUserModalId) {
      updateUser(editUserModalId, {
        display_name: displayName.trim(),
        email: email.trim(),
        role,
        country_access: countryAccess,
        is_active: isActive,
        job_title: jobTitle.trim() || undefined,
      });
      addToast('User updated successfully', 'success');
    }
    closeEditUser();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 modal-backdrop" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={closeEditUser} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeEditUser}>
        <div
          className="modal-content w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <UserCog size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>{isCreate ? 'Add User' : 'Edit User'}</h2>
            </div>
            <button onClick={closeEditUser} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-label mb-1.5 block">Display Name <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Email <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Job Title</label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as User['role'])}
                className="w-full rounded-lg px-3 py-2 text-body-sm outline-none capitalize"
                style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <button onClick={closeEditUser}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            >Cancel</button>
            <button onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--text-primary)', color: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
            >{isCreate ? 'Create User' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
