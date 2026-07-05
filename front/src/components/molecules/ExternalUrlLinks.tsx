'use client';

import React from 'react';
import { ExternalUrlItem } from '@/types';

interface ExternalUrlLinksProps {
  /** 表示する外部URLの配列。空なら何も描画しない。 */
  urls: ExternalUrlItem[];
  /** 見出しへ付与する追加クラス。 */
  labelClassName?: string;
  /** 各リンクへ付与する追加クラス。 */
  linkClassName?: string;
}

/** レポート詳細の外部リンク一覧を表示する。URLが無ければ描画しない。各リンクは別タブ（`rel=noopener`）で開く。 */

const ExternalUrlLinks: React.FC<ExternalUrlLinksProps> = ({
  urls,
  labelClassName,
  linkClassName,
}) => {
  // URLが1件も無ければ見出しごと非表示にする。
  if (urls.length === 0) return null;

  return (
    <div>
      <h4 className={`text-xs uppercase tracking-widest mb-4 ${labelClassName ?? ''}`}>
        External Links
      </h4>
      <ul className="space-y-2">
        {urls.map((eu) => (
          <li key={eu.id}>
            <a
              href={eu.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm hover:underline ${linkClassName ?? ''}`}
            >
              {eu.label || eu.url}
              <span className="ml-1 text-xs opacity-50">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExternalUrlLinks;
