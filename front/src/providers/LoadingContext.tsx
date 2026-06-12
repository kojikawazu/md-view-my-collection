'use client';

import React, { createContext, useContext } from 'react';

type LoadingContextValue = {
  startLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const LoadingProvider = ({
  value,
  children,
}: React.PropsWithChildren<{
  value: LoadingContextValue;
}>) => <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;

export const useLoading = () => {
  const context = useContext(LoadingContext);
  return context ?? { startLoading: () => {} };
};
