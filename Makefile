# Makefile — front/ の pnpm スクリプトを root から実行するためのラッパー。
# 全コマンドは front/ ディレクトリで pnpm 実行する（CLAUDE.md の規約に準拠）。
# 使い方: `make <target>`（引数なしの `make` はヘルプを表示）。

FRONT := front
PNPM  := pnpm

# .github/workflows/docs.yml と必ず同じ値にする。版差で MD051 等の判定が変わり、
# ローカル green / CI red が起きるため、バージョンを固定して両者を揃える。
MARKDOWNLINT_VERSION := 0.23.1

# actionlint の公式 Docker イメージ。CI（actionlint.yml）も `make actionlint` を呼ぶため、
# バージョンの定義はここ 1 箇所だけ（workflow 側に書き写さない / Issue #204）。
# - shellcheck / pyflakes が同梱されるので、run: の中身の検査が手元で静かに欠けることがない
#   （バイナリ単体だと shellcheck が PATH に無いとき、その層だけ黙ってスキップされる）
# - タグは付け替えられるため、マルチアーキテクチャのマニフェストリストのダイジェストで固定する
#   （amd64 の CI と arm64 の手元で同じ指定が使える）。更新時はタグとダイジェストを一緒に変える:
#   docker buildx imagetools inspect rhysd/actionlint:<version>  の Digest 行
ACTIONLINT_IMAGE := rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667

.DEFAULT_GOAL := help

.PHONY: help install dev build start \
        lint typecheck format check lint-docs lint-docs-fix actionlint secret-scan \
        test test-watch test-integration test-e2e test-e2e-ui test-e2e-report \
        gen-openapi gen-test-schema \
        prisma-pull prisma-generate

## ヘルプを表示
help:
	@grep -E '^## ' -A1 $(MAKEFILE_LIST) \
		| grep -vE '^--' \
		| awk '/^## / { desc=substr($$0, 4); next } { split($$1, a, ":"); printf "  \033[36m%-18s\033[0m %s\n", a[1], desc }'

# --- セットアップ / 開発 -----------------------------------------------------

## 依存をインストール（postinstall で prisma generate 実行）
install:
	cd $(FRONT) && $(PNPM) install

## 開発サーバー起動（http://localhost:3000）
dev:
	cd $(FRONT) && $(PNPM) dev

## プロダクションビルド
build:
	cd $(FRONT) && $(PNPM) build

## プロダクションビルドを配信
start:
	cd $(FRONT) && $(PNPM) start

# --- 静的解析 / 整形 ---------------------------------------------------------

## ESLint 実行（CI のグリーン条件）
lint:
	cd $(FRONT) && $(PNPM) lint

## 型チェック（tsc --noEmit）
typecheck:
	cd $(FRONT) && $(PNPM) typecheck

## Prettier で整形
format:
	cd $(FRONT) && $(PNPM) format

## Markdown lint（docs.yml と同じバージョンで実行）
lint-docs:
	npx --yes markdownlint-cli2@$(MARKDOWNLINT_VERSION)

## Markdown lint の自動修正
lint-docs-fix:
	npx --yes markdownlint-cli2@$(MARKDOWNLINT_VERSION) --fix

# check には含めない。workflow を触るときしか必要ないため独立させる。
# 引数なしで実行すると .github/workflows を自動検出して全ワークフローを検査する。
# リポジトリは読み取り専用でマウントする（検査するだけで書き込まない）。
## GitHub Actions ワークフローの静的解析（CI と同じイメージ・同じコマンド。Docker 必須）
actionlint:
	@docker run --rm -v "$(CURDIR)":/repo:ro -w /repo $(ACTIONLINT_IMAGE) -color

# ガード自体の自己テストを先に通す。判定の正本は .github/scripts/secret-scan.sh。
## 追跡対象に秘匿ファイル（鍵・.env 系）が無いかを検査（secret-scan.yml と同じ手順）
secret-scan:
	@bash .github/scripts/secret-scan.test.sh
	@bash .github/scripts/secret-scan.sh

## lint + typecheck をまとめて実行（CI static-analysis 相当）
check: lint typecheck

# --- テスト -----------------------------------------------------------------

## ユニットテスト（Vitest）
test:
	cd $(FRONT) && $(PNPM) test

## ユニットテスト（watch モード）
test-watch:
	cd $(FRONT) && $(PNPM) test:watch

## 統合テスト（Testcontainers Postgres・Docker 必須）
test-integration:
	cd $(FRONT) && $(PNPM) test:integration

## E2E テスト（Playwright）
test-e2e:
	cd $(FRONT) && $(PNPM) test:e2e

## E2E テスト（UI モード）
test-e2e-ui:
	cd $(FRONT) && $(PNPM) test:e2e:ui

## E2E テストレポート表示
test-e2e-report:
	cd $(FRONT) && $(PNPM) test:e2e:report

# --- 生成物 -----------------------------------------------------------------

## OpenAPI ドキュメント生成（docs/openapi.json）
gen-openapi:
	cd $(FRONT) && $(PNPM) gen:openapi

## IT 用 DDL 生成（tests/integration/schema.sql）
gen-test-schema:
	cd $(FRONT) && $(PNPM) gen:test-schema

# --- Prisma -----------------------------------------------------------------

## 既存 DB スキーマを取得（マイグレーションは禁止）
prisma-pull:
	cd $(FRONT) && $(PNPM) prisma db pull

## Prisma Client を再生成
prisma-generate:
	cd $(FRONT) && $(PNPM) prisma generate
