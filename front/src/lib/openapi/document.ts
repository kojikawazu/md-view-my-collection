import { z } from 'zod';
import { createDocument } from 'zod-openapi';
import {
  errorSchema,
  reportCreateSchema,
  reportItemSchema,
  reportPatchSchema,
  tagListSchema,
  validationErrorSchema,
} from '@/schemas/report';

/**
 * OpenAPI ドキュメントの単一ソース。
 *
 * リクエスト/レスポンスのスキーマは `schemas/report.ts`（zod）を参照する。
 * `scripts/gen-openapi.ts` がこの関数を呼び、`docs/openapi.json` を生成する。
 */

const reportListSchema = z.array(reportItemSchema).meta({ id: 'ReportList' });

const isAdminSchema = z.object({ isAdmin: z.boolean() }).meta({ id: 'IsAdminResponse' });
const isAllowedRequestSchema = z
  .object({ email: z.string().nullish().meta({ description: 'local モードで照合するメール' }) })
  .meta({ id: 'IsAllowedRequest' });
const isAllowedSchema = z.object({ allowed: z.boolean() }).meta({ id: 'IsAllowedResponse' });
const okSchema = z.object({ ok: z.boolean() }).meta({ id: 'OkResponse' });

/**
 * `application/json` のリクエストボディ定義を組み立てる短縮ヘルパー。
 *
 * @param schema ボディの zod スキーマ
 * @returns OpenAPI の requestBody 用オブジェクト
 */
const jsonBody = <T extends z.ZodType>(schema: T) => ({
  content: { 'application/json': { schema } },
});

/**
 * `application/json` のレスポンス定義を組み立てる短縮ヘルパー。
 *
 * @param description レスポンスの説明
 * @param schema レスポンスボディの zod スキーマ
 * @returns OpenAPI の response 用オブジェクト
 */
const jsonResponse = <T extends z.ZodType>(description: string, schema: T) => ({
  description,
  content: { 'application/json': { schema } },
});

const reportIdParam = z.object({
  id: z.string().meta({ description: 'レポート ID', example: 'rep_123' }),
});

const reportListQuery = z.object({
  limit: z.string().optional().meta({ description: '取得件数（1〜1000）', example: '10' }),
  offset: z.string().optional().meta({ description: 'スキップ件数（0〜）', example: '0' }),
});

/** 生成する OpenAPI ドキュメントの仕様バージョン。 */
export const OPENAPI_VERSION = '3.1.0';

/**
 * 全エンドポイントを含む OpenAPI ドキュメントを組み立てる。
 *
 * パス定義とスキーマ参照をまとめ、`createDocument` で OpenAPI 3.1 ドキュメントを返す。
 * `scripts/gen-openapi.ts`（`docs/openapi.json` 生成）と `/api/openapi`（Swagger UI 用）から呼ばれる。
 *
 * @param version `info.version` に載せる API バージョン（既定 `'0.0.0'`）
 * @returns 生成された OpenAPI ドキュメントオブジェクト
 */
export const buildOpenApiDocument = (version = '0.0.0') =>
  createDocument({
    openapi: OPENAPI_VERSION,
    info: {
      title: 'md-view-my-collection API',
      version,
      description:
        'Markdown レポートの保存・閲覧 UI の BFF（Next.js Route Handlers）。' +
        'このドキュメントは zod スキーマ（front/src/schemas）から自動生成される。',
    },
    servers: [{ url: '/', description: '同一オリジン（Next.js）' }],
    tags: [
      { name: 'reports', description: 'レポート CRUD' },
      { name: 'tags', description: 'タグ' },
      { name: 'auth', description: '認証・認可' },
    ],
    paths: {
      '/api/reports': {
        get: {
          tags: ['reports'],
          summary: 'レポート一覧取得',
          description: '新しい順。`content` は空文字で返す。件数は `x-total-count` ヘッダ。',
          requestParams: { query: reportListQuery },
          responses: {
            '200': {
              ...jsonResponse('一覧', reportListSchema),
              headers: z.object({
                'x-total-count': z.string().meta({ description: '総件数' }),
              }),
            },
            '500': jsonResponse('サーバーエラー', errorSchema),
          },
        },
        post: {
          tags: ['reports'],
          summary: 'レポート新規作成（管理者のみ）',
          requestBody: jsonBody(reportCreateSchema),
          responses: {
            '201': jsonResponse('作成済みレポート', reportItemSchema),
            '400': jsonResponse('バリデーションエラー', validationErrorSchema),
            '401': jsonResponse('未認証 / 管理者以外', errorSchema),
            '429': jsonResponse('レートリミット超過', errorSchema),
            '500': jsonResponse('サーバーエラー', errorSchema),
          },
        },
      },
      '/api/reports/{id}': {
        get: {
          tags: ['reports'],
          summary: 'レポート詳細取得',
          requestParams: { path: reportIdParam },
          responses: {
            '200': jsonResponse('レポート', reportItemSchema),
            '404': jsonResponse('未存在', errorSchema),
            '500': jsonResponse('サーバーエラー', errorSchema),
          },
        },
        patch: {
          tags: ['reports'],
          summary: 'レポート更新（管理者のみ・部分更新）',
          requestParams: { path: reportIdParam },
          requestBody: jsonBody(reportPatchSchema),
          responses: {
            '200': jsonResponse('更新済みレポート', reportItemSchema),
            '400': jsonResponse('バリデーションエラー', validationErrorSchema),
            '401': jsonResponse('未認証 / 管理者以外', errorSchema),
            '404': jsonResponse('未存在', errorSchema),
            '429': jsonResponse('レートリミット超過', errorSchema),
            '500': jsonResponse('サーバーエラー', errorSchema),
          },
        },
        delete: {
          tags: ['reports'],
          summary: 'レポート削除（管理者のみ）',
          requestParams: { path: reportIdParam },
          responses: {
            '200': jsonResponse('削除成功', okSchema),
            '401': jsonResponse('未認証 / 管理者以外', errorSchema),
            '404': jsonResponse('未存在', errorSchema),
            '429': jsonResponse('レートリミット超過', errorSchema),
            '500': jsonResponse('サーバーエラー', errorSchema),
          },
        },
      },
      '/api/tags': {
        get: {
          tags: ['tags'],
          summary: 'タグ一覧取得',
          responses: {
            '200': jsonResponse('タグ名の配列（昇順）', tagListSchema),
            '500': jsonResponse('サーバーエラー', errorSchema),
          },
        },
      },
      '/api/auth/admin': {
        get: {
          tags: ['auth'],
          summary: '管理者判定',
          description: 'Bearer トークンを検証し ADMIN_EMAIL と照合する。',
          responses: {
            '200': jsonResponse('判定結果', isAdminSchema),
            '401': jsonResponse('未認証 / トークン無効', isAdminSchema),
            '429': jsonResponse('レートリミット超過', errorSchema),
          },
        },
      },
      '/api/auth/is-allowed': {
        post: {
          tags: ['auth'],
          summary: '許可メール判定',
          description: 'local モードは body.email、supabase モードは Bearer トークンを検証する。',
          requestBody: jsonBody(isAllowedRequestSchema),
          responses: {
            '200': jsonResponse('判定結果', isAllowedSchema),
            '401': jsonResponse('未認証 / トークン無効', isAllowedSchema),
            '429': jsonResponse('レートリミット超過', errorSchema),
            '500': jsonResponse('サーバー設定不備', isAllowedSchema),
          },
        },
      },
    },
  });
