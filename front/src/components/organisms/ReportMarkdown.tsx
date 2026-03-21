'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
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

const ReportMarkdown: React.FC<ReportMarkdownProps> = ({ content, variant = 'v7', className = '' }) => {
  return (
    <div className={`report-markdown report-markdown--${variant} ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ReportMarkdown;
