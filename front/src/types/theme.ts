/**
 * テーマ（デザインシステム）1 件を表す。
 *
 * 配色・レイアウト・角丸などの見た目を 1 オブジェクトに集約し、UI コンポーネントへ
 * props として流し込むための「テーマの単一ソース」。色やフォントの値は Tailwind の
 * ユーティリティクラス文字列（例: `bg-[#faf7f5]`）をそのまま保持する設計で、
 * 利用側は `className` に展開するだけでよい（`constants/theme.ts` の `ESPRESSO_THEME` 参照）。
 */
export interface DesignSystem {
  /** テーマ識別子（`espresso` 等）。テーマ切替時のキーに使う。 */
  id: string;
  /** 表示用のテーマ名。 */
  name: string;
  /** テーマの雰囲気を説明する短文（テーマ選択 UI 用）。 */
  description: string;
  /** 本文フォントの Tailwind クラス（例: `font-["Inter"]`）。 */
  fontPrimary: string;
  /** 見出しフォントの Tailwind クラス（例: `font-playfair`）。 */
  fontHeader: string;
  /** 配色。各値は Tailwind ユーティリティクラス文字列（`bg-*` / `text-*` / `border-*`）。 */
  colors: {
    /** ページ全体の背景色クラス。 */
    background: string;
    /** カード・パネル等の面色クラス。 */
    surface: string;
    /** 主要テキスト・ブランド色の text クラス。 */
    primary: string;
    /** 強調要素（ボタン等）の背景色クラス。 */
    accent: string;
    /** 標準本文テキストの色クラス。 */
    text: string;
    /** 補助・メタ情報向けの淡い色クラス。 */
    muted: string;
    /** 区切り線・枠線の border クラス。 */
    border: string;
  };
  /** サイドバー位置やグリッド等の全体レイアウト方式。 */
  layout: 'sidebar-left' | 'sidebar-right' | 'grid' | 'centered';
  /** ヘッダーの追従挙動（スクロール追従 / 固定 / 通常フロー）。 */
  headerStyle: 'sticky' | 'fixed' | 'static';
  /** サイドバーの表示形態（全高 / カード / 非表示）。 */
  sidebarStyle: 'full-height' | 'card' | 'none';
  /** 角丸の Tailwind クラス（例: `rounded-none`）。テーマ全体の丸みを統一する。 */
  borderRadius: string;
}
