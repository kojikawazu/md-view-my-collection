import { useState } from 'react';

/** ページング挙動の調整オプション。 */
interface UsePaginationOptions {
  /** 1 ページあたりの件数（既定 10）。 */
  itemsPerPage?: number;
  /** 表示するページ番号ボタンの最大数（既定 5）。 */
  maxPageButtons?: number;
}

/** ページング状態と、それを操作する関数。 */
type UsePaginationResult = {
  /** 表示中のページ番号（1 始まり）。総ページ数でクランプ済みのため範囲外にならない */
  currentPage: number;
  /** 総ページ数。0 件でも 1 を返す（ページ番号の計算を破綻させないため） */
  totalPages: number;
  /** ページ番号ボタンとして表示する番号の並び。現在ページを中央に寄せ、最大 `maxPageButtons` 件 */
  pageNumbers: number[];
  /** 表示ページを変更する。範囲外の値は [1, 総ページ数] にクランプされる */
  updatePage: (nextPage: number) => void;
  /** 全件配列から現在ページ分だけを切り出す。API の再取得は伴わない（クライアント側ページング） */
  paginateSlice: <T>(items: T[]) => T[];
};

/**
 * 一覧のページング状態を管理するフック。
 *
 * `filterKey` が現在の状態と異なる場合は自動的に 1 ページ目へ戻す。これにより
 * 「カテゴリ/タグのフィルタを変えたらページを 1 に戻す」挙動を、明示的なリセット呼び出しなしで実現する
 * （state に `page` と一緒に `filterKey` を持たせ、レンダー時に比較する）。
 * `currentPage` は総ページ数でクランプするため、件数が減っても範囲外にならない。
 *
 * @param totalItems 全アイテム数（総ページ数の算出に使う）
 * @param filterKey 現在のフィルタを表す文字列。変化すると 1 ページ目へリセットする
 * @param options 1 ページ件数・ページ番号ボタン数の上書き
 * @returns ページング状態と操作関数
 */
export const usePagination = (
  totalItems: number,
  filterKey: string,
  options: UsePaginationOptions = {},
): UsePaginationResult => {
  const { itemsPerPage = 10, maxPageButtons = 5 } = options;
  const [paginationState, setPaginationState] = useState(() => ({
    page: 1,
    filterKey,
  }));

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  // 0 件でも 1 ページ扱いにして、ページ番号や範囲計算が破綻しないようにする。
  const safeTotalPages = Math.max(1, totalPages);
  // filterKey が変わっていれば 1 ページ目に戻す。同じなら保存中のページを上限でクランプする。
  const currentPage =
    paginationState.filterKey === filterKey ? Math.min(paginationState.page, safeTotalPages) : 1;

  // 現在ページを中央に寄せつつ、先頭/末尾でボタン列が範囲外へはみ出さないよう始点を決める。
  const pageStart = Math.max(
    1,
    Math.min(currentPage - Math.floor(maxPageButtons / 2), safeTotalPages - maxPageButtons + 1),
  );
  const pageEnd = Math.min(safeTotalPages, pageStart + maxPageButtons - 1);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index);

  /**
   * 表示ページを更新する。範囲外の値は [1, 総ページ数] にクランプする。
   *
   * @param nextPage 遷移先ページ番号
   */
  const updatePage = (nextPage: number) => {
    setPaginationState({
      page: Math.min(Math.max(nextPage, 1), safeTotalPages),
      filterKey,
    });
  };

  /**
   * 配列から現在ページ分だけを切り出す。
   *
   * @param items ページングしたい全アイテム配列
   * @returns 現在ページに対応する要素のみを含む配列
   */
  const paginateSlice = <T,>(items: T[]): T[] => {
    return items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  };

  return {
    currentPage,
    totalPages: safeTotalPages,
    pageNumbers,
    updatePage,
    paginateSlice,
  };
};
