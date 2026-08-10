// 外部由来のレポート値（API レスポンス / localStorage）をドメインへ入れる前の検証。
// 通信は持たない純粋関数（`.claude/rules/frontend.md`）。呼び出し口は repositories と provider の 2 つ。

import { reportItemStateSchema } from '@/schemas/report';
import type { ReportItem } from '@/types/report';

/**
 * レポート 1 件を検証する。
 *
 * @param value - 検証前の値（`res.json()` / `JSON.parse` の戻り）
 * @returns 検証済みレポート。形が合わなければ `null`
 */
export const parseReportItem = (value: unknown): ReportItem | null => {
  const result = reportItemStateSchema.safeParse(value);
  if (result.success) return result.data;
  console.error('[reports] invalid report', result.error.issues);
  return null;
};

/**
 * レポート配列を 1 件ずつ検証する。
 *
 * **壊れた要素だけを捨て、残りは表示する**。カテゴリは DB 側に CHECK 制約が無く
 * 固定リストから外れうるが、1 件の混入で一覧全体が消える方が影響が大きいため。
 * 捨てた事実は `console.error` に必ず残す（黙って減ると気づけない）。
 *
 * @param value - 検証前の値。配列でなければ空配列を返す
 * @returns 検証を通った要素だけの配列
 */
export const parseReportList = (value: unknown): ReportItem[] => {
  if (!Array.isArray(value)) {
    console.error('[reports] expected an array', value);
    return [];
  }
  return value.flatMap((item) => {
    const parsed = parseReportItem(item);
    return parsed ? [parsed] : [];
  });
};
