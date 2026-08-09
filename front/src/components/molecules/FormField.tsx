'use client';

import React, { useId } from 'react';
import SectionLabel from '@/components/atoms/SectionLabel';

interface FormFieldProps {
  /** ラベル文言。 */
  label: string;
  /** ラベルへ付与する追加クラス。 */
  labelClassName?: string;
  /** エラーメッセージ。あるときのみ入力の下に赤字で表示する。 */
  error?: string | null;
  /** 入力要素を返すレンダープロップ。引数の id をラベルと入力の紐付け（htmlFor/id）に使う。 */
  children: (id: string) => React.ReactNode;
}

/** ラベル＋入力＋エラーを縦に並べるフォーム部品。`useId` で採番した id を children に渡しラベルと入力を関連付ける。 */

const FormField: React.FC<FormFieldProps> = ({ label, labelClassName = '', error, children }) => {
  const id = useId();

  return (
    <div className="space-y-2">
      <SectionLabel htmlFor={id} className={labelClassName}>
        {label}
      </SectionLabel>
      {children(id)}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

export default FormField;
