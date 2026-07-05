'use client';

import React from 'react';
import Badge from '@/components/atoms/Badge';

interface ReportCardMetaProps {
  /** カテゴリ名。バッジで表示する。 */
  category: string;
  /** 表示用の日付文字列（整形済みを渡す前提）。 */
  date: string;
  /** バッジへ付与する追加クラス。 */
  badgeClassName?: string;
  /** 日付テキストへ付与する追加クラス。 */
  dateClassName?: string;
}

/** レポートカードのメタ情報行。カテゴリバッジと日付を横並びで表示する。 */

const ReportCardMeta: React.FC<ReportCardMetaProps> = ({
  category,
  date,
  badgeClassName = '',
  dateClassName = '',
}) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <Badge className={badgeClassName}>{category}</Badge>
      <span className={`text-xs ${dateClassName}`}>{date}</span>
    </div>
  );
};

export default ReportCardMeta;
