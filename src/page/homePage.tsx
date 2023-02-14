import React from 'react';
import { PageLayout } from '../layout/pageLayout';
import styles from "./homePage.module.scss";
import DehazeIcon from '@mui/icons-material/Dehaze';
import { apimodel } from '../api';
import { useAxios } from '../lib/axios';
import { Avatar } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useHistory } from 'react-router-dom';

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
  const [messages, setMessages] = React.useState<apimodel.Message[] | undefined>(undefined);

  //■フォルダ一覧
  const [folders, setFolders] = React.useState(["受信トレイ", "ゴミ箱", "迷惑メール"]);

  const [currentFolder, setCurrentFolder] = React.useState("受信トレイ");

  //■データの取得
  React.useEffect(() => {
    (async () => {
      const response = await axios.get(`v1/messages?keyword=${keword}`);
      const data = response.data as apimodel.Message[];
      setMessages(data);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keword]);

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
  return (
    <PageLayout title="メール一覧" isInitialized={messages != null}>
      <div className={styles.root}>
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
                <li key={index} onClick={e => {e.preventDefault(); history.push(`./mails/${item.id}`)}}>
                  <div>{/* アバター */}
                    <Avatar sx={{ width: 45, height: 45 }}>{item.from.substring(0, 1)}</Avatar>
                  </div>
                  <div>{/* 詳細 */}
                    <div>{/* 送信元と時刻 */}
                      <div>{item.from}</div>
                      <div>{item.time.getHours()}:{item.time.getMinutes()}</div>
                    </div>
                    <div>{/* 件名 */}
                      {item.title}
                    </div>
                    <div>{/* 本文 */}
                      {item.contents}
                    </div>
                  </div>
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