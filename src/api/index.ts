import { axiosAdapterBuilder } from "../lib/axios";
import { Message } from "./message"

export namespace apimodel{
  export type Message = Message.Resource;
}

//■APIMockの登録
let isRegisterMock = false;
export function registMocks(){
  if(axiosAdapterBuilder != null && !isRegisterMock){
    Message.registMock(axiosAdapterBuilder);
    isRegisterMock = true;
  }

  
}

