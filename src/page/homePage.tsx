import React from 'react';
import { PageLayout } from '../layout/pageLayout';
import styles from "./homePage.module.scss";
import DehazeIcon from '@mui/icons-material/Dehaze';
import { apimodel } from '../api';
import { useAxios } from '../lib/axios';
import { Avatar } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useHistory } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import lodash from 'lodash';


/**
 * apimodel.Messageに画面特有の情報を付与したViewModel
 * アニメーションと実行のずれの回避のため。
 */
interface Message{
  message: apimodel.Message;
  /**画面上で削除されている場合はtrue */
  isDelete?: boolean;
}
export const HomePage = function(
  props: {
  }
) 
{
  const axios = useAxios();
  const history = useHistory();
  
  //■サイドバーを表示するかどうか
  const [isSideBarVisible, setIsSideBarVisible] = React.useState(false);

  //■検索バーを表示するかどうか
  const [isSearchBarVisible, setIsSearchBarVisible] = React.useState(true);

  //■ドキュメントのスクロール位置
  const scrollPositon = React.useRef(0);

  //■検索キーワード
  const [keword, setKeyword] = React.useState("");
  //■メール一覧
  const [messages, setMessages] = React.useState<Message[] | undefined>(undefined);

  //■フォルダ一覧
  const [folders, setFolders] = React.useState(["受信トレイ", "ゴミ箱", "迷惑メール"]);

  const [currentFolder, setCurrentFolder] = React.useState("受信トレイ");

  //■データの取得
  React.useEffect(() => {
    (async () => {
      const response = await axios.get(`v1/messages?keyword=${keword}&folder=${currentFolder}`);
      const data = response.data as apimodel.Message[];
      setMessages(data.map(item => {return {message: item};}));
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keword, currentFolder]);

  //■スクロールイベント
  React.useEffect(() => {
    const scrollEventHandler = (event: Event) => {
      if(scrollPositon.current < document.documentElement.scrollTop){//下にスクロール
        setIsSearchBarVisible(false);
      }
      else{//上にスクロール
        setIsSearchBarVisible(true);
      }
      //■現在のスクロール位置を保持。
      scrollPositon.current = document.documentElement.scrollTop;
    };
  
    window.addEventListener("scroll", scrollEventHandler);
    return () => {
      window.removeEventListener("scroll", scrollEventHandler);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //■サイドバーの展開のためのスワイプ
  const sideMenuSwipeHandler = useSwipeable({ 
    onSwipedRight: (eventData) => {
      setIsSideBarVisible(true);
    },
  }); 

  return (
    <PageLayout title="メール一覧" isInitialized={messages != null}>
      <div className={styles.root}>
        <div {...sideMenuSwipeHandler}>{/* サイドバー開閉のタップ受付 */}
        </div>
        <div>{/* サイドバーバー */}
          <input type="checkbox" checked={isSideBarVisible} onChange={e =>{}} />{/* 表示/非表示の制御用 */}
          <div onClick={e=>{e.preventDefault();setIsSideBarVisible(false);}}/>{/* 背景 */}
          <input type="checkbox" checked={isSideBarVisible} onChange={e =>{}} />{/* 表示/非表示の制御用 */}
          
          <aside>{/* サイドバーバー本体 */}
            <div>
              <ul>
                {folders.map((item, index) => {
                  return (
                    <li key={index} className={item === currentFolder ? styles.selected : undefined}>
                      <FolderOpenIcon/>
                      <button onClick={e => {e.preventDefault();setCurrentFolder(item);setIsSideBarVisible(false);}}>{item}</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
        
        <div>{/* メインコンテンツ */}
          <input type="checkbox" checked={!isSearchBarVisible} onChange={e =>{}} />{/* 表示/非表示の制御用 */}
          <div>{/* 検索バー */}
            <button onClick={(e) => {e.preventDefault();setIsSideBarVisible(true);}}>
              <DehazeIcon />
            </button>
            <input type="text" placeholder="メールを検索" onChange={e => {e.preventDefault();setKeyword(e.target.value.trim());}} />
          </div>
          <div>{/* コンテンツ */}
            <div>{currentFolder}</div>
            <ul>
            {messages?.map((item, index) => {
              return (
                <li key={item.message.id}>
                  {!(item.isDelete ?? false) ?
                    <MailItem id={item.message.id} onDeleting={async id => {//フォルダをゴミ箱に変更
                      const newItem = lodash.cloneDeep(item.message);
                      newItem.folder = "ゴミ箱";
                      await axios.put(`v1/messages/${item.message.id}`, newItem);
                    }} onDeleted={id => {
                      const newMessages = lodash.cloneDeep(messages);
                      const target = newMessages.find(item => item.message.id === id);
                      if(target == null)throw Error();
                      target.isDelete = true;
                      setMessages(newMessages);

                    }}>
                      <div className={styles.MenuItem} onClick={e => {e.preventDefault(); history.push(`./mails/${item.message.id}`)}}>
                        <div>{/* アバター */}
                          <Avatar sx={{ width: 45, height: 45 }}>{item.message.from.substring(0, 1)}</Avatar>
                        </div>
                        <div>{/* 詳細 */}
                          <div>{/* 送信元と時刻 */}
                            <div>{item.message.from}</div>
                            <div>{item.message.time.getHours()}:{item.message.time.getMinutes()}</div>
                          </div>
                          <div>{/* 件名 */}
                            {item.message.title}
                          </div>
                          <div>{/* 本文 */}
                            {item.message.contents}
                          </div>
                        </div>
                      </div>
                    </MailItem>
                  : <></>}
                </li>
              );
            })}
            </ul>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}


export const MailItem = function(
  props: {
    id: string,
    onDeleting: (id: string) => void,
    onDeleted: (id: string) => void,
    children: React.ReactNode
  }
) 
{
  //■スワイプ中の情報
  const [deltaX, setDeltaX] = React.useState<number | undefined>(undefined);
  //■削除中かどうか
  const [deletengState, setDeletengState] = React.useState<"none" | "right" | "left">("none");

  //■ルートエレメントの取得
  const rootElement = React.useRef<HTMLDivElement>(null);

  //■デフォルトの幅の保持
  const defaultWidth = React.useRef(0);

  //■スワイプで削除
  const swipeHandler = useSwipeable({ 
    onSwiping: (eventData) => {
      setDeltaX(eventData.deltaX);
    },
    onSwiped: (eventData) => {
      if(eventData.deltaX > 100 || eventData.deltaX < -100){
        //■100px以上のスワイプがあれば削除へ。
        props.onDeleting(props.id);//親へ削除の通知
        setDeletengState(eventData.deltaX > 0 ? "right" : "left");
        window.setTimeout(() => {
          setDeltaX(undefined);
          setDeletengState("none");
          props.onDeleted(props.id);
        }, 200);
      }
      else{
        //■100px以上のスワイプがなければ戻す。
        setDeltaX(undefined);
      }
    }
  }); 

  //■デフォルトの幅の取得
  React.useEffect(() => {
    defaultWidth.current = rootElement.current != null ? rootElement.current.clientWidth : 0;
  }, [rootElement.current, rootElement.current?.clientWidth]);


  //■スワイプ用のスタイル
  const swipeStyle = deletengState !== "none" ? {//
    marginLeft: defaultWidth.current * (deletengState === "right" ? 1 : -1),
  } as React.CSSProperties : deltaX != null ? {
    position: "relative",
    marginLeft: deltaX
  } as React.CSSProperties : undefined;
  return (
    <div className={styles.mailItemRoot} ref={rootElement}>
      <div style={swipeStyle} {...swipeHandler}>
        {props.children}
      </div>
    </div>
  );
}