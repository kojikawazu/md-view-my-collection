/**
 * テーマ（デザインシステム）1 件を表す。
 *
 * 配色・レイアウト・角丸などの見た目を 1 オブジェクトに集約し、UI コンポーネントへ
 * props として流し込むための「テーマの単一ソース」。色やフォントの値は Tailwind の
 * ユーティリティクラス文字列（例: `bg-[#faf7f5]`）をそのまま保持する設計で、
 * 利用側は `className` に展開するだけでよい（`constants.ts` の `ESPRESSO_THEME` 参照）。
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

/**
 * レポートに紐づく外部リンク 1 件（サーバー／表示用）。
 *
 * DB の `ExternalUrl` 由来。`id` を持つ既存レコードを表し、フォーム入力用の
 * {@link ExternalUrlInput} とは区別する。
 */
export interface ExternalUrlItem {
  /** 外部 URL レコードの識別子。 */
  id: string;
  /** リンク先 URL（`http(s)://` 始まり）。 */
  url: string;
  /** リンクの表示ラベル。未設定時は `null`（URL をそのまま見せる想定）。 */
  label: string | null;
}

/**
 * 外部リンクのフォーム入力 1 件。
 *
 * {@link ExternalUrlItem} と異なり `id` を持たない（保存前の入力値）。
 * `label` は必須プロパティだが空文字を許容し、保存時に `null` へ正規化される。
 */
export interface ExternalUrlInput {
  /** 入力された URL 文字列。 */
  url: string;
  /** 入力されたラベル。空文字可（保存時に `null` 化）。 */
  label: string;
}

/**
 * 一覧・詳細で扱うレポート 1 件。
 *
 * DB の `Report` に紐づくタグ・外部 URL を結合したビュー用の形。
 * 日付系（`publishDate` / `createdAt` / `updatedAt`）は API で ISO 文字列化される。
 */
export interface ReportItem {
  /** レポートの識別子。 */
  id: string;
  /** レポートタイトル。 */
  title: string;
  /** 要約。未設定時は `null`/`undefined`（一覧カードや OGP 説明に使う）。 */
  summary?: string | null;
  /**
   * Markdown 本文。
   * 一覧 API（`GET /api/reports`）ではペイロード削減のため空文字で返り、
   * 実体は詳細 API（`GET /api/reports/[id]`）でのみ取得できる点に注意。
   */
  content: string;
  /** カテゴリ。固定リスト（`constants.ts` の `CATEGORIES`）のいずれか。 */
  category: string;
  /** 著者名。 */
  author: string;
  /** 公開日（ISO 文字列）。未指定・不正値は `null`/`undefined`。 */
  publishDate?: string | null;
  /** 作成日時（ISO 文字列）。サーバー採番のためクライアント作成時は未設定。 */
  createdAt?: string;
  /** 更新日時（ISO 文字列）。同上。 */
  updatedAt?: string;
  /** タグ（`#` 付き canonical 形式）。 */
  tags: string[];
  /** 紐づく外部リンク一覧。 */
  externalUrls: ExternalUrlItem[];
}

/**
 * 認証済みユーザー。
 *
 * 管理者判定はサーバー API（`/api/auth/admin`）が `ADMIN_EMAIL` と照合した結果を
 * `role` に反映する。クライアント側で `role` を書き換えても権限は付与されない
 * （実際の認可はサーバーで行う）。
 */
export interface User {
  /** ユーザー識別子（Supabase Auth の UID）。 */
  id: string;
  /** 表示名。 */
  username: string;
  /** メールアドレス。管理者判定に使うが取得できない場合は未設定。 */
  email?: string;
  /** 権限ロール。`admin` は編集・削除等の管理操作が可能。 */
  role: 'admin' | 'user';
}

/**
 * 作成・更新・削除など mutation 系操作の結果。
 *
 * 判別可能ユニオン。`ok` で成否を分岐し、失敗時のみ HTTP ステータスと
 * エラー内容を持つ。`fieldErrors` はバリデーション失敗時のフィールド別
 * メッセージ（フィールド名 → 日本語メッセージ）で、フォームの各入力欄に
 * エラーを紐付けるために使う。
 */
export type MutationResult =
  | { ok: true }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };
