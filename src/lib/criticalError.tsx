import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import React from 'react';

interface CriticalError{
  raise: (message: string) => void;
}
const criticalErrorContext = React.createContext<CriticalError>({
  raise: (message) => {},
});

export function CriticalErrorProvider(
  props: {
    errorPage: (props: {message: string}) => JSX.Element,
    children: React.ReactNode,
  }
){
  const [criticalErrorData, setCriticalErrorData] = React.useState<{
    message: string,
  }>();

  const criticalError: CriticalError = {
    raise: (message) => {
      setCriticalErrorData({
        message: message
      });
    },
 
  }

  return (
    <criticalErrorContext.Provider value={criticalError}>
      {criticalErrorData == null ? props.children : <props.errorPage message={criticalErrorData.message} /> }
    </criticalErrorContext.Provider>
  );
}


export function useCriticalError(): CriticalError{
  return React.useContext(criticalErrorContext);
}