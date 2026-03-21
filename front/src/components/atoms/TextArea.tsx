'use client';

import React from 'react';

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`w-full bg-white focus:outline-none ${className}`}
      {...props}
    />
  );
};

export default TextArea;
