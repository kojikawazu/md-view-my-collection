import { DesignSystem } from './types';

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

export const CATEGORIES = ['Development', 'AI', 'Cloud', 'Linux', 'Container', 'Application', 'Program', 'Hobby'];
export const TRENDING_TAGS = ['#AI', '#UIUX', '#Minimal', '#Nature'];
export const AUTH_COOKIE_NAME = 'report_viewer_auth';
