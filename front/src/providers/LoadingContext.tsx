'use client';

// 画面遷移時に表示するグローバルなローディングオーバーレイを、
// 任意のコンポーネントから起動できるようにする軽量コンテキスト。
// 実際の表示状態やタイマー制御は AppShell 側（`startLoading` の実体）が持ち、
// ここは「起動の合図を伝搬する」導管に徹する。

import React, { createContext, useContext } from 'react';

/** ローディング開始トリガーのみを公開する最小のコンテキスト値。 */
type LoadingContextValue = {
  /** グローバルローディング表示を開始する。 */
  startLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

/**
 * `startLoading` を配下ツリーへ供給するプロバイダー。
 *
 * 表示ロジック本体を持たず、上位（AppShell）から渡された `value` をそのまま流すだけの
 * 薄いラッパー。ローディング制御の実装を差し替えても子側のインターフェースを保てる。
 */
export const LoadingProvider = ({
  value,
  children,
}: React.PropsWithChildren<{
  value: LoadingContextValue;
}>) => <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;

/**
 * ローディング開始関数を取得するフック。
 *
 * プロバイダー外で呼ばれても壊れないよう、その場合は no-op の `startLoading` を返す。
 * これにより「ローディング制御が不要／未提供な文脈でも安全に呼べる」ことを保証する
 * （例: プロバイダーで包まれないテストや単独レンダリング時に例外を投げない）。
 *
 * @returns ローディング開始関数を持つオブジェクト。プロバイダー外では no-op を返す
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  return context ?? { startLoading: () => {} };
};
