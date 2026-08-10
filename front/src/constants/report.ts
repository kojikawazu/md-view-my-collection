/**
 * カテゴリの固定リスト。
 *
 * レポートの `category` はこの中のいずれかに限定する（自由入力は不可）。
 * サーバーの zod スキーマ（`schemas/report.ts` の `categorySchema`）が
 * この配列を参照して検証するため、ここが唯一の正準リスト。増減時は本定数のみ
 * 変更すれば API バリデーションと OpenAPI 生成に伝播する。
 *
 * `as const` を付けず型も導出していないのは、`ReportItem.category` を
 * union へ狭める前に API レスポンスの実行時検証が必要なため（Issue #190）。
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
