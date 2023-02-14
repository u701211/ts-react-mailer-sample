import lodash from 'lodash';
import queryString from 'query-string';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { InputChangeEventHandler, InputState, useInputState } from './inputState';

/**
 * URLのsearch部分と連動したuseInputState。
 * 呼び出しごとにパラメータが変更されることは想定していません。
 * @param parameterName 
 * @param defaultValue 
 * @param convert 
 * @param isReplace 
 * @param onInputChange 
 * @returns 
 */
export function useInputStateWithQuery<T extends object>(parameterName: string, defaultValue: T,convert: (defaultValue: T, queryValue: any) => void, isReplace: boolean = true, onInputChange?: InputChangeEventHandler<T>): InputState<T>{
  const history = useHistory();
  const location = useLocation();
  
  //■クエリパラメータと、defaultValueから、stateの初期化値を算出する。
  const initValue = React.useMemo(() => {
    const queryValue = createQueryValue(location.search, parameterName);
    if(queryValue != null){
      const value = lodash.cloneDeep(defaultValue);
      convert(value, queryValue);
      return value;
    }
    else{
      return defaultValue;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  const inputState = useInputState(initValue, onInputChange);

  //■データの変更をserchに反映する。
  React.useEffect(() => {
    const query = JSON.stringify(inputState.data);
    const search = queryString.parse(location.search);
    search[parameterName] = query;
    if(isReplace){
      history.replace(`${process.env.PUBLIC_URL}${location.pathname}${toQueryString(search)}`);
    }
    else{
      history.push(`${process.env.PUBLIC_URL}${location.pathname}${toQueryString(search)}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputState.version])
  return inputState;
}

/**
 * URLのsearchから、オブジェクトを構築する。
 * @param location useLocationで取得したLocation
 * @param paramName 対象のパラメータ名
 */
function createQueryValue(searchString: string, parameterName: string) : object | undefined{
  const search = queryString.parse(searchString);
  const parameter = search[parameterName];
  const parameterString =  parameter == null ? undefined : lodash.isArray(parameter) ? parameter[0] == null ? undefined : parameter[0] : parameter;
  if(parameterString != null){
    const queryValue = (() => {
      try{
        return JSON.parse(parameterString);
      }
      catch(e){
        //■もとになるqueryStringは制御できないので、parseエラーを未指定として扱う
        console.debug("JSON.perseで例外の発生");
        return undefined;
      }
    })();
    return queryValue;
  }
  else{
    return undefined;
  }
}

/**
 * queryString.ParsedQuery<string>をsearchに変換する
 * @param search 
 * @returns 
 */
function toQueryString(search: queryString.ParsedQuery<string>){
  return Object.entries(search).reduce((previouseValue, [key, value]) => {
    return `${previouseValue}${previouseValue.length === 0 ? "?" : "&"}${key}=${value}`;
  }, "");
}