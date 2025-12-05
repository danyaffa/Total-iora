// FILE: /pages/_app.js

import "../styles/globals.css";
import ReviewWidget from "../components/ReviewWidget";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      {/* Floating 4.9/5 pill, bottom-right on every page */}
      <ReviewWidget />
    </>
  );
}
