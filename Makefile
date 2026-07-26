# Makefile — front/ の pnpm スクリプトを root から実行するためのラッパー。
# 全コマンドは front/ ディレクトリで pnpm 実行する（CLAUDE.md の規約に準拠）。
# 使い方: `make <target>`（引数なしの `make` はヘルプを表示）。

FRONT := front
PNPM  := pnpm

# .github/workflows/docs.yml と必ず同じ値にする。版差で MD051 等の判定が変わり、
# ローカル green / CI red が起きるため、バージョンを固定して両者を揃える。
MARKDOWNLINT_VERSION := 0.23.1

.DEFAULT_GOAL := help

.PHONY: help install dev build start \
        lint typecheck format check lint-docs lint-docs-fix \
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
