import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
