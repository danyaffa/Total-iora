// FILE: /pages/_app.js

import { useEffect } from "react";
import "../styles/globals.css";
import ReviewWidget from "../components/ReviewWidget";

export default function App({ Component, pageProps }) {
  // Register Service Worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("SW registration failed:", err);
        });
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      {/* Floating review pill, bottom-right on every page */}
      <ReviewWidget />
    </>
  );
}
