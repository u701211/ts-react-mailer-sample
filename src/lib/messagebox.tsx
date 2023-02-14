import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import React from 'react';

interface messagebox{
  show: (title: string, message: React.ReactNode, type: "ok" | "okcancel" | "yesno") => Promise<"ok" | "cancel" | "yes" | "no" | undefined>;
}
const messageboxContext = React.createContext<messagebox>({
  show: async (title, message, type) => "ok",
});

export function MessageboxProvider(
  props: {
    children: React.ReactNode,
  }
){
  const [messageboxData, setMessageboxData] = React.useState<{
    isOppen: boolean,
    title?: string,
    content?: React.ReactNode,
    type?: string,
    // resolve?: (value: "ok" | "cancel" | "yes" | "no" | PromiseLike<"ok" | "cancel" | "yes" | "no" | undefined> | undefined) => void,
    resolve?: (result: "ok" | "cancel" | "yes" | "no" | undefined) => void,
  }>({
    isOppen: false,
  });

  const messagebox: messagebox = {
    show: (title, message, type) => {
      return new Promise((resolve) => {
        setMessageboxData({
          isOppen: true,
          title: title,
          content: message,
          type: type,
          resolve: result => {
            resolve(result);
          },
        });
      });
    },
 
  }
  const closeMessagebox = (result: "ok" | "cancel" | "yes" | "no" | undefined) => {
    setMessageboxData({
      isOppen: false,
    });
    if(messageboxData.resolve == null)throw Error("messageboxData.resolveがnullです。");
    messageboxData.resolve (result);
  }
  return (
    <messageboxContext.Provider value={messagebox}>
      {props.children}
      <Dialog
        open={messageboxData.isOppen}
        onClose={e => {closeMessagebox(undefined);}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {messageboxData.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {messageboxData.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {
            messageboxData.type === "ok" ?
              <Button onClick={e => {closeMessagebox("ok");}}>OK</Button>
            : messageboxData.type === "okcancel" ? <>
              <Button onClick={e => {closeMessagebox("ok");}}>OK</Button>
              <Button onClick={e => {closeMessagebox("cancel");}}>キャンセル</Button>
            </>
            : messageboxData.type === "yesno" ? <>
              <Button onClick={e => {closeMessagebox("yes");}}>はい</Button>
              <Button onClick={e => {closeMessagebox("no");}}>いいえ</Button>
            </>
            : <></>
          }
        </DialogActions>
      </Dialog>
    </messageboxContext.Provider>
  );
}


export function useMessagebox(): messagebox{
  return React.useContext(messageboxContext);
}