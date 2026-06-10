# 要件仕様書

機能要件一覧・受け入れ条件・優先度を定義する。背景・目的は `docs/01-business-requirements.md` を参照。

## 目次

- [参照ドキュメント](#参照ドキュメント)
- [機能要件（ユーザーストーリー）](#機能要件ユーザーストーリー)
- [権限/アクセス](#権限アクセス)
- [コーディング規約（案）](#コーディング規約案)

## 参照ドキュメント

- `docs/03-functional-specification.md`（画面構成・UIレイアウト・機能詳細）
- `docs/08-test-specification.md`（E2Eテスト仕様・受け入れ条件の検証）

## 機能要件（ユーザーストーリー）

- 一覧: レポートの概要・著者・日付・カテゴリを閲覧し、詳細へ遷移できる。
- 一覧: カテゴリ/タグでレポートをフィルタできる（再クリックで解除、一覧復帰時はリセット）。
- 一覧: ページングできる（1ページ10件、ページ番号は最大5個、`前へ`/`次へ` あり）。
- 詳細: Markdown本文とタグを閲覧できる。外部URLがある場合はリンク一覧を表示する。管理者は編集/削除できる（削除は確認モーダル必須）。
- Markdown Style Lab: 管理者がMarkdown表示デザインを検証できる（`/report/markdown-lab`）。
- 新規作成: 管理者がレポートを作成し、投稿前に確認できる。
- 編集: 管理者がレポートを更新し、保存前に確認できる。
- 外部URL: レポートに外部URL（note / Zenn / はてなブログ等）を複数紐付けて保存・閲覧できる（機能仕様: `docs/03-functional-specification.md`、データ: `docs/05-data-specification.md`）。
- 認証: 管理者がログイン/ログアウトできる。

## 権限/アクセス

- 未ログイン: 閲覧のみ
- ログイン: 投稿/編集/削除が可能
  - Markdown Style Lab（`/report/markdown-lab`）もログイン時のみアクセス可能
  - RLS方針: Reportは公開閲覧、認証ユーザーのみ書き込み可能（詳細: `docs/05-data-specification.md`）
- 管理者メールは環境変数 `ADMIN_EMAIL` の一致のみ許可（複数指定はカンマ区切り）。詳細は `docs/06-security-specification.md`。

## コーディング規約（案）

- 2スペースインデント、セミコロンあり（既存コード準拠）。
- ReactコンポーネントはPascalCase、ユーティリティはcamelCase。
- `base/` は読み取り専用とし、実装は `front/` で行う（`base/` → `front/` のコピーは開発開始時の1回のみ）。
- 画面は `front/src/app/`（App Router）、共通UIは `front/src/components/` に配置。
- 再利用性を意識して適切にコンポーネント分割する。
- 開発開始時は必ずブランチを切って作業する。

> 規約の正本は `.claude/rules/coding-standards.md`。非機能要件は `docs/04-non-functional-specification.md` を参照。
