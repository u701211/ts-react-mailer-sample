import React from "react";
import { Prompt as PromptBase } from "react-router-dom";


/**
 *画面遷移を抑制するコンポーネント
 * @param props なし
 */
export const Prompt = function(
  props: {
    when?: boolean,
    message?: string,
  }
) 
{
  const when = props.when ?? true;
  const message = props.message ?? "ページを離れますか？\n行った変更が保存されない可能性があります。";

  const beforeunloadHandler = (event: BeforeUnloadEvent) => {
    if(when){
      event.preventDefault();
      event.returnValue = "";
    }
  };

  React.useEffect(() => {
    window.addEventListener("beforeunload", beforeunloadHandler);
    return () => {
      window.removeEventListener("beforeunload", beforeunloadHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when]);
  return (
    <PromptBase when={when} message={message}/>
  );
};