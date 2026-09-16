import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Mail, Phone, Lock, LogOut, Save } from 'lucide-react';
import {
  Card, PageHeader, PrimaryButton, GhostButton, Field, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { pushToast, ToastViewport } = useToast();

  const adminEmail = localStorage.getItem('nobelle_admin_email') || 'admin@nobelle.com';
  const [profile, setProfile] = useState({
    name: adminEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    email: adminEmail,
    phone: localStorage.getItem('nobelle_admin_phone') || '',
    image: localStorage.getItem('nobelle_admin_image') || '',
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [confirmLogout, setConfirmLogout] = useState(false);

  const saveProfile = () => {
    localStorage.setItem('nobelle_admin_name', profile.name);
    localStorage.setItem('nobelle_admin_phone', profile.phone);
    pushToast('Profile saved.');
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile((p) => ({ ...p, image: url }));
      localStorage.setItem('nobelle_admin_image', url);
    }
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (pw.next.length < 8) {
      pushToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (pw.next !== pw.confirm) {
      pushToast('New passwords do not match.', 'error');
      return;
    }
    pushToast('Password update requires a connected backend.', 'info');
    setPw({ current: '', next: '', confirm: '' });
  };

  const initials = (profile.name || '?')
    .split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader title="Admin Profile" subtitle="Your account details" breadcrumb={['System']} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
        <Card className="flex flex-col items-center text-center">
          <div className="relative">
            {profile.image ? (
              <img src={profile.image} alt="Admin avatar" className="w-20 h-20 rounded-full object-cover" style={{ border: '2px solid #A94A5A' }} />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #A94A5A, #8E3D4C)' }}
              >
                {initials}
              </div>
            )}
          </div>
          <h2 className="font-serif text-base font-bold mt-4" style={{ color: 'var(--admin-text)' }}>{profile.name}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>{profile.email}</p>

          <label className="mt-4 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
            <input type="file" accept="image/*" className="sr-only" onChange={handleImage} />
            <UserCircle size={13} /> Change Photo
          </label>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <h2 className="font-serif text-sm font-bold mb-4" style={{ color: 'var(--admin-text)' }}>Profile Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" htmlFor="pr-name">
              <input id="pr-name" type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Email" htmlFor="pr-email">
              <input id="pr-email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Phone" htmlFor="pr-phone">
              <input id="pr-phone" type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+234 ..." className={inputClass} style={inputStyle} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <PrimaryButton onClick={saveProfile}><Save size={13} /> Save Profile</PrimaryButton>
            <GhostButton onClick={() => setConfirmLogout(true)}>
              <LogOut size={13} /> Logout
            </GhostButton>
          </div>
        </Card>
      </div>

      {/* Password */}
      <Card>
        <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
          <Lock size={14} style={{ color: '#A94A5A' }} /> Change Password
        </h2>
        <form onSubmit={changePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <Field label="Current Password" htmlFor="pp-0">
            <input id="pp-0" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="New Password" htmlFor="pp-1" hint="Minimum 8 characters.">
            <input id="pp-1" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Confirm Password" htmlFor="pp-2">
            <input id="pp-2" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputClass} style={inputStyle} />
          </Field>
          <div className="sm:col-span-3">
            <PrimaryButton type="submit">Update Password</PrimaryButton>
          </div>
        </form>
      </Card>

      {confirmLogout && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setConfirmLogout(false)} />
          <div
            className="relative max-w-sm w-full rounded-2xl p-6 dropdown-enter"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="font-serif text-base font-bold" style={{ color: 'var(--admin-text)' }}>Log out?</h3>
            <p className="text-xs mt-1.5" style={{ color: 'var(--admin-text-muted)' }}>
              You will need to sign in again to access the dashboard.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <GhostButton onClick={() => setConfirmLogout(false)}>Stay</GhostButton>
              <button
                onClick={() => { logout(); navigate('/admin/login'); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#A94A5A' }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
