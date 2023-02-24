/**
 * Rest APIのAxisosMockを作成するためのヘルパーです。
 * Rest APIを"single", "multi"の動作ケースに分けています。
 * ■single
 * 　単一のリソースを操作するAPI。
 * 　識別子となるパスパラメータはサポートせず、search(一覧取得のget),post,deleteをサポートしません。
 * ■multi
 * 　複数リソースを操作するAPI
 * 　識別子となるパスパラメータをサポートし、search,post,deleteもサポートします。
 */

import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from "axios";
import lodash from "lodash";
import { ApiMock } from "./axiosMock";




/**
 * RestApiMockの動作を決定するプロパティ
 */
 interface RestApiMockProps<T>{
  /**
   * search, postのとき、このMockの処理対象となるURLのパスに対する文字列か、正規表現。
   */
  rootPath: RegExp;
  supportedTypes: ("get" | "post" | "put" | "delete" | "search")[];
  /**
   * 標準動作で生成されたresponseを書き換えるためのカスタマイズメソッド
   * 不要な場合は、undefined。
   * @param request 処理対象のリクエスト
   * @param execute デフォルトの処理を実行するメソッド
   */
  filter?: (request: AxiosRequestConfig, requestType: "get" | "post" | "put" | "delete" | "search", path: URL, execute: (request: AxiosRequestConfig) => AxiosResponse) => AxiosResponse;


  /**
  * リクエストボディから、データを構築する。
  * 省略した場合は、リクエストボディが"as T"で変換される
  * @param requestBody リクエストボディ
  * @param type 要求されたリクエストのタイプ
  */
  createData?: (requestBody: any, type: "post" | "put", currentData?: T) => T;
}

/**
 * SingleRestApiMockの動作を決定するプロパティ
 */
interface SingleRestApiMockProps<T> extends RestApiMockProps<T>{
  /**対象となるデータ */
  data: T;
}
/**
 *  MultiRestApiMockの動作を決定するプロパティ
 */
interface MultiRestApiMockProps<T_DATA, T_SEARCH = T_DATA, T_GET = T_DATA> extends RestApiMockProps<T_DATA>{
  /**対象となるデータ */
  data: T_DATA[];

  /**
   * データからキーを生成します。post,putのlocation作成に利用されます。
   * 省略した場合は、uuidを用います。
   */
  getKey?: (data: T_DATA) => string;

  /**
   * pagenationを利用する場合に設定する。
   */
  pagenationSettings?: {
    limitParameterName: string;
    offsetParameterName: string;
    defaultLimit: number;
  };

  /**
   * 現在のデータから、requestの情報をもとに、対象のデータを検索し、そのindexを返す。
   * get, put, deleteで利用される。
   * 見つからない場合は、undefiendを返す。
   * 省略した場合は、常に最初のデータを返します。
   * 
   * @param data 検索対象のデータの集合
   * @param request 検索条件を含んだリクエスト
   * @return 見つかったdataのindex。見つからない場合は、undefined
   */
  find?: (data: T_DATA[], url: URL, request: AxiosRequestConfig) => number | undefined;
  /**
   * 検索条件に一致しるデータだけにfilterする。
   * searchで利用される。
   * searchをサポートしない場合はundefined。
   * @param data 検索対象のデータの集合
   * @param request  検索条件を含んだリクエスト
   * @return 見つかったdataの集合
   */
  search?: (data: T_DATA[], url: URL, request: AxiosRequestConfig) => T_SEARCH[];

  get?: (datum: T_DATA) => T_GET;
  /**
   * putの場合、作成を許すかどうか。省略した場合は許可。
   */
  allowCreateWhenPut?: boolean;

}


/**
 * single, multi双方のMockの共通処理を隠ぺいしたベースクラス。
 */
 abstract class RestApiMock<T_DATA, T_PROP extends RestApiMockProps<T_DATA>> implements ApiMock{
  protected props: T_PROP;
  constructor(name: string, props: T_PROP){
    this.name = name;
    this.props = props;

    //■rootPathの修正(末尾をそろえる)
    let rootPathStr = this.props.rootPath.source;
    if(rootPathStr.endsWith("$")){
      rootPathStr = rootPathStr.substring(0, rootPathStr.length - 1);
    }
    if(rootPathStr.endsWith("\\/")){
      rootPathStr = rootPathStr.substring(0, rootPathStr.length - 2);
    }
    rootPathStr += "[\\/]?$";
    this.props.rootPath = new RegExp(rootPathStr);
  }

  name: string;
  condition(request: AxiosRequestConfig<any>){
    return this.getType(request) != null;
  }
  execute(request: AxiosRequestConfig<any>){
    const type = this.getType(request);
    if(type == null)throw Error("typeがundifinedです。");
    const requestUrl = new URL(request.url == null ? "" : request.url, request.baseURL);

    const filter = this.props.filter 
      ?? ((request: AxiosRequestConfig<any>, requestType: "get" | "post" | "put" | "delete" | "search", path: URL, execute: (request: AxiosRequestConfig<any>) => AxiosResponse) => {
        return execute(request);
      });

    const result = filter(request, type, requestUrl, (request) => this.innerExecute(request));
    return result;
  }

  protected abstract getType(request: AxiosRequestConfig<any>): "search" | "get" | "post" | "put" | "delete" | undefined;
  protected abstract innerExecute(request: AxiosRequestConfig<any>): AxiosResponse;
  
}

/**
 * 一つのリソースに対する捜査を行うAPIのMock。
 */
export class SingleRestApiMock<T> extends RestApiMock<T, SingleRestApiMockProps<T>>{

  data: T;

  constructor(name: string, props: SingleRestApiMockProps<T>){
    super(name, props);
    this.data = lodash.cloneDeep(props.data);
  }
  protected getType(request: AxiosRequestConfig<any>): "get" | "post" | "put" | "delete" | "search" | undefined {
    //入力チェック
    if(request.url == null)throw Error("request.urlに値がありません。");
    if(request.method == null)throw Error("request.methodに値がありません。");
    const requestUrl = new URL(request.url, request.baseURL);
    const requestMethod = (() => {
      const method = request.method.toLowerCase();
      return ["get", "put", "delete"].indexOf(method) < 0 ? undefined : method as "get" | "post" | "put" | "delete";
    })();
    if(requestMethod == null){
      return undefined;
    }
    
    return this.props.supportedTypes.indexOf(requestMethod) >= 0 && this.props.rootPath.test(requestUrl.pathname) ? requestMethod : undefined;
  }


  protected innerExecute(request: AxiosRequestConfig<any>): AxiosResponse<any, any> {
    const type = this.getType(request);
    switch(type){
      case "get":
        return {
          data: this.data,
          status: 200,
        } as AxiosResponse;
      case "put":
        {
          const requestData = lodash.isString(request.data) ? JSON.parse(request.data) : request.data;
          const datum = this.props.createData != null ? this.props.createData(requestData, type, this.data) : requestData as T;
          this.data = datum;
          return {
            data: this.data,
            status: 201,
          } as AxiosResponse;
        }
      default:
        return {
          status: 404,
        } as AxiosResponse;
    }
  }

}

/**
 * 複数のリソースに対する捜査を行うAPIのMock。
 */
 export class MultiRestApiMock<T> extends RestApiMock<T, MultiRestApiMockProps<T>>{
  itemPath: RegExp;
  data: T[];
  constructor(name: string, props: MultiRestApiMockProps<T>){
    super(name, props);
    this.data = lodash.cloneDeep(props.data);
    //■ItemPath(get, put, deleteで使われるパスパラメータ付きのパス)の構築
    const rootPathStr = this.props.rootPath.source.substring(0, this.props.rootPath.source.length - 2);//※コンストラクタで、末尾を標準化しているため、末尾の"?$"を取り除く
    this.itemPath = new RegExp(rootPathStr + ".+[\\/]?$");
  }

  protected getType(request: AxiosRequestConfig<any>): "get" | "post" | "put" | "delete" | "search" | undefined {
    //入力チェック
    if(request.url == null)throw Error("request.urlに値がありません。");
    if(request.method == null)throw Error("request.methodに値がありません。");
    const requestUrl = new URL(request.url, request.baseURL);
    const requestMethod = (() => {
      const method = request.method.toLowerCase();
      return ["get", "post", "put", "delete"].indexOf(method) < 0 ? undefined : method as "get" | "post" | "put" | "delete";
    })();
    if(requestMethod == null){
      return undefined;
    }

    if(requestMethod === "get"){//getかsearchかの判断を含む
      if(this.props.supportedTypes.indexOf("get") >= 0 && this.itemPath.test(requestUrl.pathname)){
        return "get";
      }

      if(this.props.supportedTypes.indexOf("search") >= 0 && this.props.rootPath.test(requestUrl.pathname)){
        return "search";
      }
      
      return undefined;
    }
    else if(requestMethod === "post" && this.props.supportedTypes.indexOf("post") >= 0 && this.props.rootPath.test(requestUrl.pathname)){
      return "post";
    }
    else if(requestMethod === "put" && this.props.supportedTypes.indexOf("put") >= 0 && this.itemPath.test(requestUrl.pathname)){
      return "put";
    }
    else if(requestMethod === "delete" && this.props.supportedTypes.indexOf("delete") >= 0 && this.itemPath.test(requestUrl.pathname)){
      return "put";
    }
    else{
      return undefined;
    }
    
  }
  protected innerExecute(request: AxiosRequestConfig<any>): AxiosResponse<any, any> {
    //入力チェック
    if(request.url == null)throw Error("request.urlに値がありません。");
    const type = this.getType(request);
    const requestUrl = new URL(request.url, request.baseURL);
    switch(type){
      case "search": 
        {
          const data = this.props.search != null ? this.props.search(this.data, requestUrl, request) : this.data;
          if(this.props.pagenationSettings != null){
            const pagenationSetting = this.props.pagenationSettings;
            const [offset, limit] = (() => {
              if(request.url == null) throw Error("request.urlがありません。");
    
              const url = new URL(request.url, request.baseURL);
              const offsetParam = url.searchParams.get(pagenationSetting.offsetParameterName);
              const limitParam = url.searchParams.get(pagenationSetting.limitParameterName);
              return [
                offsetParam == null ? 0 : Number(offsetParam),
                limitParam == null ? pagenationSetting.defaultLimit : Number(limitParam),
              ]
            })();

            const pagedData = data.filter((item, index) => index >= offset && index <= offset + limit);
            const headers = new AxiosHeaders();
            headers.set("Content-Range", `items ${offset}-${offset + limit}/${this.data.length}`);//limitは10頁分
            return {
              headers: headers,
              data: pagedData,
              status: 200,
            } as AxiosResponse;
          }
          else{
            return {
              data: data,
              status: 200,
            } as AxiosResponse;
          }
        }
      case "get": 
        {
          const index = this.props.find == null ? 0 : this.props.find(this.data, requestUrl, request);
          if(index == null){
            return {
              status: 404,
            } as AxiosResponse;
          }
          else{
            const data = this.props.get == null ? this.data[index] : this.props.get(this.data[index] );
            return {
              data: data,
              status: 200,
            } as AxiosResponse;
          }
        }
      case "post": 
        {
          const requestData = lodash.isString(request.data) ? JSON.parse(request.data) : request.data;
          const data = this.props.createData != null ? this.props.createData(requestData, type) : requestData as T;
          this.data.push(data);
          return {
            data: data,
            status: 201,
          } as AxiosResponse;
        }
      case "put":
        {
          const index = this.props.find == null ? 0 : this.props.find(this.data, requestUrl, request);
          const requestData = lodash.isString(request.data) ? JSON.parse(request.data) : request.data;
          const data = this.props.createData != null ? this.props.createData(requestData, type, index != null ? this.data[index] : undefined) : requestData as T;
          if(index == null){
            if(this.props.allowCreateWhenPut ?? true){
              this.data.push(data);
              return {
                data: data,
                status: 201,
              } as AxiosResponse;
            }
            else{
              return {
                status: 404,
              } as AxiosResponse;
            }
          }
          else{
            this.data[index] = data;
            return {
              data: data,
              status: 200,
            } as AxiosResponse;
          }
        }
      case "delete":
        {
          const index = this.props.find == null ? 0 : this.props.find(this.data, requestUrl, request);
          if(index == null){
            return {
              status: 404,
            } as AxiosResponse;
          }
          else{
            this.data = this.data.filter((item, itemIndex) => itemIndex !== index);
            return {
              status: 204,
            } as AxiosResponse;
          }
        }
      default:
        throw new Error(`未知のtypeです。type=${type}`);
    }
  }  
}

/**
 * 単一リソースを操作するRestAPIのMockを作成する
 * @param name 
 * @param props 
 * @returns 
 */
export function createSingleRestApiMock<T>(name: string, props: SingleRestApiMockProps<T>): ApiMock{
  return new SingleRestApiMock(name, props);
}
/**
 * 複数リソースを操作するRestAPIのMockを作成する
 * @param name 
 * @param props 
 * @returns 
 */
 export function createMultiRestApiMock<T>(name: string, props: MultiRestApiMockProps<T>): ApiMock{
  return new MultiRestApiMock(name, props);
}