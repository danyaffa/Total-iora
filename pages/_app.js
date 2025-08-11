// FILE: /pages/_app.js
import "@/styles/globals.css";
import AccessGate from "@/components/AccessGate";

// NOTE: This wraps your entire app with the gate overlay.
// Your /pages/index.js stays EXACTLY as you wrote it.
export default function App({ Component, pageProps }) {
  return (
    <>
      <AccessGate />
      <Component {...pageProps} />
    </>
  );
}
