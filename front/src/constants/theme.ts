import type { DesignSystem } from '@/types/theme';

/**
 * 既定テーマ「Classic Espresso」。
 *
 * アプリ全体のデフォルト配色・レイアウトの単一ソース。色やフォントは Tailwind の
 * ユーティリティクラス文字列で保持し（{@link DesignSystem} 参照）、利用側は
 * `className` に展開するだけで済む。テーマを増やす場合はこの形の定数を追加する。
 */
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
