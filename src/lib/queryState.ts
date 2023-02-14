import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';
import lodash from 'lodash';
/**
 * stateとクエリパラメータを同期する
 * @param name 対象となるクエリパラメータの名前。
 * @param convert クエリパラメータ(string)をstateに変換する関数。
 * @param back stateをクエリパラメータ(string)に変換する関数。省略時は、String(state)が使用される。
 * @returns useSateと同じ。
 */
export function useQueryState<T>(name: string, convert: (value: string | null) => T, back?: (value: T) => string): [T, (state: T) => void, (prefix?: string) => string]{
  const history = useHistory();
  const location = useLocation();
  const search = queryString.parse(location.search);
  const param = search[name];
  const currentValue = lodash.isArray(param) ? param[0] : param;
  const [state, setState] = React.useState(convert(currentValue));

  React.useEffect(() => {
    const newValue = back == null ? String(state) : back(state);
    if(currentValue !== newValue){
      if(newValue != null && newValue.length > 0){
        search[name] = newValue;
      }
      else{
        delete search[name];
      }
      
      history.push(`${process.env.PUBLIC_URL}${location.pathname}${toQueryString(search)}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);


  return [
    state, 
    setState, 
    (prefix?: string) => state == null ? "" : `${prefix == null ? "" : prefix}${name}=${back == null ? String(state) : back(state)}`,
  ];

}

function toQueryString(search: queryString.ParsedQuery<string>){
  return Object.entries(search).reduce((previouseValue, [key, value]) => {
    return `${previouseValue}${previouseValue.length === 0 ? "?" : "&"}${key}=${value}`;
  }, "");
}
 
export function useQueryStateMock
(value: any, setValue?: (value: any) => void){
  return (name: string, convert: (value: any) => any, back?: (value: any) => string): [any, (state: any) => void, (prefix?: string) => string] => {
    return [
      value,
      setValue != null ? setValue : (value: any) => {},
      (prefix?: string) => value == null ? "" : `${prefix == null ? "" : prefix}${name}=${back == null ? String(value) : back(value)}`,
    ];
  };
}