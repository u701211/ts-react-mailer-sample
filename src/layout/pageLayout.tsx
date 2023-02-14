import React from "react";
import { LoadingPage } from "../component/loadingPage";
import styles from "./pageLayout.module.scss";

export const PageLayout = (
  props: {
    title: string,
    isInitialized?: boolean,
    children: React.ReactNode
  }
) => {
  const isInitialized = props.isInitialized != null ? props.isInitialized : true;
  //■Windowタイトルの修正
  React.useEffect(() => {
    document.title = `メーラサンプル - ${props.title}`;
  }, [props.title]);

  return (
    <div className={styles.root}>
      {isInitialized ? props.children : <LoadingPage isVisible={true} />}
    </div>
  );
}