import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { buildOpenApiDocument } from '@/lib/openapi/document';
import pkg from '../../../../package.json';

/**
 * OpenAPI ドキュメントを返す（管理者のみ）。
 * `/docs` の Swagger UI がこのエンドポイントを Bearer トークン付きで読み込む。
 * 契約は zod スキーマ（`lib/schemas/`）から生成され、`docs/openapi.json` と同一内容。
 *
 * @param request - 受信リクエスト（`requireAdmin` が Bearer トークンで管理者判定に使用）
 * @returns 管理者なら OpenAPI ドキュメントの JSON、非管理者なら 401/403 レスポンス
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'api/openapi');
  if (!auth.ok) return auth.response;

  return NextResponse.json(buildOpenApiDocument(pkg.version));
}
