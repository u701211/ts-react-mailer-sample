import React from "react";
import { ModalPanel } from "./modalPanel";
import { Loading } from "./loading";


/**
 * Loadingのコンポーネント
 * @param props なし
 */
export const LoadingPage = function(
  props: {
    isVisible: boolean,
  }
) 
{
  return (
    <ModalPanel isVisible={props.isVisible}>
      <Loading size={200} />
    </ModalPanel>
  );
};
