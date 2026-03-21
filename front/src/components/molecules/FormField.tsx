'use client';

import React, { useId } from 'react';
import SectionLabel from '@/components/atoms/SectionLabel';

interface FormFieldProps {
  label: string;
  labelClassName?: string;
  error?: string | null;
  children: (id: string) => React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  labelClassName = '',
  error,
  children,
}) => {
  const id = useId();

  return (
    <div className="space-y-2">
      <SectionLabel htmlFor={id} className={labelClassName}>{label}</SectionLabel>
      {children(id)}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

export default FormField;
