'use client';

import React from 'react';
import ExternalUrlInput from './ExternalUrlInput';
import { ExternalUrlInput as ExternalUrlInputType } from '@/types';

interface ExternalUrlFieldListProps {
  /** 編集中の外部URL入力行の配列。index が各行の識別子を兼ねる。 */
  urls: ExternalUrlInputType[];
  /** フィールド単位のエラー。キーは `externalUrls.{index}.url` / `externalUrls.{index}.label` 形式で各行に紐付く。 */
  fieldErrors?: Record<string, string>;
  /** 「+ URL追加」押下時に呼ぶ。新しい空行の追加を親に委ねる。 */
  onAdd: () => void;
  /** 行の削除ボタン押下時に呼ぶ。引数は対象行の index。 */
  onRemove: (index: number) => void;
  /** URL入力変更時に呼ぶ。引数は対象行の index と新しい値。 */
  onChangeUrl: (index: number, value: string) => void;
  /** ラベル入力変更時に呼ぶ。引数は対象行の index と新しい値。 */
  onChangeLabel: (index: number, value: string) => void;
  /** 見出しへ付与する追加クラス。 */
  labelClassName?: string;
  /** 各入力の枠線クラス。子の ExternalUrlInput に委譲する。 */
  borderClass?: string;
  /** 各入力の角丸クラス。子の ExternalUrlInput に委譲する。 */
  borderRadiusClass?: string;
}

/** 外部URL入力行のリスト。各行を ExternalUrlInput で描画し、追加/削除/変更を親コールバックへ委ねる。 */

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
    <h3 className={`text-xs uppercase tracking-widest ${labelClassName ?? ''}`}>External Links</h3>
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
