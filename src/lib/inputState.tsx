
import lodash from 'lodash';
import React from 'react';
import { v4 as uuid } from 'uuid';
import { CompornentPropsTypeof } from './componentPropsTypeof';
import { $path, $pathFrom, Path, TypedPath } from './path';


/**
 * InputState内のInputConnectorの管理情報
 */
interface InputConnectorRef{
  /** InputConnecrotの識別子 */
  connectorId: string;
  /** InputConnecrotが管理するパス  */
  path: string;
  /** 入力が有効かどうか */
  isEnable: boolean;
  /** Validationを実行する。 */
  validate: (messages: string[], value: any, path: any, state: any) => void; 
  /** 入力エラーがあるかどうか */
  hasError: boolean;

  /** Connctor側で管理する入力エラーをクリアする */
  clearInputError: () => void;
}





/**
 * InputState内の入力エラーの管理情報
 */
interface StatePropertyError{
  connectorId: string;
  errors: string[];
}

/**
 * InputConnectorに対して提供する、InputStateのコントローラ
 */
interface InputStateControllerForInputConnector{
  /**コンポーネントを登録する */
  registCompponent: (component: InputConnectorRef) => void;
  /**コンポーネントの登録を解除する*/
  unregistComponent: (connectorId: string) => void;
  /**コンポーネントを更新する */
  updateComponent: (connectorId: string, isEnable: boolean, hasError: boolean) => void;
  /** stateから値を取得 */
  getValue: (path: string) => any;
  /** stateに値を設定。validationなども実行*/
  setValue: (path: string, value: any) => void;
  /** 該当コンポーネントのプロパティエラーを取得する。*/
  getErrors: (connectorId: string) => string[];
  /** validateのみ実行 */
  validate: (compientnId: string) => void
}

/** useInputState実行時に指定するonInputChangeのハンドラ */
export type InputChangeEventHandler<T extends object> = (
  path: string,
  newValue: any,
  newState: T,
  oldValue: any,
  oldState: T
) => void;

/** useInputState()で返却される、クライアントに公開するコントローラ */
export interface InputState<T>{
  /** stateのデータ */
  data: T;
  /** dataのTypedPath */
  path: TypedPath<T>;
  /** dataへの変更を確定する。 */
  save: () => void;
  /** dataを初期状態に戻す */
  reset: () => void;
  /** Validatioをかけなおして、エラーがあればtrueを返す。  */
  validateAll: () => boolean;
  /** 入力エラー、コンバートエラーががあるかどうかを返す。 */
  hasError: () => boolean;
  /** 初期状態から変更があるかどうかを返す。 */
  hasChange: () => boolean;
  /** 変更履歴を表す値 */
  version: number;
  /** stateと<InputConnector>を連結するために、 <InputConnector>に渡す値*/
  connectorProp: InputStateControllerForInputConnector;
  
}

/**
 * 入力機構と連携するstateを使用するHook。
 *  呼び出しごとにパラメータが変更されることは想定していません。
 * @param defaultValue 
 * @param onInputChange 
 * @returns 
 */
export function useInputState<T extends object>(defaultValue: T, onInputChange?: InputChangeEventHandler<T>): InputState<T>{

  const defaultValueRef = React.useRef(defaultValue);
  const [_state, _setState] = React.useState({
    version: Number.MIN_VALUE,
    data: defaultValueRef.current
  });
  const state = _state.data;
  const setState = (value: T) => {
    const newVersion = _state.version === Number.MAX_VALUE ? Number.MIN_VALUE : _state.version + 1;
    _setState(
      {
        version: newVersion,
        data: value
      }
    );
  }
  
  const version = _state.version;

  const [errors, setErrors] = React.useState([] as StatePropertyError[]);
  const inputConnectors = React.useRef([] as InputConnectorRef[]);

  const inputData = lodash.cloneDeep(state);
  return {
    data: inputData,
    path: $path<T>(),
    save: () => {setState(inputData);},
    reset: () => {
      setErrors([]);
      setState(defaultValueRef.current);
    },
    validateAll: () => {
      const errors = inputConnectors.current.map(inputConnectorRef => {
        const value = lodash.get(state, inputConnectorRef.path);
        const errors: string[] = [];
        inputConnectorRef.validate(errors, value, inputConnectorRef.path, state);
        return {
          connectorId: inputConnectorRef.connectorId,
          errors: errors,
        };
      }).filter(item => item.errors.length > 0);
      setErrors(errors);
      return errors.length > 0;
    },
    hasError: () => {
      return errors.filter(item => item.errors.length > 0).filter(item => inputConnectors.current.filter(inputConnector => item.connectorId === inputConnector.connectorId && inputConnector.isEnable)).length > 0;
    },
    hasChange: () => {
      return !lodash.isEqual(defaultValueRef.current, state);
    },
    version: version,
    connectorProp:  {
      registCompponent: (component: InputConnectorRef) => {
        inputConnectors.current = [...inputConnectors.current.filter(item => item.connectorId !== component.connectorId), component];
      },
      unregistComponent: (connectorId: string) => {
        inputConnectors.current = inputConnectors.current.filter(item => item.connectorId !== connectorId);
        setErrors(errors.filter(item => item.connectorId !== connectorId));
      },
      updateComponent: (connectorId: string, isEnable: boolean, hasError: boolean) => {
        const target = inputConnectors.current.find(item => item.connectorId === connectorId);
        if(target != null){
          target.isEnable = isEnable;
          target.hasError = hasError;
        }
      },
      getValue: (path: string) => lodash.get(inputData, path),
      setValue: (path: string, value: any) => {
        
        //■stateの更新
        lodash.set(inputData, path, value);
        setState(inputData);

        //■onchangeイベントの発火
        if(onInputChange != null){
          onInputChange(path, value, inputData, lodash.get(state, path), state);
        }
        //■エラーチェック
        const newErrors = inputConnectors.current.filter(item => item.path === path).reduce((previouseValue, component) => {
          
          const messages: string[] = [];
          component.validate(messages, value, path, inputData);
          return [...previouseValue.filter(item => item.connectorId !== component.connectorId), {connectorId: component.connectorId, errors: messages}];
        }, errors);
        setErrors(newErrors);

        //■入力エラーのクリア
        inputConnectors.current.forEach(inputConnector => {
          if(inputConnector.path === path){
            inputConnector.clearInputError();
          }
        })
      },
      getErrors: (connectorId: string) => {
        const target = errors.find(item => item.connectorId === connectorId);
        return target == null ? [] : target.errors;
      },
      validate: (connectorId: string) => {
        const component = inputConnectors.current.find(item => item.connectorId === connectorId);
        if(component != null){
          const messages: string[] = [];
          component.validate(messages, lodash.get(inputData, component.path), component.path, inputData);
          setErrors([...errors.filter(item => item.connectorId !== component.connectorId), {connectorId: connectorId, errors: messages}]);
        }
      }
    }
  };
}

export interface ChildPropsSource{
  isEnable: boolean;
  onChange: (event: any) => void;
  onBlur: (event: any) => void;
  onCompositionStart: (event: any) => void;
  onCompositionEnd: (event: any) => void;
  hasError: boolean;
  errorMessage: string;
}

export interface DrawInputConnectorErrorProps{
  errors: string[];
  children: React.ReactNode;
}
/** InputConnector.drawErrorの型。childrenをラップして、エラーを表現するためのコンポーネント */
export type DrawInputConnectorError = (
  props: DrawInputConnectorErrorProps
) => JSX.Element;

/**
 * 入力コンポーネントのをwrapして、InputStateと接続する。<InputConnector><input /></InputConnector>
 * @param props 
 * @returns 
 */
export function InputConnector<T_STATE extends object, T_PROP, T_INPUT> (
  props: {
    path: TypedPath<T_PROP>,
    convert?: (value: T_PROP) => T_INPUT,
    convertBack?: (value: T_INPUT, errors: string[]) => T_PROP,
    validate?: (messages: string[], value: T_PROP, path: TypedPath<T_STATE>, state: T_STATE) => void,
    dependentPaths?: Path[],
    isEnable? : boolean;
    children: React.ReactElement,
    valuePropertyName?: string,
    getInputValue?: (event: any) => T_INPUT,
    drawError?: DrawInputConnectorError
    inputStateProps: InputStateControllerForInputConnector,
    mapCildProperty?: <T extends (...args: any) => any>( source: ChildPropsSource, dest: Partial<CompornentPropsTypeof<T>>) => void,
  }
){
  const isEnable = props.isEnable ?? true;
  const path = props.path.$toString();

  //■入力が確定しているかどうか。日本語入力中のみfalse
  const isInputFixed = React.useRef(true);
  
  //■入力エラー
  const [inputErrors, setInputErrors] = React.useState<string[]>([]);

  //■自身のIDの採番(初回レンダーのみ)
  const connectorId = React.useMemo(() => uuid(), []);

  //■確定していない入力状態を保持
  const [unFixedValue, setUnFixedValue] = React.useState<T_INPUT | undefined>(undefined);

  //■InputStateへのコンポーネント登録/解除
  React.useEffect(() => {

    props.inputStateProps.registCompponent({
      connectorId: connectorId,
      path: props.path.$toString(),
      isEnable: isEnable,
      validate: (messages, value, path, state) => {
        if(props.validate != null){
          props.validate(messages, value, $pathFrom<T_STATE>(path), state);
        }
      },
      hasError: false,
      clearInputError: () => {setInputErrors([]);}
    });
    return  () => {
      //登録解除
      props.inputStateProps.unregistComponent(connectorId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //■InputStateへのコンポーネント更新
  React.useEffect(() => {
    props.inputStateProps.updateComponent(connectorId, isEnable, inputErrors.length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnable, inputErrors.length, props.validate]);

   
  //■入力を更新する処理を切り出し。
  const updateValue = (event: any) => {
    //■新しい入力値の取得
    const value = props.getInputValue != null ? props.getInputValue(event) : event.target[props.valuePropertyName ?? "value"];

    //■stateの更新()
    if(isInputFixed.current){//入力が完了しているとき
      //■input → propへのコンバートと入力エラーのチェック
      const errors: string[] = [];
      const convertedValue = props.convertBack == null ? value : props.convertBack(value, errors);
      if(errors.length > 0){//入力エラーあり
        setInputErrors(errors);
        setUnFixedValue(value);
      }
      else{//コンバート成功
        setInputErrors([]);
        setUnFixedValue(undefined);
        props.inputStateProps.setValue(path, convertedValue);
      }
    }
    else{//入力が完了していいないときは、UnFixedValueを更新する
      setInputErrors([]);
      setUnFixedValue(value);
    }
  }

  //■childPropsSourceの構築
  const convert = props.convert != null ? props.convert : (value: T_PROP) => value;
  const childPropsSource: ChildPropsSource = {
    isEnable: isEnable,
    onChange:  (event: any) => {
      //■変更時、stateに保存
      //■preventDefaultの発行
      if("preventDefault" in event && lodash.isFunction(event.preventDefault)){
        event.preventDefault();
      }
      //■stateの更新
      updateValue(event);
    },
    onBlur:  (event: any) => {
      //■フォーカスが離れるとき、validateのみを実行
      if("preventDefault" in event && lodash.isFunction(event.preventDefault)){
        event.preventDefault();
      }
      if(inputErrors.length === 0){//入力エラーないとき
        props.inputStateProps.validate(connectorId);
      }
    },
    onCompositionStart: (event: any) => {
      isInputFixed.current = false;
      const value = props.getInputValue != null ? props.getInputValue(event) : event.target[props.valuePropertyName ?? "value"];
      setUnFixedValue(value);
    },
    onCompositionEnd: (event: any) => {
      isInputFixed.current = true;
      setUnFixedValue(undefined);
      updateValue(event);
    },
    hasError: inputErrors.length > 0 || props.inputStateProps.getErrors(connectorId).length > 0,
    errorMessage: (inputErrors.length > 0 ? inputErrors : props.inputStateProps.getErrors(connectorId)).reduce((previouseValue, currentValue) => previouseValue + currentValue + "\n", ""),
  }
  
  //■childの再構築
  const child = (() => {
    //■新しいpropsの構築
    const newProps = { ...props.children.props}; 

    //■値の設定
    newProps[props.valuePropertyName ?? "value"] = isInputFixed.current && inputErrors.length === 0 ? convert(props.inputStateProps.getValue(path)) : unFixedValue;

    //■上書きするpropertyの準備

    const propertyMap = props.mapCildProperty == null ? {
      onChange: childPropsSource.onChange,
      onBlur: childPropsSource.onBlur,
      onCompositionStart: childPropsSource.onCompositionStart,
      onCompositionEnd: childPropsSource.onCompositionEnd,
    } : (() => {
      const result = {};
      props.mapCildProperty(childPropsSource, result);
      return result;
    })();

    //■プロパティの上書き
    Object.entries(propertyMap).forEach(([key, value]) => {
      newProps[key] = value;
    });

    //■Childの生成
    return React.cloneElement(props.children, newProps);
  })();

  //■エラー構築
  if(props.drawError != null && (inputErrors.length > 0 || props.inputStateProps.getErrors(connectorId).length > 0)){//DrawErrorが指定されており、入力もしくはプロパティエラーが存在する場合
    const errors = inputErrors.length > 0 ? inputErrors : props.inputStateProps.getErrors(connectorId);  
    return <props.drawError errors={errors}>{child}</props.drawError>
  }
  else{//DrawErrorが指定されていないか、エラーがない場合
    return <>{child}</>;
  }
}

/**
 * <InputConnector>に設定する、汎用的なconvert(), convertBackを定義する。
 */
export namespace Converters{
  /**
   * <数値のためのConvertAndValidate>
   * @param min 最小値
   * @param max 最大値
   * @param cractionLength 少数部の長さ
   * @returns 
   */
  export function number(min: number, max: number, cractionLength: number = 0){
    return {
      convert: (value: number | undefined) => {
        return value != null ? value.toString() : "";
      },
      convertBack: (value: string, messages: string[]) => {
        const replaced = value.replace("１", "1")
        .replace("２", "2")
        .replace("３", "3")
        .replace("４", "4")
        .replace("５", "5")
        .replace("６", "6")
        .replace("７", "7")
        .replace("８", "8")
        .replace("９", "9")
        .replace("０", "0")
        .replace("。", ".")
        .replace("、", ".")
        .replace("ー", "-");
        const converted = Number(replaced);
        
        if(isNaN(converted) && !isFinite(converted)){
          messages.push("数値評価できない、不正な文字が含まれています。");
        }     
        return converted;
      },
     
    }
  }
  /**
   * <input type="text"/>のためのコンバータを生成する。
   * @returns input
   */
  export function text(){
    return {
      convert: (value: string | undefined) => value == null ? "" : value,
      convertBack: (value: string, messages: string[]) => value == null || value.length === 0 ? undefined : value,     
    }
  }
  /**
   * <input type="datetime-local"/>のためのコンバータを生成する。
   * @returns 
   */
  export function datetimeLocal(){
    return {
      convert: (value: Date | undefined) => {
        if(value == null){
          return "";
        }
        else{
          return value.toISOString().slice(0, -1);
        }
      },
      convertBack: (value: string, messages: string[]) => {
        if(value == null || value.length === 0){
          return undefined;
        }
        else{
          return new Date(value);
        }
      },
     
    }
  }

  
  
}

export namespace Validators{
  type Validate = (messages: string[], value: any, path: TypedPath<any>, state: any) => void;


  /**
   * 複数の制約を統合する
   * @param validates 統合する制約
   * @returns 生成されたValidateメソッド
   */
  export function composite(...validates: Validate[]){
    return validates.length === 0 ? undefined
      :  (messages: string[], value: any, path: TypedPath<any>, state: any) => {
        validates.forEach(validate => validate(messages, value, path, state));
      };
  }



  /**
   * 任意の条件でのみ実行するようにValidateを修飾する。
   * @param isEnable validateを実行するかどうか
   * @param validate 実行対象のvalidate
   * @returns 生成されたValidateメソッド
   */
  export function validateIf(isEnable: boolean, validate: Validate){
    return isEnable ? validate : (messages: string[], value: any, path: TypedPath<any>, state: any) => {}
  }
  /**
   * 入力必須
   * @param message エラー時に表示するメッセージ
   * @returns 生成されたValidateメソッド
   */
  export function required(message?: string){
    return (messages: string[], value: any, path: TypedPath<any>, state: any) => {
      if(value == null || (lodash.isString(value) && value.length === 0)){
        messages.push(message ?? "入力が必須です。");
      }
    };
  }
  /**
   * 最大文字数の指定
   * @param maxLength 最大文字数。
   * @param message エラー時に表示するメッセージ
   * @returns 生成されたValidateメソッド
   */
  export function strMax(maxLength: number, message?: string){
    return (messages: string[], value: any, path: TypedPath<any>, state: any) => {
      if(value != null && value.length > maxLength){
        messages.push(message ?? `${maxLength}文字以内で入力してください。`);
      }
    };
  }
  /**
   * 最小文字数の指定
   * @param minLength 最小文字数
   * @param message エラー時に表示するメッセージ
   * @returns 生成されたValidateメソッド
   */
  export function strMin(minLength: number, message?: string){
    return (messages: string[], value: any, path: TypedPath<any>, state: any) => {
      if(value != null && value.length < minLength){
        messages.push(message ?? `${minLength}文字以上で入力してください。`);
      }
    };
  }
  /**
   * 指定した正規表現に一致しなければエラー
   * @param regExp 正規表現
   * @param message エラー時に表示するメッセージ
   * @returns 生成されたValidateメソッド
   */
  export function strRegExp(regExp: RegExp, message?: string){
    return (messages: string[], value: any, path: TypedPath<any>, state: any) => {
      if(value == null || value.length === 0)return;//valueが空の時は評価しない。
      
      if(!regExp.test(value)){
        messages.push(message ?? `正規表現「${regExp.toString()}」に一致しません。`);
      }
    };
  }


  function createRegExString(characters: string){
    const str = characters.split("").reduce((previouseValue, currentValue) => {
      const str = ((c: string) =>{
        switch(c){
          case "\\":
          case "*":
          case "+":
          case ".":
          case "?":
          case "{ ":
          case "}":
          case "(":
          case ")":
          case "[":
          case "]":
          case "^":
          case "$":
          case "-":
          case "|":
          case "/":
            return "\\" + c;
          default: 
            return c;
        }
      })(currentValue);
      return previouseValue + str;
    }, "");
    return str;
  }
  /**
   * 許可する文字を指定する。
   * @param allowCahrs 許可する文字で構成された文字列。
   * @param message 
   * @returns 
   */
  export function validChars(validCharacters: string, message?: string){
    const regex = new RegExp(`^[${createRegExString(validCharacters)}]+$`);
    return strRegExp(regex, message ?? `無効な文字が含まれています。(有効な文字：${validCharacters})`);
  }

  export function invalidChars(invalidCharacters: string, message?: string){
    const regex = new RegExp(`^[^${createRegExString(invalidCharacters)}]+$`);
    return strRegExp(regex, message ?? `無効な文字が含まれています。(無効な文字：${invalidCharacters})`);
  }

  /**
   * メールアドレスでなければエラー
   * @param message エラー時に表示するメッセージ
   * @returns 生成されたValidateメソッド
   */
  export function mailaddress(message?: string){
    return strRegExp(/^[a-zA-Z0-9_+-]+(\.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/, message ?? "メールアドレスとして不正です。");
  }

}