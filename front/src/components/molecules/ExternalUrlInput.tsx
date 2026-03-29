'use client';

import React from 'react';

interface ExternalUrlInputProps {
  url: string;
  label: string;
  urlError?: string;
  labelError?: string;
  onChangeUrl: (value: string) => void;
  onChangeLabel: (value: string) => void;
  onRemove: () => void;
  borderClass?: string;
  borderRadiusClass?: string;
}

const ExternalUrlInput: React.FC<ExternalUrlInputProps> = ({
  url,
  label,
  urlError,
  labelError,
  onChangeUrl,
  onChangeLabel,
  onRemove,
  borderClass,
  borderRadiusClass,
}) => (
  <div className="flex gap-2 items-start">
    <div className="flex-1 space-y-1">
      <input
        type="text"
        value={url}
        onChange={(e) => onChangeUrl(e.target.value)}
        placeholder="https://..."
        className={`w-full bg-white border ${borderClass ?? ''} p-3 text-sm focus:outline-none ${borderRadiusClass ?? ''}`}
      />
      {urlError && <p className="text-xs text-red-600">{urlError}</p>}
    </div>
    <div className="flex-1 space-y-1">
      <input
        type="text"
        value={label}
        onChange={(e) => onChangeLabel(e.target.value)}
        placeholder="ラベル（任意）"
        className={`w-full bg-white border ${borderClass ?? ''} p-3 text-sm focus:outline-none ${borderRadiusClass ?? ''}`}
      />
      {labelError && <p className="text-xs text-red-600">{labelError}</p>}
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="p-3 text-red-600 hover:text-red-800 text-sm font-bold shrink-0"
    >
      ✕
    </button>
  </div>
);

export default ExternalUrlInput;
