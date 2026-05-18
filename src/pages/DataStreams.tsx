import { useState, useMemo } from 'react';
import {
  Search, Tv, Radio, Newspaper, Share2, Clock, Tag,
  Play, Pause, Volume2, Download, ExternalLink,
  FileText, Heart, MessageCircle, Repeat2,
  TrendingUp, TrendingDown, Minus, AlertCircle, Filter,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Card } from '../components/ui/Badges';
import Portrait from '../components/ui/Portrait';
import { format, subDays, subHours, subMinutes } from 'date-fns';
import { NOW } from '../lib/constants';

type StreamCategory = 'all' | 'tv' | 'radio' | 'print' | 'social';
type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
type SocialPlatform = 'twitter' | 'facebook' | 'tiktok' | 'linkedin';

interface StreamSource {
  id: string;
  name: string;
  shortName: string;
  category: 'tv' | 'radio' | 'print' | 'social';
  color: string;
  iconBg: string;
}

interface BaseItem {
  id: string;
  sourceId: string;
  title: string;
  excerpt: string;
  sentiment: Sentiment;
  stakeholderIds: string[];
  tags: string[];
  publishedAt: Date;
}

interface TVItem extends BaseItem { kind: 'tv'; duration: string; thumbnailGradient: string; videoLabel: string }
interface RadioItem extends BaseItem { kind: 'radio'; duration: string; audioProgress: number }
interface PrintItem extends BaseItem { kind: 'print'; imageGradient: string; pdfLabel: string; author: string }
interface SocialItem extends BaseItem { kind: 'social'; platform: SocialPlatform; handle: string; likes: number; reposts: number; comments: number; verified: boolean }

type StreamItem = TVItem | RadioItem | PrintItem | SocialItem;

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

const SENTIMENT_CFG: Record<Sentiment, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  positive: { label: 'Positive', color: '#1B7A43', bg: '#E8F5E9', icon: TrendingUp },
  negative: { label: 'Negative', color: '#C62828', bg: '#FFEBEE', icon: TrendingDown },
  neutral: { label: 'Neutral', color: '#5D6868', bg: '#F5F5F5', icon: Minus },
  mixed: { label: 'Mixed', color: '#E65100', bg: '#FFF3E0', icon: AlertCircle },
};

const GRADIENTS = [
  'linear-gradient(135deg, #1a2a3a 0%, #2c4a5e 100%)',
  'linear-gradient(135deg, #1e3a2f 0%, #2d5a45 100%)',
  'linear-gradient(135deg, #2a1a3a 0%, #4a2d5e 100%)',
  'linear-gradient(135deg, #3a2a1a 0%, #5e4a2d 100%)',
  'linear-gradient(135deg, #1a2a2a 0%, #2d4a4a 100%)',
  'linear-gradient(135deg, #3a1a2a 0%, #5e2d4a 100%)',
];

function buildStreamData(): StreamItem[] {
  const items: StreamItem[] = [];

  // TV items
  const tvData: Array<{ src: string; title: string; excerpt: string; sentiment: Sentiment; sIds: string[]; tags: string[]; dur: string; lbl: string; ago: Date }> = [
    { src: 'citizen-tv', title: 'Energy Committee Approves Renewable Energy Bill for Second Reading', excerpt: 'The National Assembly\'s Energy Committee, chaired by Hon. Fatuma Hassan, has unanimously approved the Renewable Energy Amendment Bill 2026. The committee cited overwhelming evidence for Kenya\'s clean energy transition.', sentiment: 'positive', sIds: ['s-003', 's-013'], tags: ['Energy Bill', 'Parliament'], dur: '4:32', lbl: 'LIVE REPORT', ago: subMinutes(NOW, 45) },
    { src: 'ntv', title: 'Kenya Pipeline CEO Warns of Job Losses from Energy Transition', excerpt: 'Gen. Peter Mburu (Rtd) stated during a press conference that rapid transition could result in 15,000 petroleum sector job losses. He called for a more gradual timeline.', sentiment: 'negative', sIds: ['s-015'], tags: ['Opposition', 'Employment'], dur: '6:18', lbl: 'EXCLUSIVE INTERVIEW', ago: subHours(NOW, 3) },
    { src: 'ktn', title: 'UNDP Pledges $50M for Kenya\'s Green Energy Goals', excerpt: 'Dr. Rebecca Muthoni, UNDP Kenya\'s Program Director, announced a $50 million support package including technical assistance and community solar installations.', sentiment: 'positive', sIds: ['s-007'], tags: ['Funding', 'UNDP'], dur: '3:47', lbl: 'NEWS BULLETIN', ago: subHours(NOW, 6) },
    { src: 'k24', title: 'Opposition MPs Question Energy Bill Timeline in Parliament', excerpt: 'Deputy Speaker Hon. James Mwangi Kamau raised concerns about the 2030 deadline, suggesting extension to 2035 for adequate infrastructure development.', sentiment: 'negative', sIds: ['s-013', 's-014'], tags: ['Parliament', 'Opposition'], dur: '8:12', lbl: 'PARLIAMENTARY SESSION', ago: subHours(NOW, 12) },
    { src: 'kbc', title: 'Special Report: Geothermal Power — Kenya\'s Hidden Advantage', excerpt: 'KBC documentary highlights Kenya as Africa\'s largest geothermal producer. Experts say capacity could double by 2028 with additional Rift Valley investment.', sentiment: 'positive', sIds: ['s-001'], tags: ['Geothermal', 'Documentary'], dur: '28:44', lbl: 'KBC DOCUMENTARY', ago: subDays(NOW, 1) },
    { src: 'tv47', title: 'Youth Climate Rally Draws Thousands to Uhuru Gardens', excerpt: 'Organized by Youth Climate Action, the rally featured speeches from student leaders, environmental activists, and policy experts supporting the Energy Bill.', sentiment: 'positive', sIds: ['s-003'], tags: ['Youth', 'Climate Rally'], dur: '5:03', lbl: 'FIELD REPORT', ago: subDays(NOW, 2) },
  ];

  tvData.forEach((d, i) => items.push({
    id: `tv-${i + 1}`, kind: 'tv', sourceId: d.src, title: d.title, excerpt: d.excerpt,
    sentiment: d.sentiment, stakeholderIds: d.sIds, tags: d.tags, publishedAt: d.ago,
    duration: d.dur, thumbnailGradient: GRADIENTS[i % GRADIENTS.length], videoLabel: d.lbl,
  }));

  // Radio items
  const radioData: Array<{ src: string; title: string; excerpt: string; sentiment: Sentiment; sIds: string[]; tags: string[]; dur: string; ago: Date }> = [
    { src: 'capital-fm', title: 'Capital FM Debate: Can Kenya Hit 100% Renewables by 2030?', excerpt: 'Live panel debate with energy experts and policymakers on the feasibility of Kenya\'s renewable energy target. Panelists agreed on the goal but differed on timeline.', sentiment: 'mixed', sIds: ['s-001', 's-004'], tags: ['Debate', 'Energy Policy'], dur: '42:15', ago: subHours(NOW, 2) },
    { src: 'radio-citizen', title: 'Morning Show: Dr. Sarah Wanjiku on Energy Summit Outcomes', excerpt: 'Exclusive interview with the Principal Secretary on East African Energy Summit outcomes and Kenya\'s roadmap to 100% renewables.', sentiment: 'positive', sIds: ['s-001'], tags: ['Interview', 'Energy Summit'], dur: '18:30', ago: subHours(NOW, 8) },
    { src: 'radio-jambo', title: 'Mazungumzo Kuhusu Mswada wa Nishati na Athari kwa Wananchi', excerpt: 'Panel ya wataalamu wanajadili jinsi mswada wa nishati mbadala utakavyoathiri bili za umeme kwa kaya za Kenya na biashara ndogo.', sentiment: 'neutral', sIds: [], tags: ['Swahili', 'Consumer Impact'], dur: '25:40', ago: subDays(NOW, 1) },
    { src: 'classic-105', title: 'Expert Analysis: Green Jobs vs Petroleum Sector Employment', excerpt: 'Economic experts debate the net employment impact of Kenya\'s energy transition, with projections of 200,000 new green jobs against 15,000 at-risk petroleum roles.', sentiment: 'mixed', sIds: ['s-015'], tags: ['Employment', 'Green Jobs'], dur: '15:22', ago: subDays(NOW, 2) },
    { src: 'ghetto-radio', title: 'Community Voice: Turkana Residents on Wind Farm Expansion', excerpt: 'Residents share concerns about community benefit-sharing from wind energy projects and impact on local grazing lands near Lake Turkana.', sentiment: 'negative', sIds: [], tags: ['Community', 'Turkana', 'Wind Energy'], dur: '12:08', ago: subDays(NOW, 3) },
    { src: 'spice-fm', title: 'Business Hour: Total Energies Pivots to Green Hydrogen', excerpt: 'Paul Wekesa, MD of Total Energies Kenya, discusses the company\'s KES 15 billion green hydrogen investment strategy in a morning business segment.', sentiment: 'positive', sIds: ['s-003'], tags: ['Green Hydrogen', 'Investment'], dur: '22:45', ago: subDays(NOW, 3) },
  ];

  radioData.forEach((d, i) => items.push({
    id: `radio-${i + 1}`, kind: 'radio', sourceId: d.src, title: d.title, excerpt: d.excerpt,
    sentiment: d.sentiment, stakeholderIds: d.sIds, tags: d.tags, publishedAt: d.ago,
    duration: d.dur, audioProgress: Math.random() * 0.35,
  }));

  // Print items
  const printData: Array<{ src: string; title: string; excerpt: string; sentiment: Sentiment; sIds: string[]; tags: string[]; author: string; pdf: string; ago: Date }> = [
    { src: 'nation', title: 'Inside the Political Horse-Trading on the Energy Bill', excerpt: 'Joseph Kipchoge reports on behind-the-scenes parliamentary negotiations. Key swing votes are being targeted by both proponents and opponents of the Bill, with the Majority Whip coordinating support.', sentiment: 'neutral', sIds: ['s-006', 's-014'], tags: ['Investigation', 'Parliament'], author: 'Joseph Kipchoge', pdf: 'Nation_Energy_Bill_Analysis.pdf', ago: subHours(NOW, 4) },
    { src: 'business-daily', title: 'Cost-Benefit Analysis: Kenya\'s Energy Transition Economics', excerpt: 'Short-term costs may increase 12% but long-term savings from reduced fossil fuel imports could reach KES 450B annually by 2032. Full economic modeling and sector projections inside.', sentiment: 'neutral', sIds: [], tags: ['Economics', 'Analysis'], author: 'Business Daily Research', pdf: 'BD_Cost_Benefit_Renewables.pdf', ago: subDays(NOW, 1) },
    { src: 'standard', title: 'EPRA Announces New Grid Modernization Standards', excerpt: 'Dr. Amina Abdullahi, EPRA Commissioner, published new technical standards for accommodating increased renewable energy capacity. Effective Q3 2026 for all utility-scale projects.', sentiment: 'positive', sIds: ['s-005'], tags: ['Regulation', 'Grid Standards'], author: 'Mercy Wangari', pdf: 'Standard_EPRA_Grid_Standards.pdf', ago: subDays(NOW, 1) },
    { src: 'east-african', title: 'East Africa\'s Race to Renewables: Kenya Leads the Pack', excerpt: 'Comparative analysis of renewable energy policies across Kenya, Tanzania, Uganda, and Rwanda. Kenya\'s geothermal advantage and regulatory framework put it ahead of regional peers.', sentiment: 'positive', sIds: ['s-001', 's-007'], tags: ['Regional', 'Comparative'], author: 'East African Bureau', pdf: 'EA_Renewables_Race_2026.pdf', ago: subDays(NOW, 2) },
    { src: 'taifa-leo', title: 'Wananchi wa Turkana Wapinga Mradi wa Upepo', excerpt: 'Wakazi wa eneo la Turkana wanaendelea kupinga upanuzi wa mradi wa upepo, wakitaja makubaliano duni ya kugawana faida na athari za mazingira.', sentiment: 'negative', sIds: [], tags: ['Turkana', 'Wind Energy', 'Swahili'], author: 'John Kiprotich', pdf: 'TaifaLeo_Turkana_Upepo.pdf', ago: subDays(NOW, 3) },
    { src: 'peoples-daily', title: 'KRA Outlines Tax Framework for Renewable Energy Incentives', excerpt: 'Dr. Wilson Songa details fiscal impact of energy transition tax holidays: KES 8.2B annual revenue reduction offset by projected industrial growth and reduced import costs.', sentiment: 'neutral', sIds: [], tags: ['Tax Policy', 'KRA'], author: 'PD Economics Desk', pdf: 'PD_KRA_Tax_Framework.pdf', ago: subDays(NOW, 4) },
    { src: 'mygov', title: 'Government Gazette: Renewable Energy Amendment Bill 2026', excerpt: 'Official gazette notice publishing the full text of the Bill as approved by the Energy Committee for second reading. Includes annexes on transition timelines and compliance standards.', sentiment: 'neutral', sIds: [], tags: ['Official', 'Gazette'], author: 'Kenya Gazette', pdf: 'MyGov_Gazette_Notice_RE_Bill.pdf', ago: subDays(NOW, 5) },
  ];

  printData.forEach((d, i) => items.push({
    id: `print-${i + 1}`, kind: 'print', sourceId: d.src, title: d.title, excerpt: d.excerpt,
    sentiment: d.sentiment, stakeholderIds: d.sIds, tags: d.tags, publishedAt: d.ago,
    imageGradient: GRADIENTS[i % GRADIENTS.length], pdfLabel: d.pdf, author: d.author,
  }));

  // Social items
  const socialData: Array<{ src: string; plat: SocialPlatform; handle: string; title: string; excerpt: string; sentiment: Sentiment; sIds: string[]; tags: string[]; likes: number; reposts: number; comments: number; verified: boolean; ago: Date }> = [
    { src: 'twitter', plat: 'twitter', handle: '@EnergyBillKE', title: '#EnergyBillKE Trends Nationwide', excerpt: 'BREAKING: The Energy Committee has unanimously approved the Renewable Energy Amendment Bill for second reading. This is a historic moment for Kenya\'s clean energy future. 🇰🇪⚡ #EnergyBillKE #CleanEnergyKenya', sentiment: 'positive', sIds: ['s-003'], tags: ['Trending', 'Breaking'], likes: 12400, reposts: 3200, comments: 890, verified: true, ago: subMinutes(NOW, 20) },
    { src: 'twitter', plat: 'twitter', handle: '@KenyaPipeline', title: 'Kenya Pipeline Response', excerpt: 'We urge caution on the aggressive timeline. 15,000 jobs are at stake. A transition that leaves workers behind is not a just transition. We call for dialogue. #EnergyTransition', sentiment: 'negative', sIds: ['s-015'], tags: ['Corporate', 'Opposition'], likes: 3100, reposts: 1500, comments: 2100, verified: true, ago: subHours(NOW, 2) },
    { src: 'facebook', plat: 'facebook', handle: 'Kenyans for Clean Energy', title: 'Community reaches 500K members!', excerpt: '🎉 We just hit 500,000 members! Thank you Kenya for showing that the people want clean, affordable energy.\n\nJoin our LIVE discussion tomorrow at 7pm with Dr. Sarah Wanjiku (PS Energy) on what the Bill means for your household.\n\n📺 Live right here on this page.', sentiment: 'positive', sIds: ['s-001'], tags: ['Community', 'Milestone'], likes: 24000, reposts: 8700, comments: 3200, verified: false, ago: subHours(NOW, 5) },
    { src: 'tiktok', plat: 'tiktok', handle: '@PowerUpKE', title: 'What the Energy Bill Means for Your Electricity Bill', excerpt: '♻️ Energy Bill Explainer ♻️\n\nPart 1: Will your bill go up? 📊\nPart 2: What happens to fuel surcharge? ⛽\nPart 3: Solar incentives for homes 🏠☀️\n\n1.2M views · 45K likes · Duet this!', sentiment: 'neutral', sIds: [], tags: ['Explainer', 'Consumer', 'Viral'], likes: 45200, reposts: 12800, comments: 5600, verified: true, ago: subHours(NOW, 18) },
    { src: 'linkedin', plat: 'linkedin', handle: 'Kenya Institute of Energy Professionals', title: 'Green Jobs Potential: 200,000+ by 2030', excerpt: 'Our latest analysis shows Kenya\'s green energy transition could create over 200,000 new jobs by 2030 — solar installation, wind maintenance, geothermal operations, and green finance.\n\nKey findings in our whitepaper (link in comments) 📄\n\n#GreenJobs #KenyaEnergy #Sustainability', sentiment: 'positive', sIds: [], tags: ['Green Jobs', 'LinkedIn Analysis'], likes: 8900, reposts: 2100, comments: 340, verified: true, ago: subDays(NOW, 1) },
    { src: 'facebook', plat: 'facebook', handle: 'Youth Climate Action Kenya', title: 'Rally Recap: Uhuru Gardens 🌍', excerpt: '📸 PHOTO ALBUM: Over 5,000 young Kenyans showed up at Uhuru Gardens in support of the Renewable Energy Bill!\n\nThank you to everyone who marched, chanted, and made their voice heard. The future is green and it\'s ours to build.\n\nSwipe for photos 👉', sentiment: 'positive', sIds: [], tags: ['Rally', 'Youth'], likes: 18500, reposts: 6200, comments: 1100, verified: false, ago: subDays(NOW, 2) },
  ];

  socialData.forEach((d, i) => items.push({
    id: `social-${i + 1}`, kind: 'social', sourceId: d.src, title: d.title, excerpt: d.excerpt,
    sentiment: d.sentiment, stakeholderIds: d.sIds, tags: d.tags, publishedAt: d.ago,
    platform: d.plat, handle: d.handle, likes: d.likes, reposts: d.reposts, comments: d.comments, verified: d.verified,
  }));

  return items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

const STREAM_ITEMS = buildStreamData();

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

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const c = SENTIMENT_CFG[sentiment]; const Icon = c.icon;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: c.bg, color: c.color }}><Icon size={11} />{c.label}</span>;
}

// TV card: video thumbnail with play button
function TVCard({ item }: { item: TVItem }) {
  const source = SOURCES.find(s => s.id === item.sourceId)!;
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="relative cursor-pointer group" style={{ background: item.thumbnailGradient, aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all group-hover:scale-110">
            <Play size={28} fill="white" stroke="white" />
          </div>
        </div>
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-bold text-white bg-red-600">{item.videoLabel}</div>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-xs font-mono text-white bg-black/60">{item.duration}</div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: source.iconBg }}><Tv size={12} style={{ color: source.color }} /></div>
          <span className="text-xs font-semibold text-white drop-shadow">{source.name}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <SentimentBadge sentiment={item.sentiment} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}><Clock size={10} className="inline mr-0.5" />{timeAgo(item.publishedAt)}</span>
        </div>
        <h3 className="text-heading-sm mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
        <p className="text-body-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.excerpt}</p>
        <TagsAndStakeholders item={item} />
      </div>
    </div>
  );
}

// Radio card: audio waveform player
function RadioCard({ item }: { item: RadioItem }) {
  const source = SOURCES.find(s => s.id === item.sourceId)!;
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(item.audioProgress);

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-start gap-3">
        <button onClick={() => setPlaying(!playing)} className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105" style={{ background: source.color }}>
          {playing ? <Pause size={20} fill="white" stroke="white" /> : <Play size={20} fill="white" stroke="white" style={{ marginLeft: 2 }} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: source.iconBg }}><Radio size={10} style={{ color: source.color }} /></div>
            <span className="text-xs font-semibold" style={{ color: source.color }}>{source.name}</span>
            <SentimentBadge sentiment={item.sentiment} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.publishedAt)}</span>
          </div>
          <h3 className="text-heading-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>

          {/* Audio waveform / progress bar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-8 rounded-md overflow-hidden cursor-pointer relative" style={{ background: 'var(--bg-inset)' }}
              onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setProgress((e.clientX - rect.left) / rect.width); }}
            >
              {/* Waveform bars */}
              <div className="absolute inset-0 flex items-center gap-px px-1">
                {Array.from({ length: 60 }, (_, i) => {
                  const h = 20 + Math.sin(i * 0.7 + item.id.charCodeAt(item.id.length - 1)) * 40 + Math.random() * 20;
                  const active = i / 60 < progress;
                  return <div key={i} className="flex-1 rounded-full transition-colors" style={{ height: `${Math.min(90, Math.max(15, h))}%`, background: active ? source.color : 'var(--border-strong)', opacity: active ? 0.85 : 0.3 }} />;
                })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
              <Volume2 size={12} />
              <span>{item.duration}</span>
            </div>
          </div>

          <p className="text-body-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.excerpt}</p>
          <TagsAndStakeholders item={item} />
        </div>
      </div>
    </div>
  );
}

// Print card: article with image and PDF download
function PrintCard({ item }: { item: PrintItem }) {
  const source = SOURCES.find(s => s.id === item.sourceId)!;
  return (
    <div className="rounded-xl overflow-hidden flex flex-col md:flex-row" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Article thumbnail */}
      <div className="md:w-56 shrink-0 relative" style={{ background: item.imageGradient, minHeight: 160 }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <Newspaper size={32} style={{ color: 'rgba(255,255,255,0.5)' }} />
          <span className="text-xs font-bold text-white/80 mt-2 text-center">{source.name}</span>
        </div>
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: source.color }}>{source.shortName}</div>
      </div>
      <div className="p-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <SentimentBadge sentiment={item.sentiment} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.publishedAt)}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by {item.author}</span>
        </div>
        <h3 className="text-heading-sm mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
        <p className="text-body-sm mb-3 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{item.excerpt}</p>
        <div className="flex items-center gap-2 mb-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: source.color + '12', color: source.color, border: `1px solid ${source.color}33` }}>
            <FileText size={13} /> Read Full Article
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
            <Download size={13} /> {item.pdfLabel}
          </button>
        </div>
        <TagsAndStakeholders item={item} />
      </div>
    </div>
  );
}

// Social card: platform-specific post mockup
function SocialCard({ item }: { item: SocialItem }) {
  const source = SOURCES.find(s => s.id === item.sourceId)!;
  const platformStyles: Record<SocialPlatform, { bg: string; border: string; handleColor: string }> = {
    twitter: { bg: 'var(--bg-elevated)', border: '1px solid var(--border-default)', handleColor: '#536471' },
    facebook: { bg: 'var(--bg-elevated)', border: '1px solid #1877F233', handleColor: '#1877F2' },
    tiktok: { bg: 'var(--bg-elevated)', border: '1px solid var(--border-default)', handleColor: '#010101' },
    linkedin: { bg: 'var(--bg-elevated)', border: '1px solid #0A66C233', handleColor: '#0A66C2' },
  };
  const ps = platformStyles[item.platform];
  const Icon = CATEGORY_META.social.icon;

  const formatCount = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="rounded-xl p-4" style={{ background: ps.bg, border: ps.border, boxShadow: 'var(--shadow-sm)' }}>
      {/* Post header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: source.iconBg }}>
          <Icon size={18} style={{ color: source.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-heading-sm" style={{ color: 'var(--text-primary)' }}>{item.handle}</span>
            {item.verified && <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: source.color }}>✓</span>}
          </div>
          <span className="text-xs" style={{ color: ps.handleColor }}>{source.name} · {timeAgo(item.publishedAt)}</span>
        </div>
        <SentimentBadge sentiment={item.sentiment} />
      </div>

      {/* Post body */}
      <p className="text-body-sm mb-3 whitespace-pre-line" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{item.excerpt}</p>

      {/* Engagement metrics */}
      <div className="flex items-center gap-5 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><Heart size={14} />{formatCount(item.likes)}</span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><Repeat2 size={14} />{formatCount(item.reposts)}</span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><MessageCircle size={14} />{formatCount(item.comments)}</span>
        <span className="flex-1" />
        <button className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: source.color }}>
          <ExternalLink size={12} /> View on {source.shortName}
        </button>
      </div>

      <TagsAndStakeholders item={item} />
    </div>
  );
}

function TagsAndStakeholders({ item }: { item: StreamItem }) {
  const storeStakeholders = useAppStore(s => s.storeStakeholders);
  const setSelectedStakeholder = useAppStore(s => s.setSelectedStakeholder);
  const linked = item.stakeholderIds.map(sid => storeStakeholders.find(s => s.id === sid)).filter(Boolean);

  return (
    <div className="mt-2.5 space-y-2">
      {linked.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linked.map(s => s && (
            <button key={s.id} onClick={() => setSelectedStakeholder(s.id)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            >
              <Portrait name={s.full_name} gender={s.gender} portraitUrl={s.portrait_url} size={18} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.full_name}</span>
            </button>
          ))}
        </div>
      )}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map(t => (
            <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.625rem]" style={{ background: 'var(--bg-inset)', color: 'var(--text-muted)' }}>
              <Tag size={8} />{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DataStreams() {
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('all');
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | 'all'>('all');

  const filtered = useMemo(() => {
    return STREAM_ITEMS.filter(item => {
      if (activeCategory !== 'all' && item.kind !== activeCategory) return false;
      if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.excerpt.toLowerCase().includes(q) || item.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [activeCategory, search, sentimentFilter]);

  const counts = useMemo(() => {
    const c = { tv: 0, radio: 0, print: 0, social: 0 };
    STREAM_ITEMS.forEach(i => c[i.kind]++);
    return c;
  }, []);

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg" style={{ color: 'var(--text-primary)' }}>Data Streams</h1>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time media intelligence across {SOURCES.length} sources
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
          <span className="text-xs font-medium pr-0.5" style={{ color: 'var(--text-muted)' }}>Live</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'tv', 'radio', 'print', 'social'] as const).map(cat => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const isActive = activeCategory === cat;
          const count = cat === 'all' ? STREAM_ITEMS.length : counts[cat];
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? meta.color : 'var(--text-secondary)',
                border: isActive ? `2px solid ${meta.color}` : '1px solid var(--border-default)',
                boxShadow: isActive ? `0 2px 8px ${meta.color}22` : 'none',
              }}
            >
              <Icon size={16} />
              {meta.label}
              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: isActive ? `${meta.color}15` : 'var(--bg-inset)' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Sentiment Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search headlines, tags..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-body-sm outline-none" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'positive', 'negative', 'neutral', 'mixed'] as const).map(s => (
            <button key={s} onClick={() => setSentimentFilter(s)} className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: sentimentFilter === s ? (s === 'all' ? 'var(--text-primary)' : SENTIMENT_CFG[s as Sentiment].bg) : 'var(--bg-inset)',
                color: sentimentFilter === s ? (s === 'all' ? 'white' : SENTIMENT_CFG[s as Sentiment].color) : 'var(--text-secondary)',
                border: sentimentFilter === s ? '1px solid transparent' : '1px solid var(--border-default)',
              }}
            >{s === 'all' ? 'All' : SENTIMENT_CFG[s as Sentiment].label}</button>
          ))}
        </div>
      </div>

      {/* Stream Feed */}
      {filtered.length === 0 ? (
        <Card className="!py-12 text-center">
          <p className="text-body-sm" style={{ color: 'var(--text-muted)' }}>No items match your filters.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeCategory === 'tv' || (activeCategory === 'all' && filtered.some(i => i.kind === 'tv')) ? (
            activeCategory === 'tv' ? null : <h2 className="text-heading-md pt-2" style={{ color: 'var(--text-primary)' }}>Television</h2>
          ) : null}
          {activeCategory === 'tv' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.filter(i => i.kind === 'tv').map(i => <TVCard key={i.id} item={i as TVItem} />)}
            </div>
          )}
          {activeCategory === 'radio' && (
            <div className="space-y-3">
              {filtered.filter(i => i.kind === 'radio').map(i => <RadioCard key={i.id} item={i as RadioItem} />)}
            </div>
          )}
          {activeCategory === 'print' && (
            <div className="space-y-3">
              {filtered.filter(i => i.kind === 'print').map(i => <PrintCard key={i.id} item={i as PrintItem} />)}
            </div>
          )}
          {activeCategory === 'social' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.filter(i => i.kind === 'social').map(i => <SocialCard key={i.id} item={i as SocialItem} />)}
            </div>
          )}
          {activeCategory === 'all' && (
            <>
              {filtered.some(i => i.kind === 'tv') && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><Tv size={16} style={{ color: '#E53935' }} /><h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Television</h2></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.filter(i => i.kind === 'tv').slice(0, 3).map(i => <TVCard key={i.id} item={i as TVItem} />)}
                  </div>
                </div>
              )}
              {filtered.some(i => i.kind === 'radio') && (
                <div className="pt-3">
                  <div className="flex items-center gap-2 mb-3"><Radio size={16} style={{ color: '#283593' }} /><h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Radio</h2></div>
                  <div className="space-y-3">
                    {filtered.filter(i => i.kind === 'radio').slice(0, 3).map(i => <RadioCard key={i.id} item={i as RadioItem} />)}
                  </div>
                </div>
              )}
              {filtered.some(i => i.kind === 'print') && (
                <div className="pt-3">
                  <div className="flex items-center gap-2 mb-3"><Newspaper size={16} style={{ color: '#1B5E20' }} /><h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Print Media</h2></div>
                  <div className="space-y-3">
                    {filtered.filter(i => i.kind === 'print').slice(0, 3).map(i => <PrintCard key={i.id} item={i as PrintItem} />)}
                  </div>
                </div>
              )}
              {filtered.some(i => i.kind === 'social') && (
                <div className="pt-3">
                  <div className="flex items-center gap-2 mb-3"><Share2 size={16} style={{ color: '#1877F2' }} /><h2 className="text-heading-md" style={{ color: 'var(--text-primary)' }}>Social Media</h2></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.filter(i => i.kind === 'social').slice(0, 4).map(i => <SocialCard key={i.id} item={i as SocialItem} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
