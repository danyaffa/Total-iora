// FILE: /pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {/* Only render the app. No hero/header/extra markup here. */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
