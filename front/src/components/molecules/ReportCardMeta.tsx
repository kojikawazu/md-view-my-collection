'use client';

import React from 'react';
import Badge from '@/components/atoms/Badge';

interface ReportCardMetaProps {
  category: string;
  date: string;
  badgeClassName?: string;
  dateClassName?: string;
}

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
