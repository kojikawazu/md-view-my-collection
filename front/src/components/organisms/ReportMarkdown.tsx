'use client';

import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface ReportMarkdownProps {
  content: string;
  variant?: 'v7';
  className?: string;
}

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

type SectionKind = 'normal' | 'summary' | 'warning' | 'trend';

// 見出しテキストから特別セクション（結論 / 注意 / 動向）を判定する
const SUMMARY_RE = /(まとめ|総括|示唆|サマリー|サマリ)/;
const WARNING_RE = /(注意点|注意事項|懸念|リスク)/;
const TREND_RE = /(トレンド|動向|傾向)/;

const classifyHeading = (heading: string): SectionKind => {
  if (SUMMARY_RE.test(heading)) return 'summary';
  if (WARNING_RE.test(heading)) return 'warning';
  if (TREND_RE.test(heading)) return 'trend';
  return 'normal';
};

/** 本文を h2（## …）境界で分割し、各セクションを種類付きで返す。 */
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

const renderMarkdown = (content: string) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
    {content}
  </ReactMarkdown>
);

const CALLOUT_CLASS: Record<Exclude<SectionKind, 'normal'>, string> = {
  summary: 'report-callout report-callout--summary',
  warning: 'report-callout report-callout--warning',
  trend: 'report-callout report-callout--trend',
};

const ReportMarkdown: React.FC<ReportMarkdownProps> = ({ content, variant = 'v7', className = '' }) => {
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
