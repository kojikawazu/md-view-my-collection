import ReportDetailClient from './client';

/** 事前生成していない ID もオンデマンドで動的レンダリングを許可する。 */
export const dynamicParams = true;

/**
 * ビルド時に事前生成するパスを返す。空配列＝事前生成せず、全アクセスをオンデマンド生成に委ねる。
 * レポートは実行時に DB から取得するため、ビルド時点で ID を列挙しない。
 */
export async function generateStaticParams() {
  return [];
}

/**
 * レポート詳細画面（`/report/[id]`・サーバーコンポーネント）。
 * クライアント側でルートパラメータと状態を扱うため、描画をクライアントコンポーネントへ委譲する。
 */
export default function ReportDetailPage() {
  return <ReportDetailClient />;
}
