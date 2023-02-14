import React from "react";
import styles from "./modalPanel.module.scss";
export const ModalPanel = function(
  props: {
    isVisible: boolean;
    children: React.ReactNode | React.ReactNode[];
  }
) {
  return (
    <>
      {
        props.isVisible ? 
          <div className={styles.modalPanel}>
            <article>{props.children}</article>
          </div>
        : <></>
      }
    </>
  );
};