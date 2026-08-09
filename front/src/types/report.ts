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
  /** カテゴリ。固定リスト（`constants/report.ts` の `CATEGORIES`）のいずれか。 */
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
