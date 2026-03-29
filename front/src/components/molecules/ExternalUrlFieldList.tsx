'use client';

import React from 'react';
import ExternalUrlInput from './ExternalUrlInput';
import { ExternalUrlInput as ExternalUrlInputType } from '@/types';

interface ExternalUrlFieldListProps {
  urls: ExternalUrlInputType[];
  fieldErrors?: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChangeUrl: (index: number, value: string) => void;
  onChangeLabel: (index: number, value: string) => void;
  labelClassName?: string;
  borderClass?: string;
  borderRadiusClass?: string;
}

const ExternalUrlFieldList: React.FC<ExternalUrlFieldListProps> = ({
  urls,
  fieldErrors,
  onAdd,
  onRemove,
  onChangeUrl,
  onChangeLabel,
  labelClassName,
  borderClass,
  borderRadiusClass,
}) => (
  <div className="space-y-4">
    <h3 className={`text-xs uppercase tracking-widest ${labelClassName ?? ''}`}>
      External Links
    </h3>
    {urls.map((eu, i) => (
      <ExternalUrlInput
        key={i}
        url={eu.url}
        label={eu.label}
        urlError={fieldErrors?.[`externalUrls.${i}.url`]}
        labelError={fieldErrors?.[`externalUrls.${i}.label`]}
        onChangeUrl={(v) => onChangeUrl(i, v)}
        onChangeLabel={(v) => onChangeLabel(i, v)}
        onRemove={() => onRemove(i)}
        borderClass={borderClass}
        borderRadiusClass={borderRadiusClass}
      />
    ))}
    <button
      type="button"
      onClick={onAdd}
      className="text-sm font-bold text-[#3d2b1f] hover:opacity-70 transition-opacity"
    >
      + URL追加
    </button>
  </div>
);

export default ExternalUrlFieldList;
