/**
 * Material-UIをサポートするためのモジュール
 */

import { NativeSelect, Select, TextField } from "@mui/material";
import { CompornentPropsTypeof } from "./componentPropsTypeof";
import { ChildPropsSource } from "./inputState";

export namespace muiSupport{
  /**
   * InputStateで<TextFiled>を使うためのMap
   * @param source 
   * @param dest 
   */
  export function mapTextField(source: ChildPropsSource, dest: Partial<CompornentPropsTypeof<typeof TextField>>): void{
    dest.onChange = source.onChange;
    dest.onBlur = source.onBlur;
    dest.onCompositionStart = source.onCompositionStart;
    dest.onCompositionEnd = source.onCompositionEnd;
    dest.error = source.hasError;
    dest.helperText = source.errorMessage;
    dest.disabled = !source.isEnable;
  }

  export function mapSelect(source: ChildPropsSource, dest: Partial<CompornentPropsTypeof<typeof NativeSelect>>): void{
    dest.onChange = source.onChange;
    dest.onBlur = source.onBlur;
    dest.onCompositionStart = source.onCompositionStart;
    dest.onCompositionEnd = source.onCompositionEnd;
    dest.error = source.hasError;
    dest.disabled = !source.isEnable;
  }
}