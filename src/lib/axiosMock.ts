import { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from "axios";


/**
 * 最も粒度の小さいMock動作を表すインターフェイス。
 */
export interface ApiMock{
  /**
   * モックの名前
   */
  name: string;
  /**
   * 引数のrequestに対し、該当のexecuteを実行するかどうか判断するメソッド
   */
  condition: (request: AxiosRequestConfig) => boolean,
  /**
   * 該当のrequestに対し、動作をエミュレーションして、AxiosResponseを返すメソッド。
   */
  execute: (request: AxiosRequestConfig) => AxiosResponse<any, any>
}

/**
 * AxiosAdapterBuilderを生成するBuilder
 */
export class AxiosAdapterBuilder{
  private mocks: ApiMock[] = [];
  
  /**
   * Mockを登録する。
   * @param mock 登録するMock
   */
  append(mock: ApiMock){
    //■既に登録されている名前なら無視する。
    if(this.mocks.find(item => item.name === mock.name) != null){
      return;
    } 
    //※後に追加したMockを有効にするため、unshiftで先頭に追加する。
    this.mocks.unshift(mock);
  }

  find(name: string){
    return this.mocks.find(item => item.name === name);
  }
  /**
   * AxiosAdapterを作成する。
   * @returns 登録されたMock動作を包括したAxiosAdapter
   */
  build(): AxiosAdapter{
    return ((request: AxiosRequestConfig) => {
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          const mock = this.mocks.find(item => item.condition(request));
          if(mock != null){
            const result = mock.execute(request);
            //■ログ出力
            console.debug("AxiosMock", mock.name, request, result);
            if(result != null){
              resolve(result);
              return;
            }
          }
          //■処理するアダプタがなければ、not found
          resolve(
            {
              status: 404,
            } as AxiosResponse
          )
        }, 100);
      });
    });
  }
}