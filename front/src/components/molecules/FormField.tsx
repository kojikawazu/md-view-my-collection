'use client';

import React from 'react';
import SectionLabel from '@/components/atoms/SectionLabel';

interface FormFieldProps {
  label: string;
  labelClassName?: string;
  error?: string | null;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  labelClassName = '',
  error,
  children,
}) => {
  return (
    <div className="space-y-2">
      <SectionLabel className={labelClassName}>{label}</SectionLabel>
      {children}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

export default FormField;
