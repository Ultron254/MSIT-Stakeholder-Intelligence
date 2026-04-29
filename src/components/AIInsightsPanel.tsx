import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles, Send, TrendingUp, AlertTriangle, Target, Lightbulb,
  RefreshCw, ArrowRight, MessageSquarePlus, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import {
  useAppStore, useStakeholdersWithScores, watchlistSignals, objectives,
} from '../lib/store';
import { QUADRANT_LABELS } from '../lib/types';
import { formatSIS, daysUntil } from '../lib/formatters';
import { getAvatarUrl } from '../lib/avatar';
import { users } from '../lib/store';
import Tooltip from './ui/Tooltip';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  insightCards?: Array<{ label: string; value: string; sub?: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }>;
  timestamp: number;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Top SIS movers this week', prompt: 'Who are the top SIS movers this week?' },
  { icon: AlertTriangle, label: 'Highest-risk stakeholders', prompt: 'Show me the highest-risk stakeholders right now.' },
  { icon: Target, label: 'Power gaps to convert', prompt: 'Which power gaps should I prioritise converting?' },
  { icon: Lightbulb, label: 'Suggest next action', prompt: 'What should I do next on the campaign?' },
];

export default function AIInsightsPanel() {
  const all = useStakeholdersWithScores();
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const currentUserId = useAppStore(s => s.currentUserId);
  const collapsed = useAppStore(s => s.aiPanelCollapsed);
  const toggleCollapse = useAppStore(s => s.toggleAIPanel);
  const user = users.find(u => u.id === currentUserId) ?? users[0];

  const objective = objectives[0];
  const daysLeft = daysUntil(objective.target_date);

  // Computed insights from real data
  const insights = useMemo(() => {
    const scored = all.filter(s => s.latestSnapshot);
    const allies = scored.filter(s => s.latestSnapshot!.quadrant === 'strategic_ally');
    const powerGaps = scored.filter(s => s.latestSnapshot!.quadrant === 'power_gap');
    const monitor = scored.filter(s => s.latestSnapshot!.quadrant === 'monitor_exit');
    const flagged = scored.filter(s => s.redFlags.length > 0);
    const topAlly = [...allies].sort((a, b) => (b.latestSnapshot!.sis_score - a.latestSnapshot!.sis_score))[0];
    const topPowerGap = [...powerGaps].sort((a, b) => (b.latestSnapshot!.sis_score - a.latestSnapshot!.sis_score))[0];
    const criticalAlerts = watchlistSignals.filter(w => !w.is_resolved && w.severity === 'critical');
    return { scored, allies, powerGaps, monitor, flagged, topAlly, topPowerGap, criticalAlerts };
  }, [all]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
    id: 'm-welcome',
    role: 'assistant',
    content: `Hi ${user.display_name.split(' ')[0]}, I've reviewed today's portfolio. ${insights.criticalAlerts.length > 0 ? `${insights.criticalAlerts.length} critical signal${insights.criticalAlerts.length > 1 ? 's need' : ' needs'} attention.` : `Everything looks stable.`} Ask me anything about your stakeholders.`,
    timestamp: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Cmd/Ctrl+\ to toggle AI panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleCollapse]);

  // Generate response from real data — no API needed
  function generateResponse(query: string): { content: string; cards?: ChatMessage['insightCards'] } {
    const q = query.toLowerCase();

    if (q.includes('mover') || q.includes('top') && q.includes('sis')) {
      const top = [...insights.scored]
        .sort((a, b) => (b.latestSnapshot!.sis_score - a.latestSnapshot!.sis_score))
        .slice(0, 3);
      return {
        content: `Your top 3 SIS performers right now are leading the portfolio. ${top[0]?.full_name} continues to anchor the Strategic Allies quadrant.`,
        cards: top.map(s => ({
          label: s.full_name,
          value: formatSIS(s.latestSnapshot!.sis_score),
          sub: s.organization,
          tone: 'good' as const,
        })),
      };
    }

    if (q.includes('risk') || q.includes('flag') || q.includes('alert')) {
      const top = insights.flagged
        .sort((a, b) => b.redFlags.length - a.redFlags.length)
        .slice(0, 3);
      return {
        content: top.length > 0
          ? `${insights.flagged.length} stakeholders are flagged. The highest concentration of red flags is below — consider opening engagements within 14 days.`
          : `No red flags right now. Stay vigilant — recommend a weekly sweep of the Watchlist.`,
        cards: top.map(s => ({
          label: s.full_name,
          value: `${s.redFlags.length} flag${s.redFlags.length > 1 ? 's' : ''}`,
          sub: s.redFlags[0]?.message ?? '',
          tone: 'bad' as const,
        })),
      };
    }

    if (q.includes('power gap') || (q.includes('convert'))) {
      const top = [...insights.powerGaps]
        .sort((a, b) => (b.latestSnapshot!.sis_score - a.latestSnapshot!.sis_score))
        .slice(0, 3);
      return {
        content: `These ${insights.powerGaps.length} power-gap stakeholders have high influence but low alignment. Convert them through structured 1:1s focused on shared policy outcomes.`,
        cards: top.map(s => ({
          label: s.full_name,
          value: formatSIS(s.latestSnapshot!.sis_score),
          sub: s.organization,
          tone: 'warn' as const,
        })),
      };
    }

    if (q.includes('next') || q.includes('action') || q.includes('recommend') || q.includes('suggest') || q.includes('do')) {
      const recommended: string[] = [];
      if (insights.criticalAlerts.length > 0) {
        recommended.push(`Resolve ${insights.criticalAlerts.length} critical alert${insights.criticalAlerts.length > 1 ? 's' : ''} on the Watchlist.`);
      }
      if (insights.topPowerGap) {
        recommended.push(`Schedule a 1:1 with ${insights.topPowerGap.full_name} (${insights.topPowerGap.organization}) — your highest-leverage power gap.`);
      }
      if (daysLeft < 90) {
        recommended.push(`Campaign target is ${daysLeft} days away. Lock approval pipeline for tier-1 amendments this week.`);
      } else {
        recommended.push(`Lock weekly engagement plan for the next 14 days — focus on ${insights.allies.length} Strategic Allies.`);
      }
      return {
        content: `Based on current portfolio state, here are your three highest-impact next moves:\n\n${recommended.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
      };
    }

    if (q.includes('ally') || q.includes('allies') || q.includes('champion')) {
      return {
        content: `You have ${insights.allies.length} Strategic Allies and ${insights.scored.filter(s => s.latestSnapshot!.quadrant === 'hidden_champion').length} Hidden Champions. ${insights.topAlly ? `${insights.topAlly.full_name} is your strongest at SIS ${formatSIS(insights.topAlly.latestSnapshot!.sis_score)}.` : ''} Recommend a quarterly retention check-in with your top 5.`,
      };
    }

    if (q.includes('campaign') || q.includes('progress') || q.includes('day')) {
      const pct = Math.round(((365 - daysLeft) / 365) * 100);
      return {
        content: `The ${objective.name} campaign is ${pct}% through its window with ${daysLeft} days remaining. Portfolio average SIS is ${formatSIS(insights.scored.reduce((sum, s) => sum + s.latestSnapshot!.sis_score, 0) / Math.max(1, insights.scored.length))}, with ${insights.allies.length} confirmed allies and ${insights.flagged.length} stakeholders showing risk indicators.`,
      };
    }

    if (q.includes('hello') || q.includes('hi ') || q === 'hi' || q.includes('hey')) {
      return {
        content: `Hi! I have full context on your ${insights.scored.length} scored stakeholders. Ask about top movers, risks, power gaps, the campaign timeline, or what you should do next.`,
      };
    }

    // Default: smart fallback summary
    return {
      content: `I scanned the portfolio for "${query}". Here's the current snapshot — try one of the quick prompts below for a deeper read, or ask about a specific quadrant, sector, or stakeholder.`,
      cards: [
        { label: 'Strategic Allies', value: String(insights.allies.length), tone: 'good' as const },
        { label: 'Power Gaps', value: String(insights.powerGaps.length), tone: 'warn' as const },
        { label: 'Active Risks', value: String(insights.flagged.length), tone: 'bad' as const },
      ],
    };
  }

  function send(text: string) {
    // Sanitize: trim, cap length to prevent XSS-via-render edge cases and
    // runaway message bubbles. React already escapes by default, but we cap
    // input to a reasonable size for chat UX.
    const trimmed = text.trim().slice(0, 500);
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate thinking delay
    setTimeout(() => {
      const { content, cards } = generateResponse(trimmed);
      const assistantMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content,
        insightCards: cards,
        timestamp: Date.now(),
      };
      setMessages(m => [...m, assistantMsg]);
      setIsThinking(false);
    }, 700 + Math.random() * 600);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clearChat() {
    setMessages([{
      id: 'm-welcome-2',
      role: 'assistant',
      content: `Cleared. What would you like to explore?`,
      timestamp: Date.now(),
    }]);
  }

  return (
    <aside
      className="ai-panel rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
        height: 'calc(100vh - 7.5rem)',
        position: 'sticky',
        top: '5rem',
        width: collapsed ? 56 : '100%',
      }}
    >
      {collapsed ? (
        <CollapsedRail
          onExpand={toggleCollapse}
          alliesCount={insights.allies.length}
          risksCount={insights.flagged.length}
          daysLeft={daysLeft}
          newMessageCount={messages.filter(m => m.role === 'assistant').length - 1}
        />
      ) : (
      <>
      {/* Header */}
      <div
        className="relative px-4 py-3 overflow-hidden shrink-0"
        style={{
          background: 'linear-gradient(135deg, #0F1E29 0%, #1A2D3A 60%, #1F4D45 100%)',
          borderBottom: '1px solid rgba(45,166,126,0.25)',
        }}
      >
        <div className="hero-shine" />
        <div className="relative flex items-center gap-3">
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2DA67E 0%, #5BC09D 100%)',
              boxShadow: '0 4px 12px rgba(45,166,126,0.4)',
            }}
          >
            <Sparkles size={18} style={{ color: 'white' }} />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{
                background: '#4ADE80',
                boxShadow: '0 0 0 1.5px #1A2D3A',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Momentum AI
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[0.5625rem] font-bold tracking-wider"
                style={{
                  background: 'rgba(74,222,128,0.18)',
                  color: '#86EFAC',
                  border: '1px solid rgba(74,222,128,0.3)',
                }}
              >
                BETA
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6875rem', marginTop: 1 }}>
              Always-on intelligence co-pilot
            </div>
          </div>
          <Tooltip content="New conversation" side="bottom">
          <button
            onClick={clearChat}
            aria-label="New conversation"
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <RefreshCw size={13} />
          </button>
          </Tooltip>
          <Tooltip content="Collapse panel" shortcut="⌘\\" side="bottom">
          <button
            onClick={toggleCollapse}
            aria-label="Collapse AI panel"
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <PanelRightClose size={13} />
          </button>
          </Tooltip>
        </div>
      </div>

      {/* Auto-insights strip */}
      <div className="px-3 pt-3 pb-2 grid grid-cols-3 gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <InsightStat label="Allies" value={insights.allies.length} tone="good" />
        <InsightStat label="Risks" value={insights.flagged.length} tone={insights.flagged.length > 0 ? 'bad' : 'neutral'} />
        <InsightStat label={`Days left`} value={daysLeft} tone={daysLeft < 90 ? 'warn' : 'neutral'} />
      </div>

      {/* Chat scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 ai-chat-scroll">
        <div className="space-y-3">
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} userAvatar={getAvatarUrl(user.display_name, user.gender)} onCardClick={(label) => {
              const match = all.find(s => s.full_name === label);
              if (match) setSelectedStakeholder(match.id);
            }} />
          ))}
          {isThinking && <ThinkingIndicator />}
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && !isThinking && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  onClick={() => send(p.prompt)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-150 hover:-translate-y-px"
                  style={{
                    background: 'rgba(45,166,126,0.06)',
                    border: '1px solid rgba(45,166,126,0.18)',
                    color: '#1F7A5C',
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,166,126,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(45,166,126,0.06)'; }}
                >
                  <Icon size={11} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 shrink-0"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all duration-150"
          style={{
            background: 'var(--bg-elevated)',
            border: `1px solid ${input ? 'rgba(45,166,126,0.4)' : 'var(--border-default)'}`,
            boxShadow: input ? '0 0 0 3px rgba(45,166,126,0.08)' : 'none',
          }}
        >
          <MessageSquarePlus size={15} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about stakeholders, risks, next steps…"
            rows={1}
            maxLength={500}
            spellCheck={true}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none resize-none text-body-sm"
            style={{
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              maxHeight: 100,
              minHeight: 18,
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #2DA67E 0%, #228866 100%)' : 'var(--bg-inset)',
              color: input.trim() ? 'white' : 'var(--text-muted)',
              boxShadow: input.trim() ? '0 2px 8px rgba(45,166,126,0.3)' : 'none',
              opacity: isThinking ? 0.5 : 1,
              cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={13} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1" style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>
          <span>Insights are computed from your live portfolio</span>
          <span className="hidden md:inline">⏎ to send · ⇧⏎ for newline</span>
        </div>
      </form>
      </>
      )}
    </aside>
  );
}

function CollapsedRail({
  onExpand,
  alliesCount,
  risksCount,
  daysLeft,
  newMessageCount,
}: {
  onExpand: () => void;
  alliesCount: number;
  risksCount: number;
  daysLeft: number;
  newMessageCount: number;
}) {
  return (
    <div
      className="h-full flex flex-col items-center py-3"
      style={{
        background: 'linear-gradient(180deg, #0F1E29 0%, #1A2D3A 60%, #1F4D45 100%)',
      }}
    >
      {/* Expand button */}
      <Tooltip content="Expand AI Insights" shortcut="⌘\\" side="left">
        <button
          onClick={onExpand}
          aria-label="Expand AI panel"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #2DA67E 0%, #5BC09D 100%)',
            boxShadow: '0 4px 12px rgba(45,166,126,0.4)',
          }}
        >
          <Sparkles size={16} style={{ color: 'white' }} />
        </button>
      </Tooltip>

      <div
        className="my-3 w-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      />

      {/* Vertical stats */}
      <div className="flex flex-col gap-2 items-center">
        <Tooltip content={`${alliesCount} Strategic Allies`} side="left">
          <div className="flex flex-col items-center cursor-help">
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#86EFAC', fontVariantNumeric: 'tabular-nums' }}>
              {alliesCount}
            </span>
            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ally
            </span>
          </div>
        </Tooltip>
        <Tooltip content={`${risksCount} stakeholders flagged`} side="left">
          <div className="flex flex-col items-center cursor-help">
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: risksCount > 0 ? '#FCA5A5' : 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
              {risksCount}
            </span>
            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Risk
            </span>
          </div>
        </Tooltip>
        <Tooltip content={`${daysLeft} days until campaign target`} side="left">
          <div className="flex flex-col items-center cursor-help">
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: daysLeft < 90 ? '#FCD34D' : 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
              {daysLeft}
            </span>
            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Days
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New messages indicator */}
      {newMessageCount > 0 && (
        <Tooltip content={`${newMessageCount} insight${newMessageCount > 1 ? 's' : ''} in conversation`} side="left">
          <button
            onClick={onExpand}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
            aria-label={`${newMessageCount} insights`}
          >
            <PanelRightOpen size={14} />
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
              style={{
                background: '#2DA67E',
                color: 'white',
                fontSize: '0.5625rem',
                fontWeight: 700,
                boxShadow: '0 0 0 1.5px #1A2D3A',
              }}
            >
              {newMessageCount}
            </span>
          </button>
        </Tooltip>
      )}

      {/* Bottom expand button */}
      <Tooltip content="Open AI Insights" side="left">
        <button
          onClick={onExpand}
          aria-label="Expand AI panel"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{
            background: 'rgba(45,166,126,0.15)',
            color: '#86EFAC',
            border: '1px solid rgba(45,166,126,0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,166,126,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(45,166,126,0.15)'; }}
        >
          <PanelRightOpen size={14} />
        </button>
      </Tooltip>
    </div>
  );
}

function InsightStat({ label, value, tone }: { label: string; value: number; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colors: Record<string, { color: string; bg: string }> = {
    good: { color: '#1F7A5C', bg: 'rgba(45,166,126,0.08)' },
    warn: { color: '#B45309', bg: 'rgba(251,191,36,0.10)' },
    bad: { color: '#B91C1C', bg: 'rgba(220,38,38,0.08)' },
    neutral: { color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
  };
  const c = colors[tone];
  return (
    <div
      className="rounded-lg px-2.5 py-1.5"
      style={{ background: c.bg }}
    >
      <div style={{ color: c.color, fontSize: '1rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', marginTop: 2, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

function Message({ msg, userAvatar, onCardClick }: { msg: ChatMessage; userAvatar: string; onCardClick: (label: string) => void }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start gap-2 justify-end ai-msg-in">
        <div
          className="rounded-2xl rounded-tr-md px-3 py-2 max-w-[85%]"
          style={{
            background: 'linear-gradient(135deg, #2DA67E 0%, #228866 100%)',
            color: 'white',
            fontSize: '0.8125rem',
            lineHeight: 1.45,
            boxShadow: '0 2px 8px rgba(45,166,126,0.25)',
          }}
        >
          {msg.content}
        </div>
        <img
          src={userAvatar}
          alt=""
          className="w-7 h-7 rounded-full shrink-0"
          style={{ background: 'var(--bg-inset)' }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 ai-msg-in">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'linear-gradient(135deg, #2DA67E 0%, #5BC09D 100%)',
          boxShadow: '0 2px 6px rgba(45,166,126,0.3)',
        }}
      >
        <Sparkles size={13} style={{ color: 'white' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-md px-3 py-2"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            border: '1px solid var(--border-subtle)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {msg.content}
        </div>
        {msg.insightCards && msg.insightCards.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {msg.insightCards.map((card, i) => (
              <button
                key={i}
                onClick={() => onCardClick(card.label)}
                className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-150 hover:-translate-y-px"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(45,166,126,0.4)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,30,41,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex-1 min-w-0">
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 }} className="truncate">
                    {card.label}
                  </div>
                  {card.sub && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 1 }} className="truncate">
                      {card.sub}
                    </div>
                  )}
                </div>
                <span
                  className="font-mono shrink-0"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color:
                      card.tone === 'good' ? '#1F7A5C' :
                      card.tone === 'warn' ? '#B45309' :
                      card.tone === 'bad' ? '#B91C1C' : 'var(--text-secondary)',
                  }}
                >
                  {card.value}
                </span>
                <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-2 ai-msg-in">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'linear-gradient(135deg, #2DA67E 0%, #5BC09D 100%)',
        }}
      >
        <Sparkles size={13} style={{ color: 'white' }} />
      </div>
      <div
        className="rounded-2xl rounded-tl-md px-3 py-2.5 inline-flex items-center gap-1"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="ai-typing-dot" />
        <span className="ai-typing-dot" style={{ animationDelay: '0.15s' }} />
        <span className="ai-typing-dot" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}

// Avoid unused-import warnings (QUADRANT_LABELS reserved for future use)
void QUADRANT_LABELS;
