import '../styles/globals.css';
import AppLayout from '../components/AppLayout';

function MyApp({ Component, pageProps }) {
  // Use the layout defined at the page level, if available.
  // Otherwise, use the default AppLayout.
  const getLayout = Component.getLayout || ((page) => <AppLayout>{page}</AppLayout>);

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;
