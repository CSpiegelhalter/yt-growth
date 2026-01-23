"use client";

import styles from "./style.module.css";

export default function ErrorAlert({ message }: { message: string }) {
  return <div className={styles.alert}>{message}</div>;
}
