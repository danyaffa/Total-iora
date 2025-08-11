// FILE: /pages/_app.js
import "@/styles/globals.css";

// REMOVE the AccessGate import and wrapper.
// Keep your app exactly as-is so visitors can read everything pre-login.
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
