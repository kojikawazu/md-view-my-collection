import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildOpenApiDocument } from '@/lib/openapi/document';

/**
 * zod スキーマから OpenAPI ドキュメントを生成し、`docs/openapi.json` に出力する。
 *
 * 実行: `pnpm gen:openapi`（front/ ディレクトリ）
 */

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')) as {
  version: string;
};

const document = buildOpenApiDocument(pkg.version);
const outPath = resolve(process.cwd(), '../docs/openapi.json');

writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf-8');

console.info(`[gen:openapi] wrote ${outPath}`);
