
import { DesignSystem, ReportItem } from './types';

export const ESPRESSO_THEME: DesignSystem = {
  id: 'espresso',
  name: 'Classic Espresso',
  description: 'Deep browns and high contrast for a serious, professional look.',
  fontPrimary: 'font-["Inter"]',
  fontHeader: 'font-playfair',
  colors: {
    background: 'bg-[#faf7f5]',
    surface: 'bg-[#ffffff]',
    primary: 'text-[#3d2b1f]',
    accent: 'bg-[#5c4033]',
    text: 'text-[#2a1b12]',
    muted: 'text-[#8c7e75]',
    border: 'border-[#e5e1de]',
  },
  layout: 'sidebar-left',
  headerStyle: 'sticky',
  sidebarStyle: 'full-height',
  borderRadius: 'rounded-none',
};

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: '1',
    title: 'The Future of Minimalism in UI Design',
    summary: 'An exploration of how clean lines and neutral palettes are evolving in the 2025 landscape.',
    content: '# The Future of Minimalism in UI Design\n\nMinimalism is not about a lack of things, it is about the perfect amount of things. In this report, we dive into the minimalist trends that are dominating the web.\n\n## Key Takeaways\n- Content-first layouts\n- Subtle micro-interactions\n- Earthy color palettes\n\n### Conclusion\nLess is indeed more when executed with intention.',
    category: 'Visuals',
    author: 'Hiroshi Tanaka',
    date: '2024-11-20',
    tags: ['#UIUX', '#Minimal']
  },
  {
    id: '2',
    title: 'Strategic Growth through Content Syndication',
    summary: 'Analyzing the impact of distributing high-quality reports across decentralized networks.',
    content: '# Strategic Growth through Content Syndication\n\nContent is king, but distribution is the castle. We analyze how syndication strategies impact brand visibility.\n\n## Data Analysis\nWe observed a 40% increase in reach when using multi-channel syndication.\n\n- Organic search: +12%\n- Referral traffic: +28%',
    category: 'Strategy',
    author: 'Elena Rossi',
    date: '2024-11-18',
    tags: ['#Strategy', '#Data Science']
  },
  {
    id: '3',
    title: 'Sustainable Web Development Practices',
    summary: 'How to optimize code for both performance and energy efficiency.',
    content: '# Sustainable Web Development Practices\n\nGreen hosting is just the beginning. The code we write affects carbon emissions. High-efficiency algorithms lead to lower power consumption.\n\n## Practices\n1. Asset optimization\n2. Efficient caching\n3. Lazy loading',
    category: 'Development',
    author: 'Liam Chen',
    date: '2024-11-15',
    tags: ['#AI', '#Development']
  }
];

export const CATEGORIES = ['Strategy', 'Development', 'Visuals', 'Data Science'];
export const TRENDING_TAGS = ['#AI', '#UIUX', '#Minimal', '#Nature'];
