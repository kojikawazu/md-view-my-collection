/**
 * `swagger-ui-dist` の自己完結バンドルを直接指す deep import の型定義。
 *
 * **なぜ deep import なのか**: パッケージのエントリ（`swagger-ui-dist`）は `absolute-path.js`
 * 経由で Node の `path` を `require` する。Client Component から取り込むとブラウザ向け
 * バンドルの解決に持ち込まれてしまうため、Node 依存を持たないブラウザ専用 UMD の
 * `swagger-ui-bundle.js` を直接指す。
 *
 * **なぜ自前で宣言するのか**: `@types/swagger-ui-dist` はパッケージのエントリにしか型を
 * 提供せず、この deep path には型が無い。設定オブジェクトの型だけはそちらから借りる。
 */
declare module 'swagger-ui-dist/swagger-ui-bundle.js' {
  import type { SwaggerConfigs } from 'swagger-ui-dist';

  /**
   * Swagger UI をマウントする。
   *
   * @param configs - 描画対象の DOM とスペックを含む設定
   * @returns Swagger UI のシステムオブジェクト（本プロジェクトでは使用しない）
   */
  const SwaggerUIBundle: (configs: SwaggerConfigs) => unknown;
  export default SwaggerUIBundle;
}
