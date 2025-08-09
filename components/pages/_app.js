import "../styles/globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Header />
      <main>
        <div className="container">
          <Component {...pageProps} />
        </div>
      </main>
      <Footer />
    </>
  );
}
