import { v4 as uuid } from 'uuid';

/** windowオブジェクト上のcallbackメソッドの名前 */
const CALLBACK_NAME = "__nativecallback";

/**  windowオブジェクト上のsuppoetedCommandsの名前 */
const SUPPORTED_COMMANDS_NAME = "__suppoetedCommands";

/** Nativge側で設定するjavascriptChannelの名前 */
const JAVACRIPT_CHANNEL_NAME = "__javascriptChannel"; 
/**
 * javascriptChannelのインターフェース
 */
interface JavascriptChannel{
  postMessage(message: string): void;
}

/**
 * JavascriptChannelをNaticeなしで動かすためのMock
 */
export class JavascriptChannelMock implements JavascriptChannel{
  constructor(){
    //■SUPPORTED_COMMANDS_NAME対応
    (window as any)[SUPPORTED_COMMANDS_NAME] = ["getQrStringFromCamera"];
  }
  postMessage(message: string): void {
    window.setTimeout(() => {
      const callback: (requestId: string, result: any) => void = (window as any)[CALLBACK_NAME] as (requestId: string, result: any) => void;
      const request = JSON.parse(message) as {
        command: string,
        requestId: string,
        parameters: any
      };
      const result: any = (() => {
        switch(request.command){
          case "getQrStringFromCamera":
            return `QRコードの読み取り結果(${request.requestId})`;
          default: throw Error(`サポートされないcommandが指定されました。command=${request.command}`);
        }
      })();
      callback(request.requestId, result);
    }, 100);
  }

}
/**
 * Nativeから設定されているjavascriptChannelを取得する。
 * jestでのモック化を考慮して、公開関数化。
 * @returns 
 */
export function getJavascriptChannel(){
  return  (window as any)[JAVACRIPT_CHANNEL_NAME] as JavascriptChannel;
  //return new JavascriptChannelMock();
}
const javascriptChannel = getJavascriptChannel();

/**
 * 完了していないリクエストを保持する。
 */
interface Request{
  requestId: string, 
  resolve: (value: any) => void,
  onCallbacked? : (value: any) => any;
}
let requestStak: Request[] = [];

/**
 * リクエストを登録し、Nativeに送信する。 
 * @param command コマンド(処理内容)を表す文字列。Native側と連携して定義
 * @param parameters コマンドに応じたパラメータ。
 * @returns 実行中(前)のPromise
 */
function postMessage(command: string, parameters: object, onCallbacked?: (value: any) => any): Promise<any>{
  return new Promise<any>((resolve) => {
    //■requestIdの採番
    const requestId = uuid();

    //■requestIdとresolveをStackに登録
    requestStak.push({
      requestId: requestId,
      resolve: resolve,
      onCallbacked: onCallbacked,
    });

    //■Nativeに送信
    javascriptChannel.postMessage(JSON.stringify({
      command: command,
      requestId: requestId,
      parameters: parameters
    }));
  });  
}

/**
 * 
 * 
 * Nativeからリクエストの完了を受け付ける関数。
 * windowオブジェクトに登録する。
 * @param requestId 
 * @param result 
 */
function callback(requestId: string, result: any){
  //■stackからリクエストの取得
  const request = requestStak.find(item => item.requestId === requestId);
  if(request == null){
    throw Error(`request stackに存在しないcallbackが呼ばれました。requestId=${requestId}`);
  }

  //■stackからリクエストを削除
  requestStak = requestStak.filter(item => item.requestId !== requestId);

  //■リクエストを完了させる。
  request.resolve(request.onCallbacked != null ? request.onCallbacked(result) : result);
}

/**
 * クライアントに公開するインターフェイス
 */
export interface NativeProxy{
  /**Ntiveアプリかどうか */
  isNative : boolean;

  /** サポートするコマンドの一覧を取得する */
  getSupportedCommands(): string[];
  
  /** カメラを起動し、QRコードの解析結果を返す。undefiendを返した場合、撮影のキャンセル。*/
  getQrStringFromCamera(): Promise<string | undefined>;

  commandA(): Promise<{text: string}>;


}

/**
 * Nativeアプリ内で動作するときの、NativeProxyの実装
 */
class NativeProxyImple implements NativeProxy{
  constructor(){
    this.isNative = true;


  }
  
  isNative: boolean;
  getSupportedCommands(): string[]{
    return (window as any)[SUPPORTED_COMMANDS_NAME] != null ? (window as any)[SUPPORTED_COMMANDS_NAME]  as string[] : [];
  }
  getQrStringFromCamera(): Promise<string | undefined> {
    return postMessage("getQrStringFromCamera", {}, (value) => value === null ? undefined : value) as Promise<string | undefined>;
  }
  commandA(): Promise<{text: string}> {
    return postMessage("a", {text: "hoge"}) as Promise<{text: string}>;
  }
}

/**
 * ブラウザで動作するときの、NativeProxyの実装
 */
 class NativeProxyDummy implements NativeProxy{
  constructor(){
    this.isNative = false;
  }
  commandA(): Promise<{text: string}> {
    throw new Error('Method not implemented.');
  }
  isNative: boolean;
  getSupportedCommands(): string[] {
    return [];
  }

  getQrStringFromCamera(): Promise<string | undefined> {
    throw Error("サポートされていません。");
  }
}
/** クライアントに公開するオブジェクト */
export const nativeProxy: NativeProxy = (() => {
  //■nativeProxyをインスタンス化
  const result = javascriptChannel != null ? new NativeProxyImple() : new NativeProxyDummy();
  
  //■その他の初期化
  if(javascriptChannel != null){
    //**Native側のevaluateJavascriptで使用する__nativecallbackを設定 */
    (window as any)[CALLBACK_NAME] = callback;
  }

  return result;
})();

