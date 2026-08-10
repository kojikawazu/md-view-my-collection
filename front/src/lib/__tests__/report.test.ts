import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { parseReportItem, parseReportList } from '@/lib/report';

/** API / localStorage が返す 1 件分の最小構成。各テストで必要な項目だけ上書きする。 */
const baseReport = {
  id: 'rep_1',
  title: 'Kubernetes 入門',
  summary: '要約',
  content: '# 見出し',
  category: 'Cloud',
  author: 'Editor',
  publishDate: '2024-01-15T00:00:00.000Z',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  tags: ['#Cloud'],
  externalUrls: [{ id: 'eu_1', url: 'https://example.com', label: 'Example' }],
};

describe('parseReportItem', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常: 全項目そろった値をそのまま返す', () => {
    expect(parseReportItem(baseReport)).toEqual(baseReport);
  });

  it('準正常: 監査列・要約が欠けた local モードのレコードも通し、externalUrls は空配列で補う', () => {
    const stored = {
      id: 'local-1',
      title: 'ローカル作成',
      content: '本文',
      category: 'AI',
      author: 'Guest Editor',
      tags: ['#AI'],
    };

    const parsed = parseReportItem(stored);

    expect(parsed).not.toBeNull();
    expect(parsed?.externalUrls).toEqual([]);
    expect(parsed?.createdAt).toBeUndefined();
  });

  it('異常: 固定リスト外のカテゴリは null（型の断言を実行時に裏付ける）', () => {
    expect(parseReportItem({ ...baseReport, category: 'Unknown' })).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('異常: 必須項目が欠けていれば null', () => {
    const withoutTitle: Record<string, unknown> = { ...baseReport };
    delete withoutTitle.title;
    expect(parseReportItem(withoutTitle)).toBeNull();
  });

  it('異常: オブジェクトでない値は null', () => {
    expect(parseReportItem(null)).toBeNull();
    expect(parseReportItem('report')).toBeNull();
  });
});

describe('parseReportList', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常: 全件が妥当なら全件返す', () => {
    const list = [baseReport, { ...baseReport, id: 'rep_2' }];
    expect(parseReportList(list)).toHaveLength(2);
  });

  it('準正常: 壊れた要素だけを捨て、残りは返す（1 件の混入で一覧を失わない）', () => {
    const list = [baseReport, { ...baseReport, id: 'rep_2', category: 'Unknown' }];

    const parsed = parseReportList(list);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe('rep_1');
    // 黙って減らない。捨てた事実はログに残す
    expect(console.error).toHaveBeenCalled();
  });

  it('異常: 配列でない値は空配列', () => {
    expect(parseReportList({ reports: [] })).toEqual([]);
    expect(parseReportList(null)).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('準正常: 空配列はそのまま空配列（「0 件」であり異常ではない）', () => {
    expect(parseReportList([])).toEqual([]);
  });
});
