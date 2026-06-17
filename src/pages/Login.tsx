import { useState, useEffect } from 'react';
import { ArrowRight, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAppStore, users } from '../lib/store';
import { ROLE_LABELS } from '../lib/types';
import Portrait from '../components/ui/Portrait';

// HD imagery of African professionals at work — collaborative teams in
// modern African workplaces — on-brand for Momentum's people-centred,
// Africa-focused advocacy work.
const SLIDES = [
  {
    image: '/login-team.png',
    title: 'Map the people who move policy',
    subtitle: 'Score, classify and engage the stakeholders shaping Africa\'s agenda.',
  },
  {
    image: '/login-pair.png',
    title: 'Turn intelligence into influence',
    subtitle: 'Data-driven decisions for smarter advocacy and partnerships.',
  },
  {
    image: '/login-focus.png',
    title: 'See the whole board, in real time',
    subtitle: 'Track quadrants, risks and engagement gaps as every focal point moves.',
  },
];

// Sheila (analyst), Charles (lead), Ronny (partner), Ivy (admin), Grace (client).
const DEMO_IDS = ['u-001', 'u-002', 'u-003', 'u-005', 'u-006'];

export default function Login() {
  const login = useAppStore(s => s.login);
  const loginAs = useAppStore(s => s.loginAs);
  const addToast = useAppStore(s => s.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A201B 0%, #0C2A22 55%, #0A1F1B 100%)' }}
    >
      {/* Faint full-bleed photo backdrop — the imagery also lives behind everything */}
      {SLIDES.map((s, i) => (
        <div
          key={s.image}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none"
          style={{
            opacity: i === slide ? 0.16 : 0,
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px)',
          }}
        />
      ))}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(110deg, rgba(10,32,27,0.96) 0%, rgba(10,32,27,0.86) 45%, rgba(10,32,27,0.55) 100%)' }}
      />

      {/* Right: Africa showcase — fully framed in the right half with a margin */}
      <div
        className="absolute top-1/2 hidden md:flex items-center justify-center pointer-events-none"
        style={{ right: '2.5vw', transform: 'translateY(-50%)', height: '90vh', width: '46vw' }}
      >
        <img
          src="/login-africa.png"
          alt=""
          aria-hidden
          className="max-h-full max-w-full object-contain"
          style={{ filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.5))' }}
        />
      </div>

      {/* Left: brand + sign-in */}
      <div className="no-scrollbar relative z-10 flex flex-col w-full md:w-[52%] lg:w-[48%] px-6 sm:px-12 lg:px-16 py-8 overflow-y-auto">
        {/* Brand */}
        <div className="mb-auto">
          <span
            className="inline-flex rounded-xl px-3.5 py-2.5"
            style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 6px 20px rgba(0,0,0,0.28)' }}
          >
            <img src="/momentum-logo.png" alt="Momentum Africa Partners" className="h-9 w-auto object-contain block" />
          </span>
          <span className="block mt-3" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.22em' }}>
            STAKEHOLDER INTELLIGENCE TOOL
          </span>
        </div>

        <div className="py-8" style={{ maxWidth: 460 }}>
          {/* Rotating headline */}
          <div key={slide} className="hero-fade-in mb-7">
            <h1
              className="font-display"
              style={{ color: 'white', fontSize: 'clamp(2.1rem, 3.4vw, 2.95rem)', lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: 380 }}
            >
              {SLIDES[slide].title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', marginTop: 12, fontSize: '0.95rem', lineHeight: 1.55 }}>
              {SLIDES[slide].subtitle}
            </p>
          </div>

          <h2 className="font-display" style={{ color: 'white', fontSize: '1.5rem' }}>Welcome back</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginTop: 4 }}>
            Sign in with your organization account to continue.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.55)' }}>Work email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.45)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@momentum.africa"
                  className="w-full rounded-lg outline-none text-body-sm"
                  style={{ padding: '11px 12px 11px 36px', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                />
              </div>
            </div>
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.55)' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.45)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg outline-none text-body-sm"
                  style={{ padding: '11px 44px 11px 36px', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', color: 'white' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1"
                  style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6875rem', fontWeight: 600 }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />} {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-body-sm rounded-lg px-3 py-2" style={{ background: 'rgba(248,113,113,0.12)', color: '#FCA5A5', fontSize: '0.75rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-lg btn-press transition-all"
              style={{ padding: '12px 16px', background: 'var(--gradient-brand)', color: 'white', fontWeight: 600, fontSize: '0.875rem', boxShadow: 'var(--shadow-brand)', opacity: busy ? 0.8 : 1 }}
            >
              {busy ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.14)' }} />
            <span className="text-label" style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)' }}>Or use a demo account</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.14)' }} />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {demoUsers.map(u => (
              <button
                key={u.id}
                onClick={() => quick(u.id)}
                className="flex items-center gap-2 rounded-lg text-left transition-colors"
                style={{ flexBasis: 'calc(50% - 0.25rem)', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <Portrait name={u.display_name} gender={u.gender} portraitUrl={u.portrait_url} size={28} />
                <div className="min-w-0">
                  <div className="truncate" style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{u.display_name.split(' ')[0]}</div>
                  <div className="truncate" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.625rem' }}>{ROLE_LABELS[u.role]}</div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center mt-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.625rem' }}>
            Demo password for all accounts: <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>momentum</span>
          </p>
        </div>

        {/* Footer + slide dots */}
        <div className="mt-auto pt-6 flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === slide ? 26 : 8, height: 8,
                  background: i === slide ? 'var(--brand-primary)' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
          <p className="text-center" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.625rem' }}>
            Protected workspace · routed to your role's view after sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
