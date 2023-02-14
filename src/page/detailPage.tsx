import React from 'react';
import { useHistory } from 'react-router-dom';
import { PageLayout } from '../layout/pageLayout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { NotFoundPage } from './notFoundPage';
import { apimodel } from '../api';
import { useAxios } from '../lib/axios';
import styles from "./detailPage.module.scss";
import { Avatar } from '@mui/material';

export const DetailPage = function(
  props: {
  }
) 
{
  const axios = useAxios();
  const history = useHistory();
  
  const [message, setMessage] = React.useState<apimodel.Message | undefined>(undefined);
  //■URLからIDを取得
  const id = (() => {
    const temp = (history.location.pathname + "/").match(/^\/mails\/(.*)\//);
    return temp != null && temp.length >= 2 ? temp[1] : undefined;
  })(); 


  //■データの取得
  React.useEffect(() => {
    if(id != null){
      (async () => {
        const response = await axios.get(`v1/messages/${id}`);
        const data = response.data as apimodel.Message;
        setMessage(data);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  if(id == null){//IDが取得できなければNotFound
    return <NotFoundPage /> ;

  }
  else{
    return (
      <PageLayout title="メールの閲覧" isInitialized={message != null}>
        <div className={styles.root}>
          <div>{/* アプリケーションバー */}
            <div>{/* 左側 */}
              <button onClick={e=>{e.preventDefault();history.goBack();}}>
                <ChevronLeftIcon/>
              </button>
            </div>
            <div>{/* 右側 */}
              <button onClick={e=>{e.preventDefault();alert("not support")}}>
                <DeleteIcon/>
              </button>
            </div>
          </div>
          <div>{/* コンテンツ */}
            <div>{message?.title}</div>{/* 件名 */}
            <div>{/* 送信元など */}
              <Avatar sx={{ width: 45, height: 45 }}>{message?.from.substring(0, 1)}</Avatar>
              <div>
                <div>
                  <div><div>{message?.from}</div></div>
                  <div>{message?.time.getHours()}:{message?.time.getMinutes()}</div>
                </div>
                <div>To:自分</div>
              </div>
              <button onClick={e=>{e.preventDefault();alert("not support");}}>
                <KeyboardReturnIcon/>
              </button>
            </div>
            <div>{message?.contents}</div>{/* 本文 */}
          </div>
        </div>
      </PageLayout>
    );
  }
}