'use client';

import React from 'react';
import AppLink from '../AppLink';
import { DesignSystem } from '../../types';
import ReportMarkdown from '../ReportMarkdown';

interface MarkdownLabPageProps {
  theme: DesignSystem;
}

const ACTIVE_VARIANT = {
  id: 'v7',
  label: 'Pattern 07 - Code Focus',
  note: 'Selected baseline. Code contrast, quote emphasis, and URL visibility are tuned in this pattern.',
} as const;

const MARKDOWN_SAMPLE = [
  '# Quarter Strategy Snapshot',
  '',
  '## Priority Stream',
  'This block is a shared sample used to compare spacing and hierarchy across style patterns.',
  '',
  '### Checklist',
  '- Track reader focus across long paragraphs',
  '- Keep headings obvious without changing colors',
  '- Preserve code and table readability',
  '- [x] Existing style baseline captured',
  '- [ ] Final style choice pending',
  '',
  '・hoge',
  '・fuga',
  '・piyo',
  '',
  '> Strong typography should guide scanning before the reader starts parsing details.',
  '',
  'Inline code like `report.content` should stay readable in dense paragraphs.',
  '',
  '```java',
  'public static final void main() {',
  '}',
  '```',
  '',
  '```bash',
  'main() {',
  '',
  '}',
  '```',
  '',
  '```sh',
  'main() {',
  '',
  '}',
  '```',
  '',
  '```ts',
  'const RET = 0;',
  '```',
  '',
  '```md',
  '## Release Note',
  '- Keep typography aligned with theme',
  '- Compare readability between candidates',
  '```',
  '',
  '```mermaid',
  'flowchart LR',
  '  Draft[Draft] --> Review[Review]',
  '  Review --> Publish[Publish]',
  '```',
  '',
  '| Item | Owner | Status |',
  '| --- | --- | --- |',
  '| Markdown visuals | Design | Draft |',
  '| E2E regression | QA | Planned |',
  '',
  '[Project board](https://github.com/kojikawazu/md-view-my-collection/issues/31)',
  '',
  '![Local sample image](/next.svg)',
].join('\n');

const MarkdownLabPage: React.FC<MarkdownLabPageProps> = ({ theme }) => {
  const { colors, fontHeader, borderRadius } = theme;

  return (
    <section className="p-8 md:p-12">
      <div className="mx-auto mb-10 max-w-5xl">
        <AppLink href="/" className={`text-sm ${colors.muted} transition-opacity hover:opacity-70`}>
          &larr; All Reports
        </AppLink>
        <h1 className={`${fontHeader} ${colors.primary} mt-4 text-4xl font-black leading-tight md:text-5xl`}>
          Markdown Style Lab
        </h1>
        <p className={`${colors.muted} mt-4 max-w-3xl text-sm leading-relaxed md:text-base`}>
          Pattern 07 is the active baseline for tuning. Font families and palette remain fixed to the current theme.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <article className={`${colors.surface} ${colors.border} ${borderRadius} border p-5 shadow-sm md:p-6`}>
          <header className={`mb-5 border-b ${colors.border} pb-4`}>
            <p className={`${colors.muted} text-[11px] uppercase tracking-[0.2em]`}>Pattern 07</p>
            <h2 className={`${fontHeader} ${colors.primary} mt-2 text-2xl font-bold`}>{ACTIVE_VARIANT.label}</h2>
            <p className={`${colors.muted} mt-2 text-sm leading-relaxed`}>{ACTIVE_VARIANT.note}</p>
          </header>

          <ReportMarkdown content={MARKDOWN_SAMPLE} variant={ACTIVE_VARIANT.id} />
        </article>
      </div>
    </section>
  );
};

export default MarkdownLabPage;
