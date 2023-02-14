import _axios, { AxiosRequestConfig, AxiosRequestHeaders } from "axios";
import { useAuthentication } from './auth';
import { AxiosAdapterBuilder } from "./axiosMock";


/**
 * axiosに設定するaxiosAdapter
 * mock動作を実現するため。
 */
export const axiosAdapterBuilder = process.env.REACT_APP_AXIOS_MODE === "mock" ? new AxiosAdapterBuilder() : undefined;

/**
 * 
 */
export function useAxios(customize?: (defaultConfig: AxiosRequestConfig) => void){

  //■認証の取得
  const auth = useAuthentication(false);

  //■共通のaxiosのコンフィグを構成
  const config: AxiosRequestConfig = {

    baseURL: process.env.REACT_APP_AXIOS_MODE === "mock" ? "http://localhost:3000" //axiosの動作モードがmockの時は、URLとして適切なものであればなんでもよい。
            : process.env.NODE_ENV === "development" ? "http://localhost:3000" //
            : process.env.PUBLIC_URL + "/api/v1/",
    withCredentials: true,
    headers: { 
      "Cache-Control": "no-store", 
      "Content-Type": "application/json",
    },
    validateStatus: (status) => true,

  }

  //■axiosのコンフィグをカスタマイズ
  if(customize != null){
    customize(config);
  }

  //■mock用のAdapterを構築
  if(axiosAdapterBuilder != null){
    config.adapter = axiosAdapterBuilder.build();
  }

  //■axiosを生成
  const axios = _axios.create(config);

  //■認証用のインターセプタを設定し、実行時にAuthorizationヘッダを付与するように
  axios.interceptors.request.use(async request => {
    if(auth.isAuthenticated){
    const accessToken = auth.getAccessToken();
      if(request.headers == null)
        request.headers = {} as AxiosRequestHeaders;
      (request.headers as any)["Authorization"] = `Bearer ${accessToken}`;
    }
    return request;
  });

  return axios;
  
  
}

