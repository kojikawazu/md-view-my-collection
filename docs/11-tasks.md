# Tasks

## 目次

- [要件定義](#要件定義)
- [リポジトリ構成](#リポジトリ構成)
- [フロントエンド実装（front/）](#フロントエンド実装front)
- [データ/永続化](#データ永続化)
- [テスト](#テスト)
- [デプロイ/運用](#デプロイ運用)
- [パフォーマンス改善](#パフォーマンス改善)
- [UIバグ修正](#uiバグ修正)
- [残タスク](#残タスク)
- [開発再開メモ](#開発再開メモ)
- [アトミックデザイン移行（Issue #37）](#アトミックデザイン移行issue-37)
- [APIルート移行（認証認可・DB操作 / youtube-my-collection踏襲 / Issue #42）](#apiルート移行認証認可db操作--youtube-my-collection踏襲--issue-42)
- [データ品質](#データ品質)
- [ドキュメント](#ドキュメント)
- [API / バリデーション基盤](#api--バリデーション基盤)

## 要件定義

- [x] 最新UIレイアウト要求を作成（`docs/03-functional-specification.md`）
- [x] 要件定義ドラフトを作成（`docs/02-requirements-specification.md`）
- [x] コーディング規約を明文化（`docs/02-requirements-specification.md`）
- [x] E2Eツールを選定（Playwright）
- [x] 認証方式を決定（Supabase Auth）
- [x] Markdownサニタイズ方針を確定（react-markdown/remark-gfm/rehype-sanitize）
- [x] ログ方針を確定（本番/開発ともconsole、セキュリティ配慮）

## リポジトリ構成

- [x] `base/` を `front/` にコピーして実装用ディレクトリを用意（開発開始時のみ）
- [x] `base/` を読み取り専用扱いとする運用ルールを整備

## フロントエンド実装（front/）

- [x] `types.ts` / `constants.ts` をドメイン単位のディレクトリへ移行（`types/{theme,report,user,api}.ts` / `constants/{theme,report,auth}.ts`・barrel なし・型 import を `import type` に統一 / Issue #163 / 2026-08-09）
- [x] 画面ルーティングを維持（一覧/詳細/新規/編集/ログイン）
- [x] UI要件に沿って画面を実装/調整
- [x] ログイン/ログアウト動作を実装
- [x] 投稿/編集/削除の確認モーダル動作を実装
- [x] Markdown簡易レンダリングを実装（要サニタイズ方針）
- [x] Markdown比較用ラボページを追加（`/report/markdown-lab` でv7単体の調整検証 / Issue #31）
- [x] Markdown比較ラボで1パターン（v7）を試験調整（黒背景コード + 引用強調 + 言語タグ別色分け + `・hoge` リスト表現 / Issue #31）
- [x] 詳細画面用v7で `ul`/`li` の行間・余白を調整して可読性を改善（Issue #31）
- [x] 詳細画面のMarkdown表示にv7スタイルを適用し本番利用可能に更新（Issue #31）
- [x] Markdown Style Lab を認証ユーザー限定に変更し、ヘッダーに導線（Markdown Lab）を追加（Issue #31）
- [x] 重要操作のログ出力を実装（投稿/編集/削除/ログイン）
- [x] 初期ダミーデータの表示を停止（Supabaseデータのみ表示）
- [x] 初期表示をフェードで切り替えるローディング画面を追加
- [x] ヘッダー文言を「Report Viewer」に変更
- [x] 一覧ページの説明文を削除
- [x] フッター説明文を日本語に変更
- [x] フッターブランド名を「Report Viewer」に変更
- [x] フッターの「Product」「Legal」セクションを削除
- [x] ログイン画面の見出しとサブ文言を日本語/Report Viewerに変更
- [x] Googleログインボタン文言を日本語に変更
- [x] Googleログイン補足文を削除
- [x] 投稿画面の「起草」を「投稿」に変更
- [x] 編集画面の「再構築」を「編集」に変更
- [x] サイドバーのタグを固定値からDB取得に変更
- [x] サイドバータグ表示の#を擬似要素にしてテスト競合を回避
- [x] カテゴリー一覧を新しい固定リストに更新しテストデータをAIに変更
- [x] サイドバーのカテゴリで一覧をフィルター可能に変更
- [x] サイドバーのタグで一覧をフィルター可能に変更
- [x] タグフィルター用にサイドバー表示と比較ロジックを正規化
- [x] タグフィルターの正規化と選択状態表示を強化
- [x] 一覧に現在のフィルター表示とクリア操作を追加
- [x] カテゴリ/タグの選択状態を強調して未選択を減衰
- [x] 一覧画面に戻るとフィルター状態をリセット
- [x] allowedDevOrigins の警告対策を強化
- [x] Turbopack の workspace root を `front/` に固定し `tailwindcss` 解決エラーを防止
- [x] ログイン後の表示ユーザー名をManagerに固定
- [x] 管理者メールの環境変数一致のみログイン許可
- [x] ログインのURLエラー処理をwindow.location参照に変更（ビルド対策）
- [x] 保存済みユーザー名もManagerに正規化
- [x] UI/要件/E2Eドキュメントを最新状態に更新
- [x] 一覧/詳細の著者表示をログイン時はManagerに統一
- [x] 未ログインの一覧画面でも著者表示をManagerに統一
- [x] 未ログインの詳細画面でも著者表示をManagerに統一
- [x] `NEXT_PUBLIC_ADMIN_EMAIL` を廃止し、`ADMIN_EMAIL` のサーバー判定API経由で管理者メール制御を実装（Issue #28 / PR #29 / 2026-02-12 動作確認OK）

## データ/永続化

- [x] 保存先の確定（Supabase等）
- [x] Report/Userスキーマを確定
- [x] 投稿/編集/削除のデータ連携
- [x] Prismaスキーマは既存テーブルを `prisma db pull` で取得し、新規設計は `schema.prisma` に記述（マイグレーション禁止）
- [x] RLSポリシーを全テーブル（Report/ReportTag/ReportTagMapping）に設定（公開閲覧 + 認証ユーザーのみ書き込み / 2026-03-22）

## テスト

- [x] E2Eテスト基盤を導入
- [x] 主要導線のE2Eテスト作成（一覧/詳細/投稿/編集/削除/ログイン）
- [x] E2Eテスト仕様（正常/準正常/異常）を定義（`docs/08-test-specification.md`）
- [x] GitHub ActionsでE2E自動実行を追加
- [x] GitHub ActionsのE2E実行成功を確認
- [x] ユニットテスト基盤を導入（Vitest + @testing-library/react + happy-dom / 2026-04-03）
- [x] テスト設計ドキュメントを作成（`docs/08-test-specification.md` に統合 / 2026-04-03）
- [x] validation.ts ユニットテスト作成（44実行ケース: it 37 個 + N-7 の it.each×8カテゴリ / validateReportInput + normalizeTags + validateExternalUrls / 2026-04-03）
- [x] hooks ユニットテスト作成（47件: usePagination 12 + useReportForm 19 + useLoginForm 8 + useLoading 2 + useReport 6 / 2026-04-03）
- [x] ConfirmationModal ユニットテスト作成（12件: 描画・二重クリック防止・エラー復帰 / 2026-04-03）
- [x] E2Eテスト強化（TC-026〜TC-031, TC-035, TC-036 追加 + helpers.ts 共通化 / 2026-04-03）
- [x] GitHub ActionsにVitestユニットテスト実行を追加（E2Eの前にUT実行する構成 / 2026-04-03）
- [x] 統合テスト（IT）基盤を導入: Testcontainers(Postgres) + Auth モックで APIルート×実 DB を検証（`front/tests/integration/`・`pnpm test:integration`・`gen:test-schema` で DDL 生成・33ケース / 2026-07-04）
- [x] CI（playwright ジョブ）に IT 実行を追加（UT の後 / 2026-07-04）
- [ ] E2E/シナリオの実 DB 化（Supabase CLI ローカルスタック・実 Auth/RLS・テストデータ後始末必須 / PR2 予定）
- [x] 本文の Markdown 描画に E2E 回帰ケースを追加（TC-037〜TC-042: 主要記法・GFM テーブル・「・」箇条書き変換・コールアウト・サニタイズ・本文未取得 / `tests/e2e/markdown.spec.ts` / Issue #25 / 2026-08-09）
- [x] `tsconfig.json` の `exclude` から `tests` を外し、`front/tests/` 配下を `pnpm typecheck` の対象に含めた（型エラー 0 件・Vitest / Playwright とも `globals` 未使用のため型衝突なし / Issue #183 / 2026-08-09）
- [x] アサーション順序を全テストで点検し、前提確認に隠れていたセキュリティ・認可の観点を是正（E2E 4 箇所は分割 + `expect.soft()`・IT 3 箇所は `it` 分割で 33→38 ケース・手動ミューテーションの運用を `.claude/rules/testing.md` へ昇格 / Issue #187 / 2026-08-22）

## デプロイ/運用

- [x] Vercelプロジェクトを作成
- [x] Vercel自動デプロイを設定（mainのみ、プレビューなし）
- [x] 本番環境変数を整備（必要が出た場合のみ）
- [x] 本番動作確認（Google OAuth/初期表示）
- [x] Prettier の差分ゼロを CI で検証（`format:check` 追加・`static-analysis` ジョブへ組込み・未整形 39 ファイルを一括整形・`.prettierrc.json` の重複設定を削除・`.git-blame-ignore-revs` 追加 / Issue #186 / 2026-08-09）

## パフォーマンス改善

- [x] ローディング最低表示時間を1000ms→300msに短縮（体感速度改善 / 2026-03-23）
- [x] PrismaClientを本番でもグローバル再利用に変更（コールドスタート時のDB再接続削減 / 2026-03-23）
- [x] Supabaseクライアントをモジュールスコープで初期化に変更（`auth-server.ts`, `api/auth/admin` / 2026-03-23）
- [x] 詳細・編集ページをSSG（静的生成）に変更しCDNキャッシュ配信に移行（`/report/[id]`, `/report/[id]/edit` / 2026-03-23）
- [x] 一覧APIからcontent除外（2.2MB→~76KB）+ 詳細を`useReport`フックで個別取得（2026-03-23）
- [x] GET API（reports/tags/reports/[id]）にCDNキャッシュヘッダー追加（`s-maxage=60, stale-while-revalidate=300` / 2026-03-23）
- [x] POST/PATCHトランザクション最適化: 不要クエリ削除 + upsert結果直接利用（DB呼び出し数 N+5→N+2 / 2026-03-23）
- [x] requireAdmin()の認証結果をメモリキャッシュ（同一トークンの2回目以降はSupabase HTTP往復スキップ / 2026-03-23）
- [x] mutation後のfetchTags()を廃止しderiveTagsFromReportsに統一（不要なAPI呼び出し排除 / 2026-03-23）
- [x] #47レビュー指摘対応: 設計書のPrisma/Supabaseシングルトン記述を実装に合わせて更新（`docs/07-api-specification.md` / 2026-03-23）
- [x] #47レビュー指摘対応: AppShellのローディング300ms定数を一元管理に変更（2026-03-23）

## UIバグ修正

- [x] サイドバーの TRENDING TAGS が横長になる問題を修正（`Sidebar.tsx` の `<aside>` に固定幅 `w-64` + `shrink-0` を追加 / Issue #60）
- [x] 詳細画面のタグが表示されない問題を検証し、**再現しないこと**を本番実データで確認（API は `tags` を返し、`Tags` 見出し直下にチップが描画される。クライアントから Supabase を直接叩いていた頃の不具合で、API ルート移行（Issue #42）で解消済み。コード修正なし / Issue #38 / 2026-08-22）

## 残タスク

- [x] allowedDevOrigins 警告の対応
- [x] Supabase DB連携の動作確認（実データCRUD）
- [ ] 監査/ログの強化（必要なら）
- [x] ページング機能の追加（一覧: 10件/ページ、ページ番号最大5、`前へ`/`次へ`、フィルタ変更時の1ページ目リセット / Issue #24）
- [x] Markdown表示のビジュアル改善（見出し/本文/リスト/引用/コードブロック/表の可読性向上）（Issue #31）
- [ ] Markdown記事ドラッグ&ドロップ取り込みページの追加（例: `/report/import`）
- [ ] ドロップしたMarkdown本文を既存Report項目へマッピングしてSupabaseへ保存する処理の追加（title/summary/content/category/tags/author）
- [ ] 取り込み時のバリデーション/エラー表示/成功トーストと遷移導線（一覧または詳細）を実装
- [ ] Markdown取り込み機能のE2Eケース追加（正常/準正常/異常: 空ファイル・必須欠落・非Markdown拡張子）
- [ ] Markdown本文がプレーンテキスト表示になる不具合の原因調査（強調・見出し・リストが効かない）
- [ ] Markdownレンダリング改善（強調/見出し/リスト/引用/コードブロックを表示反映）
- [ ] Markdownレンダリング改善（リンク/画像を安全に許可しつつ表示反映）
- [ ] Markdown表示崩れ防止のE2Eケース追加（記法ごとの描画検証）
- [x] Markdown Style Lab のアクセス制御/ヘッダー導線のE2Eケース追加（未ログイン時リダイレクト、ログイン時表示）
- [x] 一覧のカテゴリ/タグフィルタE2E（TC-003-2/TC-003-3）を追加
- [x] Google OAuthのリダイレクト固定（`NEXT_PUBLIC_SITE_URL` を使用）
- [x] ローディング画面のグラデーション/表示を調整
- [x] ログイン中もローディング画面を表示
- [x] ログイン成功後の遷移直後にもローディングを表示
- [x] ローディング最短表示時間を1秒に調整
- [x] ルート遷移ごとにローディングを必ず表示
- [x] パス変更の有無に関わらずローディングを再トリガー
- [x] リンククリック時にローディングを必ず表示
- [x] ローディング表示の不一致（ログイン済み/キャッシュ時）を解消

## 開発再開メモ

- [x] `front/` のNext.js再構築後、baseレイアウトの反映を開始する。
- [x] Prettier設定を追加（package.jsonのscript/依存追加、.prettierrc/.prettierignore）。
- [x] `front/src/types.ts` を作成してbaseの型を移植。
- [x] `front/src/constants.tsx` を作成してbaseのテーマ/初期データを移植。
- [x] `front/src/components/` と `front/src/app/` に画面/部品を移植する。
- [x] ルーティング: `/`, `/report/[id]`, `/report/new`, `/report/[id]/edit`, `/login` をApp Routerで構成。
- [x] SupabaseログインにGoogle OAuthを追加（localはE2E用に維持）

## アトミックデザイン移行（Issue #37）

- [x] アトミックデザイン設計書を作成（`docs/09-architecture-specification.md`）
- [x] Phase 1: ディレクトリ作成 + providers/hooks分離 + Atoms抽出
- [x] Phase 2: Molecules抽出
- [x] Phase 3: Organisms再編成 + hooks抽出（usePagination/useReportForm/useLoginForm）
- [x] Phase 4: Pages整理 + barrel export + 旧ファイル削除
- [x] 全フェーズ完了後の最終E2E + ビルド確認

## APIルート移行（認証認可・DB操作 / youtube-my-collection踏襲 / Issue #42）

- [x] APIルート設計書を作成（`docs/07-api-specification.md` / 2026-03-22）
- [x] 設計レビュー指摘対応: DJ-1〜DJ-8 を設計書に反映（2026-03-22）
  - DJ-1: クライアント側全件保持を維持（GET /api/reports はデフォルト全件返却）
  - DJ-2: タグ canonical form は `#` 付きで維持
  - DJ-3: Provider関数を async / MutationResult 返却に変更
  - DJ-4: accessToken のリロード時復元を設計に追加
  - DJ-5: API統合テストは不要と判断（E2Eテストで十分カバー）
  - DJ-6: カテゴリ固定リストバリデーション追加（constants.tsx 直接import、分離不要）
  - DJ-7: /api/auth/admin はboolean判定専用（requireAdmin()不使用、非管理者は200）
- [x] Phase 1: 基盤ファイル追加（`lib/auth-server.ts`, `lib/db.ts`, `lib/validation.ts`, `MutationResult` 型 / 2026-03-22）
- [x] Phase 2: APIルート追加（`api/auth/admin`, `api/reports`, `api/reports/[id]`, `api/tags` / Prisma v6ダウングレード / 2026-03-22）
- [x] Phase 3: クライアント側の接続切り替え（AppStateProvider → fetch APIルート、accessToken復元、MutationResult返却、不要コード削除 / 2026-03-22）
- [x] Phase 4: 認証エンドポイント統一（supabaseモード: `/api/auth/admin` (GET)、localモード: `/api/auth/is-allowed` (POST) 維持 / 2026-03-23）
- [x] E2Eテスト全パス確認 + ビルド確認（2026-03-22）

## データ品質

- [x] Reportテーブル全229件のハルシネーション・品質チェック実施（`docs/10-miscellaneous-specification.md` / 2026-03-24）
- [x] MongoDB 9.0 ハルシネーション修正（3件 → MongoDB 8.x）
- [x] Milvus 2.5 ミスリード修正（1件 → Milvus 2.6.x）
- [x] カテゴリ誤分類修正（4件）
- [x] タイトル書式不備修正（2件）
- [x] Gemini 3 → Gemini 3.1 Pro / Starcloud記述修正（2件）
- [x] Gemini記事にソースURL付与（第1弾: 56件追加、15%→49%に改善 / 2026-03-24）
- [ ] Gemini記事にソースURL付与（第2弾: 残り82件）
- [ ] Gemini生成プロンプトにソースURL必須化ルールを追加

## ドキュメント

- [x] コードと `.claude/rules/` の乖離を機械的に棚卸しし、検出した 5 件を修正（環境変数一覧の欠落 2 件・陳腐化したファイルパス 4 件・置き換え済みの旧テスト方式が「正式一覧」の見出しで残存）。再発防止を `.claude/rules/documentation.md` へ昇格 / Issue #142 / 2026-08-22）
- [x] ドキュメントを最新状態に整理
- [x] `npm run dev` 時の `tailwindcss` 解決エラーのバグレポートを起票（Issue #32 / 2026-02-14）
- [x] 環境変数一覧を docs に追加し、README の参照先を docs に統一（`docs/04-non-functional-specification.md` / 2026-06-10）
- [x] 画面/ルート一覧を README から削除し、docs 参照に統一（`docs/03-functional-specification.md` / 2026-06-10）
- [x] docs index のファイル参照をリンク化（`docs/README.md` / 2026-06-10）
- [x] docs index を youtube-my-collection の構成・文体を参考に再構成（`docs/README.md` / 2026-06-10）
- [x] docs/ 全仕様書（01〜11・README）にアンカーリンク付き目次を追加（h3まで・形式統一 / 2026-06-10）
- [x] root/front README の役割分担と重複解消（技術スタック・開発手順を front に集約 / PR #75 / 2026-06-12）
- [x] `rules-update` スキルのテンプレートと `.claude/rules/` を全文突合し、記載漏れ 3 件を補完（`testing.md` に IT / `commands.md` に typecheck・gen:* / `github-issue.md` の frontmatter / Issue #149 / 2026-07-26）

## API / バリデーション基盤

- [x] zod + zod-openapi 導入。`front/src/lib/schemas/` を契約の単一ソース化し、`lib/validation.ts` を zod アダプタへ移行（既存 45 テスト互換維持 / 2026-06-13）
- [x] `pnpm gen:openapi` で `docs/openapi.json`（OpenAPI 3.1）を生成。`docs/07-api-specification.md` の契約記述を生成物参照へ置換（2026-06-13）
- [x] Swagger UI を `/docs`（管理者のみ）に導入。スペックは管理者ゲート付き `/api/openapi` から取得（2026-06-13）
- [x] `/docs` の Swagger UI を `swagger-ui-react` から `swagger-ui-dist` の自己完結バンドルへ置き換え（バンドラ経由で apidom が壊れ、オペレーションを展開しても Parameters / Request body / Responses が一切描画されていなかった。`docs/07-api-specification.md` の「Swagger UI は導入していない」という実態と違う記述も併せて修正 / Issue #197 / 2026-08-22）

## ルールと実装の乖離解消（Issue #142）

`.claude/rules/` と実装・CI・ドキュメントを機械的に突き合わせ、検出した乖離をサブ issue に分割して対応した（2026-07-26）。

- [x] 認証ログからメールアドレスを除去（`AppStateProvider.tsx` / Issue #143 / PR #152）
- [x] カスタムフック 6 本に戻り値型を明示し、コメントを型メンバーへ移動（Issue #144 / PR #154）
- [x] `api.md` のレスポンス整形をマッパー許可リスト方式に緩和し、`server-only` を導入（Issue #145 / PR #155）
- [x] CSP を `Report-Only` で導入。付随セキュリティヘッダー 4 種は強制（Issue #147 / PR #156）
- [x] CSP を `Report-Only` から**強制**へ切り替え（本番の公開導線・ローカル本番ビルドの認証後導線・`/docs` の Swagger UI・全 100 レポート本文のスキャンで違反 0 件を観測してから切替。強制後も同じ導線と `pnpm test:e2e` 33 ケースで確認 / Issue #166 / 2026-08-22）
- [x] `constants.tsx` を `constants.ts` にリネーム（Issue #148 / PR #153）
- [x] `.claude/rules/` の記載漏れ 3 件を補完（IT・typecheck・frontmatter / Issue #149 / PR #150）
- [x] Vercel のデプロイ発火を制御（Issue #151 / PR #157・#160・#161）
- [x] `fetch` を `repositories/` へ集約し、`lib/schemas/` を `src/schemas/` へ移動（Issue #164 / 2026-08-10）
- [x] API レスポンス・localStorage を zod で実行時検証し、`ReportItem.category` を union へ狭める（Issue #190 / 2026-08-11）
- [x] レートリミットを実装（Upstash Redis / `@upstash/ratelimit`。認証系 2 本 + 書き込み系 3 本のハンドラ先頭で判定し、超過時は認可より前に 429 + `Retry-After`。環境変数未設定なら無効化して素通しするため CI / E2E に影響しない。クライアントは 429 を「不許可」と区別する。UT 9 + IT 5 ケース追加 / Issue #146 / 2026-08-22）
  - **本番で効かせるには Upstash のアカウント作成と Vercel への環境変数 2 つの設定が必要（未実施）**
- [x] Vercel のデプロイ抑止が実際に効くことの観測（`"**": false` が main に載った 2026-07-26 以降、14 本の PR ブランチ push で Preview 0 件・main マージは 14 件すべて本番デプロイ。ドキュメントのみの #174 / #181 もデプロイされ `ignoreCommand` 撤去の意図どおり / Issue #159 → #167 / 2026-08-22）
- [x] GitHub Actions ワークフローを actionlint で検証（`.github/workflows/actionlint.yml` を新設し**パスフィルタ無しで全 PR 常時実行**。バージョンは `Makefile` の `ACTIONLINT_VERSION` と揃えて固定し `make actionlint` で同一検査。ルール本文が `github-actions.md` の表の 1 セルに単語があるだけだったため、上流 `my-custom-skills` #147 相当のセクションを追記して正本を揃えた。既存 `test.yml` / `docs.yml` は指摘ゼロで通過 / Issue #202 / 2026-08-23）

### 積み残し

- Upstash のアカウント作成と Vercel への環境変数 2 つの設定（`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`）。**設定するまで本番ではレートリミットが無効**（実装自体は完了 / Issue #146）
- `script-src` の nonce 化（`'unsafe-inline' 'unsafe-eval'` の撤廃。`middleware.ts` の新設を伴うため強制化とは分離 / 判断理由は `docs/06-security-specification.md`「nonce 化を見送る判断」）
