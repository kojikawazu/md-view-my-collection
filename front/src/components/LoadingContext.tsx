'use client';

import React, { createContext, useContext } from 'react';

type LoadingContextValue = {
  startLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const LoadingProvider = ({
  value,
  children,
}: {
  value: LoadingContextValue;
  children: React.ReactNode;
}) => <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};
