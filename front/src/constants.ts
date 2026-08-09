import { DesignSystem } from './types';

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

/**
 * カテゴリの固定リスト。
 *
 * レポートの `category` はこの中のいずれかに限定する（自由入力は不可）。
 * サーバーの zod スキーマ（`lib/schemas/report.ts` の `categorySchema`）が
 * この配列を参照して検証するため、ここが唯一の正準リスト。増減時は本定数のみ
 * 変更すれば API バリデーションと OpenAPI 生成に伝播する。
 */
export const CATEGORIES = [
  'Development',
  'AI',
  'Cloud',
  'Linux',
  'Container',
  'Application',
  'Program',
  'Hobby',
];

/** サイドバー等に表示する「トレンドタグ」の見せ球（固定表示。実データ集計ではない）。 */
export const TRENDING_TAGS = ['#AI', '#UIUX', '#Minimal', '#Nature'];

/**
 * 認証済みフラグ Cookie の名前。
 *
 * ログイン成功時にクライアントが `=1` を書き込み、ログアウトで破棄する。
 * Supabase のセッションはクライアント側に載りサーバーからは見えないため、
 * Server Component（`report/markdown-lab/layout.tsx`）が認証状態を判断できるよう、
 * サーバーからも読めるこの Cookie を「サーバー可視の認証フラグ」として橋渡しに使う。
 */
export const AUTH_COOKIE_NAME = 'report_viewer_auth';
