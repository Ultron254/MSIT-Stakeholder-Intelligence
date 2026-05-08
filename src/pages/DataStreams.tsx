import { useState, useMemo } from 'react';
import {
  Search, Filter, ExternalLink, TrendingUp, TrendingDown, Minus,
  Tv, Radio, Newspaper, Share2, Clock, Tag, ChevronDown, ChevronUp,
  AlertCircle, Bookmark, BookmarkCheck, Eye,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Card } from '../components/ui/Badges';
import Portrait from '../components/ui/Portrait';
import { format, subDays, subHours, subMinutes } from 'date-fns';
import { NOW } from '../lib/constants';

type StreamCategory = 'all' | 'tv' | 'radio' | 'print' | 'social';
type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
type Relevance = 'high' | 'medium' | 'low';

interface StreamSource {
  id: string;
  name: string;
  shortName: string;
  category: 'tv' | 'radio' | 'print' | 'social';
  color: string;
  iconBg: string;
}

interface StreamItem {
  id: string;
  sourceId: string;
  title: string;
  excerpt: string;
  sentiment: Sentiment;
  relevance: Relevance;
  stakeholderIds: string[];
  tags: string[];
  publishedAt: Date;
  url: string;
  isBookmarked: boolean;
  viewCount: number;
}

const SOURCES: StreamSource[] = [
  { id: 'citizen-tv', name: 'Citizen TV', shortName: 'Citizen', category: 'tv', color: '#E53935', iconBg: '#FDECEA' },
  { id: 'tv47', name: 'TV 47', shortName: 'TV 47', category: 'tv', color: '#FF6F00', iconBg: '#FFF3E0' },
  { id: 'ntv', name: 'NTV Kenya', shortName: 'NTV', category: 'tv', color: '#1565C0', iconBg: '#E3F2FD' },
  { id: 'k24', name: 'K24 TV', shortName: 'K24', category: 'tv', color: '#2E7D32', iconBg: '#E8F5E9' },
  { id: 'ktn', name: 'KTN News', shortName: 'KTN', category: 'tv', color: '#6A1B9A', iconBg: '#F3E5F5' },
  { id: 'kbc', name: 'KBC Channel 1', shortName: 'KBC', category: 'tv', color: '#00695C', iconBg: '#E0F2F1' },

  { id: 'radio-citizen', name: 'Radio Citizen', shortName: 'R. Citizen', category: 'radio', color: '#D84315', iconBg: '#FBE9E7' },
  { id: 'capital-fm', name: 'Capital FM', shortName: 'Capital', category: 'radio', color: '#283593', iconBg: '#E8EAF6' },
  { id: 'classic-105', name: 'Classic 105', shortName: 'Classic', category: 'radio', color: '#4E342E', iconBg: '#EFEBE9' },
  { id: 'ghetto-radio', name: 'Ghetto Radio', shortName: 'Ghetto', category: 'radio', color: '#F57F17', iconBg: '#FFFDE7' },
  { id: 'radio-jambo', name: 'Radio Jambo', shortName: 'Jambo', category: 'radio', color: '#C62828', iconBg: '#FFEBEE' },
  { id: 'spice-fm', name: 'Spice FM', shortName: 'Spice', category: 'radio', color: '#AD1457', iconBg: '#FCE4EC' },

  { id: 'nation', name: 'Daily Nation', shortName: 'Nation', category: 'print', color: '#1B5E20', iconBg: '#E8F5E9' },
  { id: 'east-african', name: 'The East African', shortName: 'East African', category: 'print', color: '#0D47A1', iconBg: '#E3F2FD' },
  { id: 'taifa-leo', name: 'Taifa Leo', shortName: 'Taifa Leo', category: 'print', color: '#E65100', iconBg: '#FFF3E0' },
  { id: 'business-daily', name: 'Business Daily', shortName: 'B. Daily', category: 'print', color: '#1A237E', iconBg: '#E8EAF6' },
  { id: 'peoples-daily', name: "People's Daily", shortName: 'PD', category: 'print', color: '#B71C1C', iconBg: '#FFEBEE' },
  { id: 'mygov', name: 'MyGov Kenya', shortName: 'MyGov', category: 'print', color: '#004D40', iconBg: '#E0F2F1' },
  { id: 'standard', name: 'The Standard', shortName: 'Standard', category: 'print', color: '#311B92', iconBg: '#EDE7F6' },

  { id: 'twitter', name: 'Twitter / X', shortName: 'X', category: 'social', color: '#000000', iconBg: '#F5F5F5' },
  { id: 'facebook', name: 'Facebook', shortName: 'Facebook', category: 'social', color: '#1877F2', iconBg: '#E7F0FD' },
  { id: 'tiktok', name: 'TikTok', shortName: 'TikTok', category: 'social', color: '#010101', iconBg: '#F0F0F0' },
  { id: 'linkedin', name: 'LinkedIn', shortName: 'LinkedIn', category: 'social', color: '#0A66C2', iconBg: '#E8F1FA' },
];

const CATEGORY_META: Record<StreamCategory, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All Streams', icon: Filter, color: 'var(--text-primary)' },
  tv: { label: 'Television', icon: Tv, color: '#E53935' },
  radio: { label: 'Radio', icon: Radio, color: '#283593' },
  print: { label: 'Print Media', icon: Newspaper, color: '#1B5E20' },
  social: { label: 'Social Media', icon: Share2, color: '#1877F2' },
};

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  positive: { label: 'Positive', color: '#1B7A43', bg: '#E8F5E9', icon: TrendingUp },
  negative: { label: 'Negative', color: '#C62828', bg: '#FFEBEE', icon: TrendingDown },
  neutral: { label: 'Neutral', color: '#5D6868', bg: '#F5F5F5', icon: Minus },
  mixed: { label: 'Mixed', color: '#E65100', bg: '#FFF3E0', icon: AlertCircle },
};

function generateStreamItems(): StreamItem[] {
  const stakeholderIds = [
    's-001', 's-003', 's-004', 's-005', 's-006', 's-007', 's-013',
    's-014', 's-015', 's-016', 's-028', 's-029',
  ];
  const headlines: Array<{ title: string; excerpt: string; sentiment: Sentiment; relevance: Relevance; tags: string[]; sIds: string[] }> = [
    { title: 'Energy Committee Approves Renewable Energy Amendment Bill for Second Reading', excerpt: 'The National Assembly\'s Energy Committee, chaired by Hon. Fatuma Hassan, has unanimously approved the Renewable Energy Amendment Bill 2026 for second reading. The committee cited overwhelming evidence that Kenya\'s transition to 100% renewable energy by 2030 is both feasible and economically beneficial.', sentiment: 'positive', relevance: 'high', tags: ['Energy Bill', 'Committee Vote', 'Parliament'], sIds: ['s-003', 's-013'] },
    { title: 'Kenya Pipeline CEO Warns of Job Losses from Energy Transition', excerpt: 'Gen. Peter Mburu (Rtd), CEO of Kenya Pipeline, stated during a press conference that rapid transition to renewable energy could result in 15,000 job losses in the petroleum sector. He called for a more gradual transition timeline and adequate worker retraining programs.', sentiment: 'negative', relevance: 'high', tags: ['Energy Transition', 'Employment', 'Opposition'], sIds: ['s-015'] },
    { title: 'UNDP Pledges $50M Support for Kenya\'s Green Energy Goals', excerpt: 'Dr. Rebecca Muthoni, UNDP Kenya\'s Program Director, announced a $50 million support package for Kenya\'s renewable energy transition. The package includes technical assistance, capacity building, and direct project financing for community-level solar and wind installations.', sentiment: 'positive', relevance: 'high', tags: ['UNDP', 'Funding', 'International Support'], sIds: ['s-007'] },
    { title: 'Petroleum Refineries Association Lobbies Against Bill Provisions', excerpt: 'Stephen Letoo, CEO of Kenya Petroleum Refineries, led an industry delegation to Parliament to oppose key provisions of the Energy Bill. The delegation argues that mandatory renewable energy targets will increase electricity costs for consumers by 30% in the short term.', sentiment: 'negative', relevance: 'high', tags: ['Opposition', 'Industry Lobby', 'Cost Concerns'], sIds: ['s-016'] },
    { title: 'Renewable Energy Association Reports Record Solar Installations', excerpt: 'Michael Odhiambo, CEO of Kenya Renewable Energy Association, released quarterly figures showing a 47% increase in new solar panel installations across Kenya. He attributed the growth to government incentives and falling panel prices.', sentiment: 'positive', relevance: 'medium', tags: ['Solar Energy', 'Growth', 'Market Data'], sIds: ['s-004'] },
    { title: 'Dr. Sarah Wanjiku Addresses Regional Energy Summit in Nairobi', excerpt: 'The Ministry of Energy\'s Principal Secretary, Dr. Sarah Wanjiku, delivered a keynote address at the East African Energy Summit, outlining Kenya\'s roadmap to achieving 100% renewable energy by 2030. She highlighted geothermal and wind energy as key pillars of the strategy.', sentiment: 'positive', relevance: 'high', tags: ['Energy Summit', 'Government Policy', 'Keynote'], sIds: ['s-001'] },
    { title: 'Opposition MPs Question Renewable Energy Amendment Timeline', excerpt: 'Deputy Speaker Hon. James Mwangi Kamau raised concerns about the aggressive timeline of the Energy Bill during a parliamentary session. He suggested that the 2030 deadline should be extended to 2035 to allow for "adequate infrastructure development and stakeholder consultation."', sentiment: 'negative', relevance: 'high', tags: ['Parliament', 'Opposition', 'Timeline'], sIds: ['s-013'] },
    { title: 'EPRA Commissioner Announces New Grid Modernization Standards', excerpt: 'Dr. Amina Abdullahi, Commissioner at the Energy & Petroleum Regulatory Authority, announced new technical standards for grid modernization that will be required to accommodate increased renewable energy capacity. The standards will take effect in Q3 2026.', sentiment: 'positive', relevance: 'medium', tags: ['EPRA', 'Regulation', 'Grid Standards'], sIds: ['s-005'] },
    { title: 'Youth Climate Activists Rally in Support of Energy Bill', excerpt: 'Thousands of young Kenyans gathered in Uhuru Gardens to rally in support of the Renewable Energy Amendment Bill. Organized by Kenneth Muturi\'s Youth Climate Action, the rally featured speeches from student leaders, environmental activists, and policy experts.', sentiment: 'positive', relevance: 'medium', tags: ['Youth Activism', 'Climate Rally', 'Public Support'], sIds: ['s-003'] },
    { title: 'Business Daily Analysis: Cost-Benefit of Kenya\'s Energy Transition', excerpt: 'A comprehensive analysis by Business Daily examines the economic trade-offs of Kenya\'s renewable energy transition. The report finds that while short-term costs may increase by 12%, long-term savings from reduced fossil fuel imports could reach KES 450 billion annually by 2032.', sentiment: 'neutral', relevance: 'medium', tags: ['Economic Analysis', 'Cost-Benefit', 'Long-term Impact'], sIds: [] },
    { title: 'Kenya Power CEO Calls for Balanced Approach to Energy Mix', excerpt: 'Peter Kariuki, CEO of Kenya Power, advocated for a balanced energy mix during an industry forum, noting that while renewable energy is the future, baseload stability from geothermal and natural gas remains critical during the transition period.', sentiment: 'neutral', relevance: 'medium', tags: ['Energy Mix', 'Grid Stability', 'Transition Planning'], sIds: ['s-028'] },
    { title: 'Citizen TV Poll: 72% of Kenyans Support Renewable Energy Bill', excerpt: 'A nationwide poll conducted by Citizen TV in partnership with Infotrak reveals that 72% of Kenyans support the Renewable Energy Amendment Bill, with strongest support among urban residents aged 18-35. Rural areas expressed more concern about implementation costs.', sentiment: 'positive', relevance: 'high', tags: ['Public Opinion', 'Poll', 'Support'], sIds: [] },
    { title: 'Total Energies Kenya Announces Green Hydrogen Pivot', excerpt: 'Paul Wekesa, Managing Director of Total Energies Kenya, surprised the industry by announcing a strategic pivot toward green hydrogen production. The company plans to invest KES 15 billion in hydrogen infrastructure over the next five years.', sentiment: 'positive', relevance: 'high', tags: ['Green Hydrogen', 'Corporate Strategy', 'Investment'], sIds: ['s-003'] },
    { title: '#EnergyBillKE Trends Nationwide on Twitter', excerpt: 'The hashtag #EnergyBillKE has been trending on X/Twitter for 48 hours, with over 2.3 million impressions. Sentiment analysis shows 65% positive, 20% negative, and 15% neutral mentions. Key influencers include environmental activists, policy analysts, and energy sector professionals.', sentiment: 'mixed', relevance: 'medium', tags: ['Social Media', 'Trending', 'Public Discourse'], sIds: [] },
    { title: 'Standard Reporter: Inside the Political Horse-Trading on Energy Bill', excerpt: 'Joseph Kipchoge of The Standard reports on behind-the-scenes political negotiations over the Energy Bill. Sources reveal that key swing votes in Parliament are being targeted by both proponents and opponents, with the Majority Whip playing a pivotal coordinating role.', sentiment: 'neutral', relevance: 'high', tags: ['Political Analysis', 'Parliament', 'Negotiations'], sIds: ['s-006', 's-014'] },
    { title: 'GIZ Kenya Launches Technical Assistance Program for Rural Electrification', excerpt: 'Hassan Ali, Country Director of GIZ Kenya, launched a new technical assistance program supporting rural electrification through mini-grids and solar home systems. The program targets 500,000 households in underserved counties.', sentiment: 'positive', relevance: 'medium', tags: ['GIZ', 'Rural Electrification', 'Mini-grids'], sIds: [] },
    { title: 'Mary Njoroge Questions Grid Readiness for 100% Renewables', excerpt: 'MP Mary Njoroge raised technical concerns in Parliament about the national grid\'s capacity to handle 100% renewable energy, citing recent intermittency issues with wind farms in Turkana County. She called for increased investment in battery storage.', sentiment: 'mixed', relevance: 'medium', tags: ['Grid Capacity', 'Battery Storage', 'Technical Concerns'], sIds: ['s-029'] },
    { title: 'Facebook Group "Kenyans for Clean Energy" Reaches 500K Members', excerpt: 'The Facebook group "Kenyans for Clean Energy" has reached half a million members, becoming one of the largest civic engagement platforms around energy policy. The group regularly hosts live discussions with policymakers and energy experts.', sentiment: 'positive', relevance: 'low', tags: ['Social Media', 'Civic Engagement', 'Community'], sIds: [] },
    { title: 'Taifa Leo: Wananchi wa Turkana Wapinga Mradi wa Upepo', excerpt: 'Taifa Leo reports on community resistance to expanded wind energy projects in Turkana County. Residents cite inadequate community benefit-sharing agreements and environmental concerns about bird migration patterns near Lake Turkana.', sentiment: 'negative', relevance: 'medium', tags: ['Community Resistance', 'Wind Energy', 'Turkana'], sIds: [] },
    { title: 'TikTok Explainer: What the Energy Bill Means for Your Electricity Bill', excerpt: 'A viral TikTok video by Kenyan energy analyst @PowerUpKE has accumulated 1.2 million views explaining how the Renewable Energy Amendment Bill would affect household electricity bills. The video breaks down tariff projections in simple, accessible terms.', sentiment: 'neutral', relevance: 'low', tags: ['TikTok', 'Explainer', 'Consumer Impact'], sIds: [] },
    { title: 'Capital FM Debate: Can Kenya Achieve 100% Renewables by 2030?', excerpt: 'Capital FM hosted a live debate featuring energy sector experts and policymakers discussing the feasibility of Kenya\'s 100% renewable energy target. Panelists agreed on the goal but differed on the timeline, with some suggesting 2032 as more realistic.', sentiment: 'mixed', relevance: 'medium', tags: ['Radio Debate', 'Energy Policy', 'Feasibility'], sIds: ['s-001', 's-004'] },
    { title: 'LinkedIn Analysis: Kenya\'s Green Jobs Potential Exceeds 200,000', excerpt: 'A LinkedIn Economic Graph analysis shared widely on the platform projects that Kenya\'s green energy transition could create over 200,000 new jobs by 2030, primarily in solar installation, wind turbine maintenance, geothermal operations, and green finance.', sentiment: 'positive', relevance: 'medium', tags: ['Green Jobs', 'Economic Impact', 'Employment'], sIds: [] },
    { title: 'KBC Special Report: Geothermal Power — Kenya\'s Hidden Advantage', excerpt: 'KBC aired a special 30-minute documentary on Kenya\'s geothermal energy potential in the Rift Valley. The report highlights that Kenya is already Africa\'s largest geothermal producer and could double capacity by 2028 with additional investment.', sentiment: 'positive', relevance: 'medium', tags: ['Geothermal', 'Documentary', 'Rift Valley'], sIds: [] },
    { title: 'KRA Commissioner General Comments on Energy Tax Incentives', excerpt: 'Dr. Wilson Songa, Commissioner General of KRA, outlined the fiscal framework for energy transition tax incentives during a Treasury briefing. He noted that tax holidays for renewable energy manufacturers would reduce revenue by KES 8.2 billion annually but boost long-term industrial growth.', sentiment: 'neutral', relevance: 'high', tags: ['Tax Policy', 'Fiscal Framework', 'KRA'], sIds: [] },
  ];

  const sourceAssignments = [
    'citizen-tv', 'ntv', 'nation', 'ktn', 'business-daily', 'citizen-tv',
    'ktn', 'capital-fm', 'ntv', 'business-daily', 'standard', 'citizen-tv',
    'nation', 'twitter', 'standard', 'nation', 'tv47', 'facebook', 'taifa-leo',
    'tiktok', 'capital-fm', 'linkedin', 'kbc', 'radio-citizen',
  ];

  return headlines.map((h, i) => ({
    id: `stream-${String(i + 1).padStart(3, '0')}`,
    sourceId: sourceAssignments[i % sourceAssignments.length],
    title: h.title,
    excerpt: h.excerpt,
    sentiment: h.sentiment,
    relevance: h.relevance,
    stakeholderIds: h.sIds.length > 0 ? h.sIds : stakeholderIds.slice(i % 4, (i % 4) + 2),
    tags: h.tags,
    publishedAt: i < 3 ? subMinutes(NOW, 15 + i * 42) : i < 8 ? subHours(NOW, 1 + i * 3) : subDays(NOW, Math.floor(i / 3)),
    url: '#',
    isBookmarked: i < 3,
    viewCount: Math.floor(Math.random() * 800) + 50,
  }));
}

const STREAM_ITEMS = generateStreamItems();

function timeAgo(date: Date): string {
  const diffMs = NOW.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return format(date, 'MMM d');
}

function SourceBadge({ source }: { source: StreamSource }) {
  const Icon = CATEGORY_META[source.category].icon;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center justify-center rounded-md"
        style={{ width: 22, height: 22, background: source.iconBg }}
      >
        <Icon size={12} style={{ color: source.color }} />
      </div>
      <span className="text-xs font-medium" style={{ color: source.color }}>{source.shortName}</span>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function RelevanceDot({ relevance }: { relevance: Relevance }) {
  const colors: Record<Relevance, string> = { high: '#C62828', medium: '#E65100', low: '#78909C' };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: colors[relevance], boxShadow: relevance === 'high' ? `0 0 6px ${colors.high}66` : 'none' }}
      title={`${relevance} relevance`}
    />
  );
}

export default function DataStreams() {
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('all');
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set(STREAM_ITEMS.filter(i => i.isBookmarked).map(i => i.id)));
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);

  const filteredItems = useMemo(() => {
    return STREAM_ITEMS.filter(item => {
      const source = SOURCES.find(s => s.id === item.sourceId);
      if (activeCategory !== 'all' && source?.category !== activeCategory) return false;
      if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) return false;
      if (showBookmarksOnly && !bookmarks.has(item.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.excerpt.toLowerCase().includes(q) || item.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [activeCategory, search, sentimentFilter, showBookmarksOnly, bookmarks]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; positive: number; negative: number }> = {};
    for (const cat of ['tv', 'radio', 'print', 'social'] as const) {
      const items = STREAM_ITEMS.filter(i => SOURCES.find(s => s.id === i.sourceId)?.category === cat);
      stats[cat] = {
        total: items.length,
        positive: items.filter(i => i.sentiment === 'positive').length,
        negative: items.filter(i => i.sentiment === 'negative').length,
      };
    }
    return stats;
  }, []);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const sources = activeCategory === 'all' ? SOURCES : SOURCES.filter(s => s.category === activeCategory);
    for (const src of sources) {
      counts[src.id] = STREAM_ITEMS.filter(i => i.sourceId === src.id).length;
    }
    return counts;
  }, [activeCategory]);

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Data Streams</h1>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time media intelligence across {SOURCES.length} sources · {STREAM_ITEMS.length} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showBookmarksOnly ? 'var(--brand-primary-bg)' : 'var(--bg-inset)',
              color: showBookmarksOnly ? 'var(--brand-primary-dark)' : 'var(--text-secondary)',
              border: showBookmarksOnly ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
            }}
          >
            <BookmarkCheck size={13} />
            Saved ({bookmarks.size})
          </button>
          <div
            className="flex items-center gap-1 px-1.5 py-1 rounded-full"
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
            <span className="text-xs font-medium pr-1" style={{ color: 'var(--text-muted)' }}>Live</span>
          </div>
        </div>
      </div>

      {/* Category Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['tv', 'radio', 'print', 'social'] as const).map(cat => {
          const meta = CATEGORY_META[cat];
          const stats = categoryStats[cat];
          const Icon = meta.icon;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? 'all' : cat)}
              className="rounded-xl p-4 text-left transition-all duration-200"
              style={{
                background: isActive ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
                border: isActive ? `2px solid ${meta.color}` : '1px solid var(--border-default)',
                boxShadow: isActive ? `0 0 0 1px ${meta.color}22, var(--shadow-md)` : 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}15` }}>
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>
                  <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{meta.label}</span>
                </div>
                <span className="font-mono text-lg font-bold" style={{ color: meta.color }}>{stats.total}</span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <TrendingUp size={10} style={{ color: '#1B7A43' }} /> {stats.positive}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingDown size={10} style={{ color: '#C62828' }} /> {stats.negative}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters + Source Pills */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search headlines, tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg pl-9 pr-3 py-2 text-body-sm outline-none transition-all"
              style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-1.5">
            {(['all', 'positive', 'negative', 'neutral', 'mixed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSentimentFilter(s)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: sentimentFilter === s ? (s === 'all' ? 'var(--text-primary)' : SENTIMENT_CONFIG[s as Sentiment].bg) : 'var(--bg-inset)',
                  color: sentimentFilter === s ? (s === 'all' ? 'white' : SENTIMENT_CONFIG[s as Sentiment].color) : 'var(--text-secondary)',
                  border: sentimentFilter === s ? '1px solid transparent' : '1px solid var(--border-default)',
                }}
              >
                {s === 'all' ? 'All' : SENTIMENT_CONFIG[s as Sentiment].label}
              </button>
            ))}
          </div>
        </div>

        {/* Source pills */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {SOURCES.filter(s => activeCategory === 'all' || s.category === activeCategory).map(src => (
            <div
              key={src.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{ background: src.iconBg, color: src.color, fontWeight: 500 }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: src.color }} />
              {src.shortName}
              <span style={{ opacity: 0.6 }}>({sourceCounts[src.id] || 0})</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Stream Feed */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <Card className="!py-12 text-center">
            <p className="text-body-sm" style={{ color: 'var(--text-muted)' }}>No items match your filters.</p>
          </Card>
        ) : (
          filteredItems.map(item => {
            const source = SOURCES.find(s => s.id === item.sourceId)!;
            const isExpanded = expandedId === item.id;
            const linkedStakeholders = item.stakeholderIds.map(sid => storeStakeholders.find(s => s.id === sid)).filter(Boolean);

            return (
              <div
                key={item.id}
                className="rounded-xl transition-all duration-200 overflow-hidden"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${isExpanded ? source.color + '44' : 'var(--border-default)'}`,
                  boxShadow: isExpanded ? `0 0 0 1px ${source.color}11, var(--shadow-md)` : 'var(--shadow-sm)',
                }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start gap-3">
                    <RelevanceDot relevance={item.relevance} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <SourceBadge source={source} />
                        <SentimentBadge sentiment={item.sentiment} />
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={10} /> {timeAgo(item.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-heading-sm leading-snug mb-1" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      {!isExpanded && (
                        <p className="text-body-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                      <button
                        onClick={e => { e.stopPropagation(); toggleBookmark(item.id); }}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: bookmarks.has(item.id) ? 'var(--brand-primary)' : 'var(--text-muted)' }}
                      >
                        {bookmarks.has(item.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      </button>
                      {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-3 accordion-expand" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: -4, paddingTop: 12 }}>
                    <p className="text-body-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {item.excerpt}
                    </p>

                    {linkedStakeholders.length > 0 && (
                      <div>
                        <div className="text-label mb-1.5" style={{ fontSize: '0.625rem' }}>Linked Stakeholders</div>
                        <div className="flex flex-wrap gap-2">
                          {linkedStakeholders.map(s => s && (
                            <button
                              key={s.id}
                              onClick={() => setSelectedStakeholder(s.id)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                            >
                              <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={20} />
                              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.full_name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                            style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                          >
                            <Tag size={9} /> {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1"><Eye size={11} /> {item.viewCount}</span>
                        <a
                          href={item.url}
                          className="flex items-center gap-1 transition-colors"
                          style={{ color: source.color }}
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink size={11} /> View source
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
