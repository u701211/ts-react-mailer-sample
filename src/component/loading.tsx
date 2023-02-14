import React from "react";
import styles from "./loading.module.scss";


/**
 * Loadingのコンポーネント
 * @param props なし
 */
export const Loading = function(
  props: {
    size: number,
  }
) 
{
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.root} style={{width: props.size, height: props.size}} >
      <defs>
        <linearGradient id="g0">
          <stop offset="0.01" stopColor="blue"/>
          <stop offset="0.99" stopColor="white"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="30" stroke="url(#g0)" strokeWidth="10" fillOpacity="0"/>
    </svg>
  );
};