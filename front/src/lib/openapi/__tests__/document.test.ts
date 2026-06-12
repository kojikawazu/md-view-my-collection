import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument } from '../document';

describe('buildOpenApiDocument', () => {
  const doc = buildOpenApiDocument('1.2.3');

  // --- 正常系 ---

  it('should generate an OpenAPI 3.1 document (N-1)', () => {
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.version).toBe('1.2.3');
  });

  it('should expose all API paths (N-2)', () => {
    expect(Object.keys(doc.paths ?? {})).toEqual(
      expect.arrayContaining([
        '/api/reports',
        '/api/reports/{id}',
        '/api/tags',
        '/api/auth/admin',
        '/api/auth/is-allowed',
      ]),
    );
  });

  it('should register report schemas as components (N-3)', () => {
    const schemas = doc.components?.schemas ?? {};
    expect(schemas).toHaveProperty('ReportCreateRequest');
    expect(schemas).toHaveProperty('ReportItem');
    expect(schemas).toHaveProperty('ValidationErrorResponse');
  });

  // --- 準正常系 ---

  it('should mark create-request required fields (S-1)', () => {
    const create = doc.components?.schemas?.ReportCreateRequest as { required?: string[] };
    expect(create.required).toEqual(
      expect.arrayContaining(['title', 'content', 'category', 'author', 'tags']),
    );
  });

  it('should render category as a fixed enum (S-2)', () => {
    const create = doc.components?.schemas?.ReportCreateRequest as {
      properties?: { category?: { enum?: string[] } };
    };
    expect(create.properties?.category?.enum).toContain('AI');
  });

  it('should keep patch-request fields optional (S-3)', () => {
    const patch = doc.components?.schemas?.ReportPatchRequest as { required?: string[] };
    expect(patch.required).toBeUndefined();
  });
});
