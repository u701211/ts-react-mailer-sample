/**
 * PageState(どのViewを表示するかを決定するstate)のためのStateです。
 * 下記の目的で存在します。
 * ・ 目的を切り出すことで。Pageあたり一回の使用に限定することで、テストコードにおけるMock化を容易にする。
 * ・ Pageから各Viewへ引き渡すことを前提とするため、stateとsetStateをラッピング
 */

import lodash from 'lodash';
import React from 'react';

/**
 * PageState
 */
export interface PageState<T>{
  /** stateのデータにアクセスする。 */
  data: T;
  /** dataへの変更を確定し、stateを更新する。 */
  save: () => void;
  /** dataへの変更をリセットする。 */
  reset: () => void;
}

class PageStateImple<T> implements PageState<T>{
  private state: T;
  private setState: (value: T) => void;
  constructor(state: T, setState: (value: T) => void){
    this.state = state;
    this.setState = setState;
    this.data = lodash.isObject(this.state) ? lodash.cloneDeep(this.state) : this.state;
  }
  data: T;
  save(){
    this.setState(this.data);
  };
  reset(){
    this.data = lodash.isObject(this.state) ? lodash.cloneDeep(this.state) : this.state;
  };
  
}
/**
 * PageStateを使用する。
 * @param initializeData 初期のstate
 * @returns 
 */
export function usePageState<T>(initializeData: T): PageState<T>{
  const [state, setState] = React.useState(intercept.usePageStateInitialize(initializeData));
  return new PageStateImple(state, setState);
}
/**
 * テストコード(jest)に対して、spyOnで動作を変更させるためのインターセプタとなるポイントを集めたオブジェクト。
 * 本コードで利用はしない。
 */
export const intercept = {
  /**
   * usePageStateが、ステートの初期値を決定するときにラップするメソッド。
   * Mock化して別の値を返すことで、usePageStateで生成される初期値のstateを変更することができる。
   * @param initializeData 
   * @returns 
   */
  usePageStateInitialize:<T>(initializeData: T) => {
    return initializeData;
  }
}