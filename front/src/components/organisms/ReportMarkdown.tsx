'use client';

import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

/** Markdown レポート表示の props。 */
interface ReportMarkdownProps {
  /** 表示対象の Markdown 本文 */
  content: string;
  /** 見た目のバリアント（スタイル切り替え用のクラス接尾辞）。既定は `v7` */
  variant?: 'v7';
  /** ルート要素へ付与する追加クラス名 */
  className?: string;
}

/**
 * React 要素の子を素朴なプレーンテキストへ平坦化する。
 * 文字列・数値・`<br>`（改行に変換）のみを許容し、それ以外の要素が含まれる場合は
 * 「単純な段落ではない」と判断して `null` を返す（後段の箇条書き変換をスキップさせるため）。
 *
 * @param children - 段落 `<p>` がレンダリングする子ノード
 */
const toPlainText = (children: React.ReactNode): string | null => {
  const nodes = React.Children.toArray(children);
  let text = '';

  for (const node of nodes) {
    if (typeof node === 'string' || typeof node === 'number') {
      text += String(node);
      continue;
    }
    if (React.isValidElement(node) && node.type === 'br') {
      text += '\n';
      continue;
    }
    return null;
  }
  return text;
};

/**
 * 全行が全角中点「・」で始まる段落を、箇条書き（li）項目の配列へ変換する。
 * Markdown 標準のリスト記法ではなく「・」書きで箇条書きされた原稿を、
 * 見た目上のリストとして描画するための独自変換。1 行でも「・」始まりでない行が
 * あれば箇条書きとみなさず `null` を返し、通常の段落として扱わせる。
 *
 * @param text - 段落のプレーンテキスト（`toPlainText` で平坦化済み）
 */
const parseDotListItems = (text: string): string[] | null => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const items = lines.map((line) => {
    const matched = line.match(/^・\s*(.+)$/);
    return matched?.[1]?.trim() ?? null;
  });

  if (items.some((item) => !item)) return null;
  return items as string[];
};

/** セクションの種類。`normal` 以外はコールアウト（強調ボックス）として描画される。 */
type SectionKind = 'normal' | 'summary' | 'warning' | 'trend';

// 見出しテキストから特別セクション（まとめ / 注意 / 動向）を判定するためのパターン。
// 見出し語に以下のキーワードを含む h2 を、対応するコールアウト種別として扱う。
const SUMMARY_RE = /(まとめ|総括|示唆|サマリー|サマリ)/;
const WARNING_RE = /(注意点|注意事項|懸念|リスク)/;
const TREND_RE = /(トレンド|動向|傾向)/;

/**
 * 見出しテキストからセクション種別を判定する。
 * まとめ→注意→動向の優先順で最初に一致した種別を返し、いずれにも該当しなければ `normal`。
 *
 * @param heading - h2 見出しの行テキスト
 */
const classifyHeading = (heading: string): SectionKind => {
  if (SUMMARY_RE.test(heading)) return 'summary';
  if (WARNING_RE.test(heading)) return 'warning';
  if (TREND_RE.test(heading)) return 'trend';
  return 'normal';
};

/**
 * 本文を h2（## …）境界で分割し、各セクションを種類付きで返す。
 *
 * @param content - 分割対象の Markdown 本文
 */
const splitSections = (content: string): { kind: SectionKind; content: string }[] => {
  const lines = content.split('\n');
  const sections: { kind: SectionKind; lines: string[] }[] = [];
  let current: { kind: SectionKind; lines: string[] } = { kind: 'normal', lines: [] };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      sections.push(current);
      current = { kind: classifyHeading(line), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  return sections
    .map((section) => ({ kind: section.kind, content: section.lines.join('\n') }))
    .filter((section) => section.content.trim().length > 0);
};

/**
 * react-markdown のノード別描画をカスタマイズする定義。
 * 段落は「・」書き箇条書きを検出した場合のみ ul へ差し替える（それ以外は素の段落）。
 */
const markdownComponents: Components = {
  p: ({ children }) => {
    const text = toPlainText(children);
    if (!text) return <p>{children}</p>;

    const dotListItems = parseDotListItems(text);
    if (!dotListItems) return <p>{children}</p>;

    return (
      <ul className="dot-bullet-list">
        {dotListItems.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  },
};

/**
 * Markdown 断片を React 要素へ描画する。
 * GFM（remark-gfm）を有効化しつつ、`rehypeSanitize` で必ずサニタイズして
 * ユーザー入力由来の生 HTML による XSS を防ぐ（デフォルトスキーマ使用）。このサニタイズは必須。
 *
 * @param content - 描画対象の Markdown 断片
 */
const renderMarkdown = (content: string) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSanitize]}
    components={markdownComponents}
  >
    {content}
  </ReactMarkdown>
);

/** `normal` 以外のセクション種別を、対応するコールアウト用 CSS クラスへ対応づける。 */

const CALLOUT_CLASS: Record<Exclude<SectionKind, 'normal'>, string> = {
  summary: 'report-callout report-callout--summary',
  warning: 'report-callout report-callout--warning',
  trend: 'report-callout report-callout--trend',
};

/**
 * レポート本文の Markdown を描画するビューア。
 * 本文を h2 見出しでセクション分割し、見出し語から判定した種別（まとめ/注意/動向）の
 * セクションはコールアウト（強調ボックス）で囲んで描画する。描画はすべて `rehypeSanitize`
 * 経由でサニタイズされる。
 */
const ReportMarkdown: React.FC<ReportMarkdownProps> = ({
  content,
  variant = 'v7',
  className = '',
}) => {
  const sections = splitSections(content);

  return (
    <div className={`report-markdown report-markdown--${variant} ${className}`.trim()}>
      {sections.map((section, index) => {
        const rendered = renderMarkdown(section.content);
        if (section.kind === 'normal') {
          return <React.Fragment key={index}>{rendered}</React.Fragment>;
        }
        return (
          <section key={index} className={CALLOUT_CLASS[section.kind]}>
            {rendered}
          </section>
        );
      })}
    </div>
  );
};

export default ReportMarkdown;
