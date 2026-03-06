// FILE: /pages/contact.js
// Redirects to FAQ section — no email contact needed
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";

export default function Contact() {
  useEffect(() => {
    // Auto-redirect to FAQ after a moment
    const timer = setTimeout(() => {
      window.location.replace("/#faq");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page">
      <Head>
        <title>Help & FAQ | Total-iora</title>
        <meta name="description" content="Get answers to your questions about Total-iora via our FAQ." />
      </Head>

      <nav className="topnav">
        <Link href="/" className="backLink">&larr; Back to Home</Link>
      </nav>

      <main className="main">
        <div className="card">
          <h1>Need Help?</h1>
          <p>
            All support is available through our <strong>FAQ section</strong>.
            You can also manage your account directly from the{" "}
            <Link href="/delete-account" className="link">Manage Account</Link> page.
          </p>
          <div className="actions">
            <Link href="/#faq" className="btn primary">Go to FAQ</Link>
            <Link href="/delete-account" className="btn secondary">Manage Account</Link>
          </div>
          <p className="note">Redirecting to FAQ in a moment...</p>
          <p className="copyright">
            &copy; {new Date().getFullYear()} Leffler International Investments
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(#fff, #f8fafc);
        }
        .topnav {
          padding: 18px 16px;
          text-align: center;
        }
        .backLink {
          color: #7c3aed;
          font-weight: 800;
          text-decoration: underline;
        }
        .main {
          padding: 40px 16px;
        }
        .card {
          max-width: 520px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 34px;
          box-shadow: 0 14px 40px rgba(2, 6, 23, 0.06);
          text-align: center;
        }
        h1 {
          font-size: 1.8rem;
          margin: 0 0 12px;
          font-weight: 900;
          color: #0f172a;
        }
        p {
          color: #475569;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .link {
          color: #7c3aed;
          font-weight: 700;
          text-decoration: underline;
        }
        .actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.95rem;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .btn.primary {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
        }
        .btn.secondary {
          color: #0f172a;
          border: 2px solid #e2e8f0;
          background: #fff;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .note {
          color: #94a3b8;
          font-size: 0.85rem;
        }
        .copyright {
          color: #94a3b8;
          font-size: 0.8rem;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
