/**
 * ページネーションに必要な機能を集約したライブラリ 
 * 前提として、下記の仕様に従うものとして、クエリパラメータとAPIをつなぐもの。
 * ・URLは、クエリパラメータpageに、1から始まる整数で頁を指定する。
 * ・APIは、クエリパラメータlimit,offsetで取得対象を指定する。
 * ・APIは、レスポンスヘッダContent-Range: items <range-start>-<range-end>/<size>でページ情報を返却する。ただし、指定されたlimit,offsetと一致しないことがありうる(存在しない頁を指定された場合)
 * 
*/
import { AxiosResponse } from 'axios';
import React from 'react';
import { useQueryState } from './queryState';

/**
 * クライアントに提供する頁のコントローラ
 */
export type PaginationController = {
  /** 現在のOffset */
  offset: number,
  /** 現在の頁 */
  page: number,

  /** ページ数 */
  pageCount?: number;

  /** API実行後、そのContent-Rangeヘッダを登録する */
  setResponse: (response: AxiosResponse<any, any>) => void,

  /**頁を切り替える */
  go: (page: number) => void;

  /**指定された頁のoffsetを取得する。
   */
  getOffset: (page: number) => number;
}



export function usePaginationController(sizeInPage: number): PaginationController{
  const [page, setPage] = useQueryState("page", value => value == null ? 1 : !isNaN(Number(value)) && Number(value) > 0 ? Number(value) : 1);
  const [pageCount, setPageCount] = React.useState<number | undefined>(undefined);


  //■結果の生成
  const result = {
    offset: (page - 1) * sizeInPage,
    page: page,
    pageCount: pageCount,
    setResponse: (response: AxiosResponse<any, any>) => {
      if(response.headers == null)throw Error("レスポンスヘッダがありません");
      const contentRange = response.headers["Content-Range"];
      if(contentRange == null)throw Error("Content-Rangeヘッダがありません");
      const parsed = parseContentRange(contentRange);

      if(parsed != null){
        setPage(Math.floor(parsed.offset / sizeInPage) + 1);
        setPageCount(Math.floor(parsed.size / sizeInPage) + 1);
      }
    },
    go: (page: number) => {
      setPage(page);
    },
    getOffset: (page: number) => (page - 1) * sizeInPage,
  };

  return result;
}

/**
 * Content-Rangeを解析する。
 * @param contentRange Content-Rangeヘッダの値。
 * @returns Content-Rangeの解析結果。書式が不正な場合は、undefinedを返す。
 */
function parseContentRange(contentRange: string){
  if(contentRange == null)return undefined;

  const result = contentRange.trim().match(/^items (?<rangeStart>\d+)-(?<rangeEnd>\d+)\/(?<size>\d+)$/);
  return result == null || result.groups == null ? undefined : {
    offset: Number(result.groups.rangeStart),
    limit: Number(result.groups.rangeEnd) - Number(result.groups.rangeStart) + 1,
    size: Number(result.groups.size),
  };

}

