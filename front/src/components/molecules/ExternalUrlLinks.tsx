'use client';

import React from 'react';
import { ExternalUrlItem } from '@/types';

interface ExternalUrlLinksProps {
  urls: ExternalUrlItem[];
  labelClassName?: string;
  linkClassName?: string;
}

const ExternalUrlLinks: React.FC<ExternalUrlLinksProps> = ({
  urls,
  labelClassName,
  linkClassName,
}) => {
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
