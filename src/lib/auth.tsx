/**
 * 認証関係をまとめたライブラリ。ただし、Auth0による実装。
 * Auth0は本モジュールで隠ぺいする。
 */
import React from 'react';
/**
 * ログイン情報を格納するラッパー
 */
export interface Authentication{

  /**
   * ログインする
   */
  login(): Promise<void>;

  /**
   * ログアウトする
   */
  logout(): void;

  /**
   * アクセストークンを取得する。
   */
  getAccessToken(): Promise<string>;

  /**
   * ログイン済みかどうかを取得する
   */
  readonly isAuthenticated: boolean;

  /**
   * 認証処理中かどうかを取得する。
   */
  readonly isLoading: boolean;
}

class AuthenticationImple implements Authentication{

  constructor(){
    this.isAuthenticated = true;
    this.isLoading = false;
  }

  login(): Promise<void> {
    throw Error("実装されていません。");
  }

  logout(){
    throw Error("実装されていません。");
  }

  async getAccessToken(){
    return "hoge";
  }
  readonly isAuthenticated: boolean;

  readonly isLoading: boolean;
}


/** ログインプロバイダ */
export const LoginProvider = function(

  props: {
    children: React.ReactNode
  }
) 
{

  return (
    <>
      {props.children}
    </>
  );
}

/**
 * 
 * @param autologin trueの場合、ログインしていない時は、ログイン画面に遷移する。
 * @returns 
 */
export function useAuthentication(autologin?: boolean): Authentication{
  

  return new AuthenticationImple();
}