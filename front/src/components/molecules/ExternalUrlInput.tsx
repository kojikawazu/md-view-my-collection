'use client';

import React from 'react';

interface ExternalUrlInputProps {
  /** URL入力の現在値。 */
  url: string;
  /** ラベル入力の現在値（任意項目）。 */
  label: string;
  /** URL欄のエラーメッセージ。あるときのみ赤字で表示する。 */
  urlError?: string;
  /** ラベル欄のエラーメッセージ。あるときのみ赤字で表示する。 */
  labelError?: string;
  /** URL入力変更時に呼ぶ。引数は新しい値。 */
  onChangeUrl: (value: string) => void;
  /** ラベル入力変更時に呼ぶ。引数は新しい値。 */
  onChangeLabel: (value: string) => void;
  /** ✕ボタン押下時に呼ぶ。この行の削除を親に委ねる。 */
  onRemove: () => void;
  /** 入力欄の枠線クラス。 */
  borderClass?: string;
  /** 入力欄の角丸クラス。 */
  borderRadiusClass?: string;
}

/** 外部URL1件分の入力行。URL・ラベルの2入力と削除ボタンを並べ、各欄のエラーを直下に表示する。 */

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
