import { useState, useEffect } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { useAppStore, users } from '../lib/store';
import { ROLE_LABELS } from '../lib/types';
import Portrait from '../components/ui/Portrait';

// HD imagery of African / Black professionals (women and men) in modern
// workplaces — on-brand for Momentum's people-centred, Africa-focused work.
const SLIDES = [
  {
    image: 'https://images.pexels.com/photos/1181605/pexels-photo-1181605.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',
    title: 'Map the people who move policy',
    subtitle: 'Score, classify and engage the stakeholders shaping Africa\'s agenda.',
  },
  {
    image: 'https://images.pexels.com/photos/7581111/pexels-photo-7581111.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',
    title: 'Turn intelligence into influence',
    subtitle: 'Data-driven decisions for smarter advocacy and partnerships.',
  },
  {
    image: 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',
    title: 'See the whole board, in real time',
    subtitle: 'Track quadrants, risks and engagement gaps as every campaign moves.',
  },
];

const DEMO_IDS = ['u-001', 'u-002', 'u-003', 'u-006'];

export default function Login() {
  const login = useAppStore(s => s.login);
  const loginAs = useAppStore(s => s.loginAs);
  const addToast = useAppStore(s => s.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    setTimeout(() => {
      const ok = login(email, password);
      setBusy(false);
      if (!ok) setError('Those credentials did not match an active account. Try a demo account below.');
    }, 500);
  };

  const quick = (id: string) => {
    const u = users.find(x => x.id === id);
    loginAs(id);
    if (u) addToast(`Signed in as ${u.display_name}`, 'success');
  };

  const demoUsers = DEMO_IDS.map(id => users.find(u => u.id === id)).filter(Boolean) as typeof users;

  return (
    <div className="fixed inset-0 flex overflow-hidden" style={{ background: 'var(--brand-navy-dark)' }}>
      {/* Background slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: i === slide ? 1 : 0,
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}
      {/* Brand-tinted overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(115deg, rgba(15,30,41,0.92) 0%, rgba(15,30,41,0.72) 42%, rgba(15,30,41,0.45) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 78% 38%, rgba(45,166,126,0.28), transparent 45%)' }}
      />

      {/* Top-left brand label */}
      <div className="absolute top-7 left-8 z-10 flex items-center gap-2.5">
        <img src="/momentum-mark.svg" alt="Momentum" className="w-7 h-7 object-contain" />
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.22em' }}>
          STAKEHOLDER INTELLIGENCE TOOL
        </span>
      </div>

      {/* Left: rotating tagline */}
      <div className="relative z-10 hidden md:flex flex-col justify-end flex-1 p-12 lg:p-16">
        <div key={slide} className="hero-fade-in max-w-xl">
          <h1
            className="font-display"
            style={{ color: 'white', fontSize: 'clamp(2rem, 3.4vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}
          >
            {SLIDES[slide].title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', marginTop: 14, fontSize: '1rem', lineHeight: 1.6, maxWidth: 460 }}>
            {SLIDES[slide].subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === slide ? 28 : 8, height: 8,
                background: i === slide ? 'var(--brand-primary)' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Right: auth card */}
      <div className="relative z-10 flex items-center justify-center w-full md:w-auto md:pr-12 lg:pr-16 px-5">
        <div
          className="w-full"
          style={{
            maxWidth: 420,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 24,
            padding: 8,
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}
        >
          {/* Org header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.8125rem', letterSpacing: '0.02em' }}>M</span>
              </div>
              <div className="leading-tight">
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>Momentum Intel</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6875rem' }}>Stakeholder Intelligence</div>
              </div>
            </div>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
            >
              <ShieldCheck size={14} />
            </div>
          </div>

          {/* White inner panel */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 18, padding: '24px 22px' }}>
            <h2 className="text-display-md" style={{ color: 'var(--text-primary)', fontSize: '1.6rem' }}>Welcome back</h2>
            <p className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Sign in with your organization account to continue.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Work email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@momentum.africa"
                    className="w-full rounded-lg outline-none text-body-sm"
                    style={{ padding: '10px 12px 10px 36px', border: '1px solid var(--border-default)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: 6 }}>Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg outline-none text-body-sm"
                    style={{ padding: '10px 12px 10px 36px', border: '1px solid var(--border-default)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {error && (
                <div className="text-body-sm rounded-lg px-3 py-2" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--status-danger)', fontSize: '0.75rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 rounded-lg btn-press transition-all"
                style={{ padding: '11px 16px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 600, fontSize: '0.875rem', boxShadow: 'var(--shadow-brand)', opacity: busy ? 0.8 : 1 }}
              >
                {busy ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
              <span className="text-label" style={{ fontSize: '0.625rem' }}>Or use a demo account</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => quick(u.id)}
                  className="flex items-center gap-2 rounded-lg text-left transition-colors"
                  style={{ padding: '8px 10px', border: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                >
                  <Portrait name={u.display_name} gender={u.gender} portraitUrl={u.portrait_url} size={28} />
                  <div className="min-w-0">
                    <div className="truncate" style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{u.display_name.split(' ')[0]}</div>
                    <div className="truncate" style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>{ROLE_LABELS[u.role]}</div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center mt-4" style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>
              Demo password for all accounts: <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>momentum</span>
            </p>
          </div>

          <p className="text-center px-4 py-3" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.625rem' }}>
            Protected workspace. You will be routed to your role's view after sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
