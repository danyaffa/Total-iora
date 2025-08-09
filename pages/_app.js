// FILE: /pages/_app.js
import "@/styles/globals.css";
import AppLayout from "../components/AppLayout";

export default function MyApp({ Component, pageProps }) {
  return (
    <AppLayout>
      <Component {...pageProps} />
    </AppLayout>
  );
}
